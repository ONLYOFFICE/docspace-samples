// Sensitive Folder Move Alert + Owner Notification

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

// Keywords to flag sensitive folders
const SENSITIVE_KEYWORDS = ["contract", "finance", "nda"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);
  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  if (trigger !== "folder.moved") return res.sendStatus(200);

  const { title: folderTitle, rootId, createBy, id: folderId } = req.body.payload;

  console.log(`Folder moved: "${folderTitle}"`);

  try {
    // Step 1: Get user info
    const userInfo = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const userEmail = userInfo.data?.email;
    const userName = `${userInfo.data?.firstName || ""} ${userInfo.data?.lastName || ""}`.trim();

    // Step 2: Notify user
    if (userEmail) {
      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: userEmail,
          subject: "Folder moved",
          message: `The folder "${folderTitle}" has been moved to a new location in the room structure.`
        },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(`User notified: ${userEmail}`);
    }

    // Step 3: Get folder details (for tags)
    const folderMeta = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/${folderId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const folderTags = folderMeta.data?.response?.tags || [];
    const lowerTitle = folderTitle.toLowerCase();
    const combined = [lowerTitle, ...folderTags.map(t => t.toLowerCase())].join(" ");

    const isSensitive = SENSITIVE_KEYWORDS.some(keyword => combined.includes(keyword));

    // Step 4: If sensitive - notify admin
    if (isSensitive) {
      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive folder moved",
          message: `User "${userName}" moved a sensitive folder: "${folderTitle}"\n\nFolder ID: ${folderId}\nRoom ID: ${rootId}`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Admin notified about sensitive move");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling folder.moved:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
