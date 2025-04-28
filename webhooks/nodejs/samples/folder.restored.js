// Sensitive Folder Restore Alert

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

const SENSITIVE_KEYWORDS = ["contract", "finance", "nda"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  if (trigger !== "folder.restored") return res.sendStatus(200);

  const { title: folderTitle, rootId, id: folderId } = req.body.payload;
  const lowerTitle = folderTitle.toLowerCase();

  console.log(`Folder restored: "${folderTitle}"`);

  try {
    // Step 1: Notify all users in the room
    const roomShare = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${rootId}/share`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
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
          subject: "Folder restored",
          message: `The folder "${folderTitle}" has been restored and is now visible again in Room #${rootId}.`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(`User notified: ${email}`);
    }

    // Step 2: If sensitive, notify admin
    const isSensitive = SENSITIVE_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

    if (isSensitive) {
      const timestamp = new Date().toISOString();

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive folder restored",
          message: `Sensitive folder "${folderTitle}" (ID: ${folderId}) was restored in Room #${rootId} on ${timestamp}.`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Admin notified about sensitive folder restoration");
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Error during folder.restore handling:", err.response?.data || err.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
