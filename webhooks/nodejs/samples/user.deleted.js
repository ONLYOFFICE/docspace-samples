// Archive, Audit, Group Cleanup on User Deletion

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
  const sig = req.headers["x-docspace-signature-256"];
  const computedSig = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);
  if (sig !== computedSig) return res.sendStatus(401);

  const event = req.body?.event?.trigger;
  if (event !== "user.deleted") return res.sendStatus(200);

  const user = req.body?.payload;
  const fullName = `${user.firstName} ${user.lastName}`;
  const userEmail = user.email;
  const userId = user.id;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFileName = `user_deleted_${userId}_${timestamp}.json`;
  const logPath = path.join(__dirname, logFileName);

  try {
    console.log(`Processing deletion of user: ${fullName}`);

    // Step 1: Move personal folder to archive
    await axios.put(
      `${process.env.PORTAL_URL}/api/2.0/files/move`,
      {
        folderIds: [user.personalFolderId],
        folderId: process.env.ARCHIVE_FOLDER_ID
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("Folder archived");

    // Step 2: Collect group memberships
    const groupsRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/group`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const groups = groupsRes.data.response || [];
    const userGroups = groups.filter(group =>
      (group.members || []).some(m => m.id === userId)
    );

    // Step 3: Remove from groups
    for (const group of userGroups) {
      await axios.post(
        `${process.env.PORTAL_URL}/api/2.0/group/${group.id}/remove`,
        { userIds: [userId] },
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      console.log(`Removed from group: ${group.name}`);
    }

    // Step 4: Collect files by user
    const filesRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/filter`,
      {
        params: { createdBy: userId },
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const files = filesRes.data.response || [];

    // Step 5: Build log file
    const report = {
      userId,
      fullName,
      email: userEmail,
      deletedAt: new Date().toISOString(),
      groups: userGroups.map(g => ({ id: g.id, name: g.name })),
      ownedFiles: files.map(f => ({ id: f.id, title: f.title }))
    };

    fs.writeFileSync(logPath, JSON.stringify(report, null, 2));

    // Step 6: Upload log to DocSpace
    const form = new FormData();
    form.append("file", fs.createReadStream(logPath));

    const uploadRes = await axios.post(
      `${process.env.PORTAL_URL}/api/2.0/files/folder/${process.env.AUDIT_FOLDER_ID}/upload`,
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          ...form.getHeaders()
        }
      }
    );

    const fileInfo = uploadRes.data?.response?.[0];
    const fileUrl = `${process.env.PORTAL_URL}/file/${fileInfo.id}`;
    fs.unlinkSync(logPath);

    // Step 7: Notify admin
    await axios.post(
      process.env.NOTIFY_WEBHOOK_URL,
      {
        to: process.env.ADMIN_EMAIL,
        subject: `User deleted: ${fullName}`,
        message: `User ${fullName} (${userEmail}) has been deleted.\n\nAudit log: ${fileUrl}`
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log("Admin notified and log saved");
    res.sendStatus(200);
  } catch (err) {
    console.error("Error during user deletion handling:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
