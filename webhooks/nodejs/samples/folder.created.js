// Create Subfolders for "HR Onboarding"

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
  const { id: folderId, title } = req.body.payload;

  // Triggered when a folder named "HR Onboarding" is created
  if (trigger === "folder.created" && title === "HR Onboarding") {
    console.log(`HR Onboarding folder created, creating subfolders...`);

    const subfolders = ["Documents", "Passport Photos", "Signed Forms"];

    try {
      for (const subfolderName of subfolders) {
        await axios.post(
          `${process.env.PORTAL_URL}/api/2.0/files/folder/${folderId}`,
          { title: subfolderName },
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        console.log(`Subfolder created: ${subfolderName}`);
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("Error while creating HR subfolders:", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
