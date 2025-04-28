// Admin notification for critical folders

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
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

const SENSITIVE_FOLDER_KEYWORDS = ["contracts", "finance", "hr", "legal", "clients"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) {
    console.warn("Invalid signature");
    return res.sendStatus(401);
  }

  const { trigger } = req.body.event;
  if (trigger !== "folder.updated") return res.sendStatus(200);

  const { id: folderId, title: newTitle, rootId: roomId, createBy, previousTitle } = req.body.payload;
  const lowerNewTitle = newTitle.toLowerCase();
  const timestamp = new Date().toISOString();

  console.log(`Folder renamed: "${previousTitle || "[unknown]"}" → "${newTitle}" (Room ID: ${roomId})`);

  try {
    // Step 1: Notify room participants
    const roomShare = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
      {
        headers: { Authorization: `Bearer ${process.env.API_KEY}` }
      }
    );

    const users = roomShare.data.access || [];

    for (const user of users) {
      const email = user.sharedTo?.email;
      if (!email) continue;

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: email,
          subject: "Folder renamed",
          message: `The folder has been renamed to "${newTitle}". Please check the updated structure.`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(`User notified: ${email}`);
    }

    // Step 2: If sensitive folder - notify admin
    const isSensitive = SENSITIVE_FOLDER_KEYWORDS.some(keyword => lowerNewTitle.includes(keyword));

    if (isSensitive) {
      const creatorInfo = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
        {
          headers: { Authorization: `Bearer ${process.env.API_KEY}` }
        }
      );

      const roomInfo = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}`,
        {
          headers: { Authorization: `Bearer ${process.env.API_KEY}` }
        }
      );

      const creatorName = `${creatorInfo.data?.firstName || ""} ${creatorInfo.data?.lastName || ""}`.trim();
      const creatorEmail = creatorInfo.data?.email || "[unknown]";
      const roomTitle = roomInfo.data?.response?.title || "[Unknown Room]";
      const oldTitle = previousTitle || "[unknown]";

      const adminMessage = `
Sensitive folder renamed.

Previous Folder Title: "${oldTitle}"
New Folder Title: "${newTitle}"

Room: "${roomTitle}" (ID: ${roomId})
Renamed By: ${creatorName} (${creatorEmail})
Date: ${timestamp}
      `.trim();

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive Folder Renamed",
          message: adminMessage
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Admin notified about sensitive folder rename");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling folder.updated:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
