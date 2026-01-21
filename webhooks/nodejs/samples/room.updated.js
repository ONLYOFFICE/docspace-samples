// Room Updated - Participant Notification and Critical Room Admin Alert

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

const SENSITIVE_ROOM_KEYWORDS = ["hr", "finance", "legal", "management", "clients"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) {
    console.warn("Invalid signature");
    return res.sendStatus(401);
  }

  const { trigger } = req.body.event;
  if (trigger !== "room.updated") return res.sendStatus(200);

  const { title: roomTitle, rootId: roomId, createBy } = req.body.payload;
  const lowerRoomTitle = roomTitle.toLowerCase();
  const timestamp = new Date().toISOString();

  console.log(`Room updated: "${roomTitle}" (Room ID: ${roomId})`);

  try {
    // Step 1: Notify all participants
    const shareRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
      {
        headers: { Authorization: `Bearer ${process.env.API_KEY}` }
      }
    );

    const users = shareRes.data.access || [];

    for (const user of users) {
      const email = user.sharedTo?.email;
      if (!email) continue;

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: email,
          subject: `Room updated: "${roomTitle}"`,
          message: `The room "${roomTitle}" has been updated. Please review the changes.`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(`User notified: ${email}`);
    }

    // Step 2: If sensitive room - notify admin
    const isSensitive = SENSITIVE_ROOM_KEYWORDS.some(keyword => lowerRoomTitle.includes(keyword));

    if (isSensitive) {
      // Get creator info
      const creatorInfo = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
        {
          headers: { Authorization: `Bearer ${process.env.API_KEY}` }
        }
      );

      const creatorName = `${creatorInfo.data?.firstName || ""} ${creatorInfo.data?.lastName || ""}`.trim();
      const creatorEmail = creatorInfo.data?.email || "[unknown]";

      const adminMessage = `
Critical room "${roomTitle}" has been updated.

Room ID: ${roomId}
Updated By: ${creatorName} (${creatorEmail})
Time: ${timestamp}
      `.trim();

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Critical Room Updated",
          message: adminMessage
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Admin notified about critical room update.");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling room.updated:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
