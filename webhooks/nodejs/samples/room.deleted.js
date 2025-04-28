// Room Deletion - Notify Participants, Admin, and Save Access Log

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

const SENSITIVE_ROOM_KEYWORDS = ["hr", "finance", "legal", "clients", "external"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(
    process.env.WEBHOOK_SECRET_KEY,
    req.rawBody
  );
  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  if (trigger !== "room.deleted") return res.sendStatus(200);

  const { title: roomTitle, rootId: roomId, createBy } = req.body.payload;
  const lowerTitle = roomTitle.toLowerCase();
  const timestamp = new Date().toISOString();

  console.log(`Room deleted: "${roomTitle}" (${roomId})`);

  try {
    // Step 1: Get room participants and access types
    const shareRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
      {
        headers: { Authorization: `Bearer ${process.env.API_KEY}` }
      }
    );

    const users = shareRes.data.access || [];

    // Step 2: Notify all participants
    for (const user of users) {
      const email = user.sharedTo?.email;
      if (!email) continue;

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: email,
          subject: "Room deleted",
          message: `The room "${roomTitle}" has been deleted. If this is unexpected, please contact your administrator.`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(`User notified: ${email}`);
    }

    // Step 3: Save deletion access log
    const accessLog = users.map(user => ({
      email: user.sharedTo?.email || "[no email]",
      accessLevel: user.access || "[unknown]"
    }));

    const logData = {
      roomId,
      roomTitle,
      deletedAt: timestamp,
      accessBeforeDeletion: accessLog
    };

    const logFileName = `deleted_room_${roomId}_${timestamp.replace(/[:.]/g, "-")}.json`;
    const logPath = path.join(__dirname, logFileName);

    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    const form = new FormData();
    form.append("file", fs.createReadStream(logPath));

    const uploadRes = await axios.post(
      `${process.env.PORTAL_URL}/api/2.0/files/folder/${process.env.DELETION_LOG_FOLDER_ID}/upload`,
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

    console.log("Access log uploaded");

    // Step 4: If sensitive room - notify admin
    const isSensitive = SENSITIVE_ROOM_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
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
Sensitive room "${roomTitle}" has been deleted.

Deleted by: ${creatorName} (${creatorEmail})
Room ID: ${roomId}
Date: ${timestamp}

Access log before deletion:
${logUrl}
      `.trim();

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive Room Deleted",
          message: adminMessage
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Admin notified about sensitive room deletion");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling room.deleted:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
