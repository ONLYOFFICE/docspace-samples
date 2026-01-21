// Log Deleted Group Members and Notify Owner

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
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

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);
  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  if (trigger !== "group.deleted") return res.sendStatus(200);

  const { id: groupId, name: groupName, createdBy } = req.body.payload;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFileName = `deleted_${groupName}_${timestamp}.json`;
  const logFilePath = path.join(__dirname, logFileName);

  console.log(`Group deleted: ${groupName} (${groupId})`);

  try {
    // Step 1: Get group members
    const groupInfo = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/group/${groupId}`,
      {
        params: { includeMembers: true },
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const members = groupInfo.data?.response?.members || [];

    // Step 2: Build log object
    const logData = {
      groupId,
      groupName,
      deletedAt: new Date().toISOString(),
      members: members.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        email: m.email
      }))
    };

    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));

    // Step 3: Upload log file to DocSpace
    const form = new FormData();
    form.append("file", fs.createReadStream(logFilePath));

    const uploadRes = await axios.post(
      `${process.env.PORTAL_URL}/api/2.0/files/folder/${process.env.GROUPS_LOG_FOLDER_ID}/upload`,
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          ...form.getHeaders()
        }
      }
    );

    const uploadedFile = uploadRes.data?.response?.[0];
    const fileUrl = `${process.env.PORTAL_URL}/file/${uploadedFile.id}`;

    fs.unlinkSync(logFilePath);

    // Step 4: Get group creator email
    const ownerInfo = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/people/${createdBy}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const ownerEmail = ownerInfo.data?.email;

    if (ownerEmail) {
      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: ownerEmail,
          subject: `Group "${groupName}" has been deleted`,
          message: `The group "${groupName}" has been permanently deleted.\n\nA log file with all group members has been saved:\n${fileUrl}`
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      console.log(`Notification sent to owner: ${ownerEmail}`);
    } else {
      console.warn("Group creator email not found");
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Error handling group.deleted:", err.response?.data || err.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
