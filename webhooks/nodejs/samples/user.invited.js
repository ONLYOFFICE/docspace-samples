// Welcome Room Access and HR Folder Creation on User Invite

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json({ verify: rawBodySaver }));

function rawBodySaver(req, res, buf) {
  req.rawBody = buf.toString();
}

function getSecretHash(secretKey, payload) {
  return (
    "sha256=" +
    crypto.createHmac("sha256", secretKey).update(payload).digest("hex")
  );
}

app.post("/webhook", async (req, res) => {
  const sig = req.headers["x-docspace-signature-256"];
  const computedSig = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);
  if (!sig || sig !== computedSig) return res.sendStatus(401);

  const event = req.body?.event?.trigger;
  if (event !== "user.invited") return res.sendStatus(200);

  const user = req.body.payload;
  const fullName = user.userName || `${user.firstName} ${user.lastName}`;
  const email = user.email;

  try {
    // Step 1: Grant access to Welcome Room
    await axios.post(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${process.env.WELCOME_ROOM_ID}/share`,
      {
        shareTo: {
          email,
        },
        access: 2 // Full access, adjust if needed
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`Access granted to Welcome Room for ${email}`);

    // Step 2: Create personal folder in HR (if it doesn't exist)
    const foldersRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/${process.env.HR_FOLDER_ID}/list`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const exists = foldersRes.data.response.some(
      item => item.folder && item.title === fullName
    );

    let newFolderId = null;

    if (!exists) {
      const folderRes = await axios.post(
        `${process.env.PORTAL_URL}/api/2.0/files/folder/${process.env.HR_FOLDER_ID}`,
        {
          title: fullName
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      newFolderId = folderRes.data.response.id;
      console.log(`Created personal folder for ${fullName}`);
    }

    // Step 3: Notify admin
    const folderLink = newFolderId
      ? `${process.env.PORTAL_URL}/folder/${newFolderId}`
      : "already exists";

    await axios.post(
      process.env.NOTIFY_WEBHOOK_URL,
      {
        to: process.env.ADMIN_EMAIL,
        subject: `User invited: ${fullName}`,
        message: `A new user has been invited to DocSpace.\n\nName: ${fullName}\nEmail: ${email}\nFolder: ${folderLink}`
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log(`Admin notified about ${email}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error in user.invited handler:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
