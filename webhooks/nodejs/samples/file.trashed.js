// Sensitive file deletion: admin notification and event logging

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
app.use(express.json({ verify: rawBodySaver }));

function rawBodySaver(req, res, buf) {
  req.rawBody = buf.toString();
}

function getSecretHash(secret, payload) {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex")
  );
}

const SENSITIVE_KEYWORDS = ["contract", "finance", "nda", "invoice", "confidential"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  if (trigger !== "file.trashed") return res.sendStatus(200);

  const { id: fileId, title, rootId: roomId, createBy } = req.body.payload;
  const lowerTitle = title.toLowerCase();
  const timestamp = new Date().toISOString();

  console.log(`File trashed: "${title}" (Room ID: ${roomId})`);

  try {
    // Step 1: Get room participants
    const shareRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
      {
        headers: { Authorization: `Bearer ${process.env.API_KEY}` }
      }
    );

    const users = shareRes.data.access || [];

    // Step 2: Notify all users
    for (const user of users) {
      const email = user.sharedTo?.email;
      if (!email) continue;

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: email,
          subject: "File deleted",
          message: `A file "${title}" has been deleted from Room #${roomId}.`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(`User notified: ${email}`);
    }

    // Step 3: Save deletion log
    const logData = {
      fileId,
      title,
      trashedAt: timestamp,
      roomId
    };

    const logFileName = `trashed_file_${fileId}_${timestamp.replace(/[:.]/g, "-")}.json`;
    const logPath = path.join(__dirname, logFileName);

    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    const form = new FormData();
    form.append("file", fs.createReadStream(logPath));

    const uploadRes = await axios.post(
      `${process.env.PORTAL_URL}/api/2.0/files/folder/${process.env.TRASH_LOG_FOLDER_ID}/upload`,
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          ...form.getHeaders()
        }
      }
    );

    const uploaded = uploadRes.data?.response?.[0];
    const logUrl = `${process.env.PORTAL_URL}/file/${uploaded.id}`;

    fs.unlinkSync(logPath);

    console.log("Deletion log uploaded");

    // Step 4: If sensitive - notify admin
    const isSensitive = SENSITIVE_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

    if (isSensitive) {
      const creatorInfo = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
        {
          headers: { Authorization: `Bearer ${process.env.API_KEY}` }
        }
      );

      const creatorName = `${creatorInfo.data?.firstName || ""} ${creatorInfo.data?.lastName || ""}`.trim();
      const creatorEmail = creatorInfo.data?.email || "[unknown]";

      const adminMessage = `
Sensitive file deleted.

File Title: "${title}"
File ID: ${fileId}
Room ID: ${roomId}
Deleted By: ${creatorName} (${creatorEmail})
Date: ${timestamp}

Access Deletion Log:
${logUrl}
      `.trim();

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive File Deleted",
          message: adminMessage
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Admin notified about sensitive file deletion");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling file.trashed:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
