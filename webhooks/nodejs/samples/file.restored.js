// Notify Room + Admin + Log Sensitive File Restore

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

const SENSITIVE_KEYWORDS = ["contract", "finance", "nda"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  if (trigger !== "file.restored") return res.sendStatus(200);

  const { id: fileId, title, rootId: roomId, createBy } = req.body.payload;
  const lowerTitle = title.toLowerCase();

  console.log(`File restored: "${title}"`);

  try {
    // Step 1: Get room participants
    const roomShare = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const users = roomShare.data.access || [];

    // Step 2: Notify all users
    for (const user of users) {
      const email = user.sharedTo?.email;
      if (!email) continue;

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: email,
          subject: "File restored",
          message: `The file "${title}" has been restored in Room #${roomId}.`
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      console.log(`Notified user: ${email}`);
    }

    // Step 3: If sensitive file - notify admin and log
    const isSensitive = SENSITIVE_KEYWORDS.some(kw => lowerTitle.includes(kw));

    if (isSensitive) {
      // Get user info
      const userInfo = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`
          }
        }
      );

      const userEmail = userInfo.data?.email || "unknown";
      const userName = `${userInfo.data?.firstName || ""} ${userInfo.data?.lastName || ""}`.trim();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const logFileName = `sensitive_restore_${fileId}_${timestamp}.json`;
      const logFilePath = path.join(__dirname, logFileName);

      // Build log object
      const logData = {
        fileId,
        title,
        restoredAt: new Date().toISOString(),
        roomId,
        restoredBy: { userId: createBy, name: userName, email: userEmail }
      };

      fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));

      // Upload log to DocSpace
      const form = new FormData();
      form.append("file", fs.createReadStream(logFilePath));

      const uploadRes = await axios.post(
        `${process.env.PORTAL_URL}/api/2.0/files/folder/${process.env.RESTORE_LOG_FOLDER_ID}/upload`,
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

      fs.unlinkSync(logFilePath);

      // Notify admin
      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive file restored",
          message: `The sensitive file "${title}" was restored by ${userName} (${userEmail}).\n\nRoom ID: ${roomId}\nLog: ${logUrl}`
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      console.log("Admin notified about sensitive restore");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error in file.restored handler:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
