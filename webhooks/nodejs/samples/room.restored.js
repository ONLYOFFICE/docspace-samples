// Room Restore - Notify Members, Admin, Audit Access

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

const SENSITIVE_ROOM_KEYWORDS = ["hr", "finance", "legal", "clients", "external"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(
    process.env.WEBHOOK_SECRET_KEY,
    req.rawBody
  );
  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  if (trigger !== "room.restored") return res.sendStatus(200);

  const { title: roomTitle, rootId: roomId, createBy } = req.body.payload;
  const lowerTitle = roomTitle.toLowerCase();
  const timestamp = new Date().toISOString();

  console.log(`Room restored: "${roomTitle}" (${roomId})`);

  try {
    // Step 1: Notify all room members
    const shareRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
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
          subject: "Room restored",
          message: `The room "${roomTitle}" has been restored and is now available.`
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      console.log(`User notified: ${email}`);
    }

    // Step 2: If sensitive room - notify admin with access list
    const isSensitive = SENSITIVE_ROOM_KEYWORDS.some(kw => lowerTitle.includes(kw));
    if (isSensitive) {
      // Get restorer info
      const restorerInfo = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
        {
          headers: { Authorization: `Bearer ${process.env.API_KEY}` }
        }
      );

      const restorerName = `${restorerInfo.data?.firstName || ""} ${restorerInfo.data?.lastName || ""}`.trim();
      const restorerEmail = restorerInfo.data?.email || "[unknown]";

      // Build access list with external user flag
      const accessList = users.map(user => {
        const email = user.sharedTo?.email || "[no email]";
        const isExternal = !email.endsWith("@onlyoffice.com");
        return `- ${email}${isExternal ? " (external)" : ""}`;
      }).join("\n");

      const message = `
Sensitive room "${roomTitle}" has been restored.

Restored by: ${restorerName} (${restorerEmail})
Room ID: ${roomId}
Date: ${timestamp}

Room Access List:
${accessList}
      `.trim();

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive room restored",
          message
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      console.log("Admin notified with access list");
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Error in room.restored handler:", err.response?.data || err.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
