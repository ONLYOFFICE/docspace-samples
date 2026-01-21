// Admin and user notification about account status

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


async function notifyAdmin(subject, message) {
  await axios.post(
    process.env.NOTIFY_WEBHOOK_URL,
    {
      to: process.env.ADMIN_EMAIL,
      subject,
      message
    },
    { headers: { "Content-Type": "application/json" } }
  );
}


async function notifyUser(email, subject, message) {
  await axios.post(
    process.env.NOTIFY_WEBHOOK_URL,
    {
      to: email,
      subject,
      message
    },
    { headers: { "Content-Type": "application/json" } }
  );
}

app.post("/webhook", async (req, res) => {
  const sig = req.headers["x-docspace-signature-256"];
  if (!sig) return res.sendStatus(401);

  const secretKey = process.env.WEBHOOK_SECRET_KEY;
  const rawBody = JSON.stringify(req.body);
  const computedHash = getSecretHash(secretKey, rawBody);

  if (sig !== computedHash) return res.sendStatus(401);

  const event = req.body?.event?.trigger;
  const payload = req.body?.payload;

  if (event === "user.updated") {
    const userName = payload?.userName || "[no username]";
    const email = payload?.email || "[no email]";
    const status = payload?.status === 2 ? "inactive" : "active";
    const timestamp = new Date().toISOString();

    console.log(`User updated: ${userName} (${email}) - ${status}`);

    try {
      // Step 1: Notify admin
      await notifyAdmin(
        "👤 User Updated",
        `The user "${userName}" (Email: ${email}) has been updated.\nStatus: ${status}\nTime: ${timestamp}`
      );

      // Step 2: Notify user
      await notifyUser(
        email,
        "Your account status has been updated",
        `Dear ${userName},\n\nYour account status has been updated to: ${status}.\n\nIf you have any questions, please contact support.\n\nThank you!`
      );

      res.sendStatus(200);
    } catch (err) {
      console.error("Error notifying about user update:", err.response?.data || err.message);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
