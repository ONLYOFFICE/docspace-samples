//Block Disallowed File Types and Auto-Classify Uploaded Files

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

  if (trigger === "file.created") {
    console.log(`New file detected: "${title}", room ID: ${roomId}`);

    const lowerTitle = title.toLowerCase();

    // Block upload if file has disallowed extension
    const blockedExtensions = [".exe", ".bat", ".sh", ".zip"];
    const isBlocked = blockedExtensions.some(ext => lowerTitle.endsWith(ext));

    if (isBlocked) {
      try {
        await axios.delete(
          `${process.env.PORTAL_URL}/api/2.0/files/${fileId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        console.log(`Blocked and deleted file "${title}" due to disallowed extension`);

        await axios.post(
          process.env.NOTIFY_WEBHOOK_URL,
          {
            to: process.env.ADMIN_EMAIL,
            subject: "Blocked file upload",
            message: `User ID ${createBy} attempted to upload file "${title}" with a forbidden extension. The file was deleted.`
          },
          {
            headers: { "Content-Type": "application/json" }
          }
        );

        return res.sendStatus(200);
      } catch (err) {
        console.error("Error deleting blocked file:", err.response?.data || err.message);
        return res.sendStatus(500);
      }
    }

    // Classify files based on title
    const classificationRules = [
      {
        keyword: "invoice",
        tag: "Finance",
        targetFolderId: process.env.FOLDER_ID_FINANCE
      },
      {
        keyword: "contract",
        tag: "Legal",
        targetFolderId: process.env.FOLDER_ID_LEGAL
      },
      {
        keyword: "nda",
        tag: "Confidential",
        targetFolderId: process.env.FOLDER_ID_CONFIDENTIAL
      }
    ];

    const matchedRule = classificationRules.find(rule =>
      lowerTitle.includes(rule.keyword)
    );

    if (matchedRule) {
      try {
        // Assign tag
        await axios.put(
          `${process.env.PORTAL_URL}/api/2.0/files/${fileId}`,
          { tags: [matchedRule.tag] },
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        // Move to target folder
        await axios.post(
          `${process.env.PORTAL_URL}/api/2.0/files/move`,
          {
            fileIds: [fileId],
            folderId: matchedRule.targetFolderId
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        console.log(`Classified "${title}" as "${matchedRule.tag}" and moved to folder ${matchedRule.targetFolderId}`);
      } catch (err) {
        console.error("Error classifying or moving file:", err.response?.data || err.message);
        return res.sendStatus(500);
      }
    }

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// Start webhook server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
