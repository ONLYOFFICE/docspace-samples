// Sensitive content alert and forbidden file protection

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

const SENSITIVE_KEYWORDS = ["contract", "nda", "invoice"];
const FORBIDDEN_EXTENSIONS = [".exe", ".bat", ".sh", ".zip"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) {
    console.warn("Invalid signature");
    return res.sendStatus(401);
  }

  const trigger = req.body?.event?.trigger;
  if (trigger !== "file.uploaded") return res.sendStatus(200);

  const { id: fileId, title, rootId: roomId, createBy } = req.body.payload;
  const lowerTitle = title.toLowerCase();
  const timestamp = new Date().toISOString();

  console.log(`New file uploaded: "${title}" (Room ID: ${roomId})`);

  try {
    // Step 1: Forbidden file type check
    const isForbidden = FORBIDDEN_EXTENSIONS.some(ext => lowerTitle.endsWith(ext));

    if (isForbidden) {
      await axios.delete(
        `${process.env.PORTAL_URL}/api/2.0/files/file/${fileId}`,
        {
          headers: { Authorization: `Bearer ${process.env.API_KEY}` }
        }
      );

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Forbidden file deleted",
          message: `A forbidden file "${title}" was uploaded and has been automatically deleted.\n\nRoom ID: ${roomId}\nTime: ${timestamp}`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(`Forbidden file "${title}" deleted and admin notified.`);
      return res.sendStatus(200);
    }

    // Step 2: Sensitive file name check
    const isSensitive = SENSITIVE_KEYWORDS.some(keyword => lowerTitle.includes(keyword));

    if (isSensitive) {
      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive file uploaded",
          message: `A sensitive file "${title}" has been uploaded.\n\nRoom ID: ${roomId}\nTime: ${timestamp}`
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(`Sensitive file "${title}" detected and admin notified.`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling file upload:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
