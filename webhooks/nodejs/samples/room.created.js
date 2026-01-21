// Auto-Structure and Access Based on Room Name

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

// Create default subfolders in a new room
async function createSubfolders(roomId) {
  const folderNames = ["Documents", "Tasks", "Files", "Reports"];
  for (const name of folderNames) {
    await axios.post(
      `${process.env.PORTAL_URL}/api/2.0/files/folder/${roomId}`,
      { title: name },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`Subfolder created: ${name}`);
  }
}

// Assign group access based on room title
async function assignAccess(roomId, roomTitle) {
  const accessList = [];

  if (roomTitle.startsWith("HR_")) {
    accessList.push(process.env.HR_GROUP_ID);
  } else if (roomTitle.startsWith("Project_")) {
    accessList.push(process.env.PROJECT_TEAM_GROUP_ID);
  } else if (roomTitle.startsWith("Clients_")) {
    accessList.push(process.env.SALES_GROUP_ID, process.env.LEGAL_GROUP_ID);
  }

  for (const groupId of accessList) {
    await axios.post(
      `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
      {
        shareTo: [
          {
            id: groupId,
            isGroup: true,
            permissions: {
              read: true,
              edit: true,
              download: true
            }
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`Access granted to group ${groupId}`);
  }
}

// Webhook handler
app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);

  if (signature !== computedSignature) {
    console.warn("Invalid signature");
    return res.sendStatus(401);
  }

  const { trigger } = req.body.event;
  const { title: roomTitle, rootId: roomId } = req.body.payload;

  if (trigger === "room.created") {
    console.log(`New room created: "${roomTitle}"`);

    try {
      await createSubfolders(roomId);
      await assignAccess(roomId, roomTitle);
      return res.sendStatus(200);
    } catch (err) {
      console.error("Error during room setup:", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
