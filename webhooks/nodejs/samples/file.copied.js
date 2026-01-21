// Block confidential file copies

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json({ verify: rawBodySaver }));

// Save raw body for signature verification
function rawBodySaver(req, res, buf) {
  req.rawBody = buf.toString();
}

// Generate HMAC-SHA256 signature
function getSecretHash(secret, payload) {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex")
  );
}

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) {
    console.warn("Invalid signature");
    return res.sendStatus(401);
  }

  const { trigger } = req.body.event;
  const {
    id: fileId,
    title,
    rootId: roomId,
    createBy
  } = req.body.payload;

  // Handle file.copied event
  if (trigger === "file.copied") {
    console.log(`File copy detected: "${title}" in room #${roomId}`);

    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("confidential")) {
      console.log(`Blocked file copy attempt: "${title}" (ID: ${fileId})`);

      try {
        // Delete the copied file
        await axios.delete(
          `${process.env.PORTAL_URL}/api/2.0/files/${fileId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        console.log(`Copied file "${title}" deleted successfully`);

        // Notify admin about the blocked copy
        await axios.post(
          process.env.NOTIFY_WEBHOOK_URL,
          {
            to: process.env.ADMIN_EMAIL,
            subject: "Blocked confidential file copy",
            message: `A user with ID ${createBy} attempted to copy a confidential file "${title}" in room #${roomId}. The copy has been deleted.`
          },
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        console.log("Admin notified about blocked copy");

        return res.sendStatus(200);
      } catch (err) {
        console.error("Error while blocking confidential file copy:", err.response?.data || err.message);
        return res.sendStatus(500);
      }
    }

    // If not a confidential file, allow copy silently or handle normally
    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// Start webhook server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
