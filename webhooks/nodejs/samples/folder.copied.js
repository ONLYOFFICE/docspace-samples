// Rename Copied Folder

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
  const computedSignature = getSecretHash(
    process.env.WEBHOOK_SECRET_KEY,
    req.rawBody
  );

  if (signature !== computedSignature) {
    console.warn("Invalid signature");
    return res.sendStatus(401);
  }

  const { trigger } = req.body.event;
  const {
    id: folderId,
    title: folderTitle,
    createBy
  } = req.body.payload;

  // Handle folder copied event
  if (trigger === "folder.copied") {
    console.log(`Folder "${folderTitle}" was copied (ID: ${folderId})`);

    try {
      // Generate new folder name with date
      const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
      const newTitle = `${folderTitle}_COPY_${today}`;

      // Rename the folder via API
      await axios.put(
        `${process.env.PORTAL_URL}/api/2.0/folders/${folderId}/rename`,
        { title: newTitle },
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log(`Folder renamed to "${newTitle}"`);

      // Optionally: notify the user who copied the folder
      const userInfo = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const email = userInfo.data?.email;
      if (email) {
        await axios.post(
          process.env.NOTIFY_WEBHOOK_URL,
          {
            to: email,
            subject: `Folder copied`,
            message: `You copied the folder "${folderTitle}". It has been renamed to "${newTitle}".`
          },
          { headers: { "Content-Type": "application/json" } }
        );

        console.log(`Notification sent to ${email}`);
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("Error handling folder.copied:", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
