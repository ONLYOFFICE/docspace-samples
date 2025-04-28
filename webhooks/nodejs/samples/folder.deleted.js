// Archive + Notify + Recovery for Deleted Folders

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
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

const ARCHIVE_TAGS = ["contract", "invoice", "legal"];
const SENSITIVE_PATH_KEYWORDS = ["HR", "Finance", "Clients"];

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-docspace-signature-256"];
  const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, req.rawBody);
  if (signature !== computedSignature) return res.sendStatus(401);

  const { trigger } = req.body.event;
  const { title: folderTitle, id: folderId, rootId, createBy } = req.body.payload;

  if (trigger !== "folder.deleted") return res.sendStatus(200);
  console.log(`Folder permanently deleted: ${folderTitle}`);

  try {
    // Step 1: Get user info
    const userInfo = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/people/${createBy}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const email = userInfo.data?.email || null;
    const fullName = `${userInfo.data?.firstName || ""} ${userInfo.data?.lastName || ""}`.trim();

    // Step 2: Get folder metadata
    const folderDetails = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/files/${folderId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`
        }
      }
    );

    const folderTags = folderDetails.data?.response?.tags || [];
    const folderPath = folderDetails.data?.response?.path || "";

    // Step 3: If tagged, archive to Box
    if (folderTags.some(tag => ARCHIVE_TAGS.includes(tag.toLowerCase()))) {
      const listRes = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/files/${folderId}/list`,
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`
          }
        }
      );

      const files = listRes.data.response.filter(item => !item.folder);
      const boxFolder = await axios.post(
        "https://api.box.com/2.0/folders",
        {
          name: `Archive_${folderTitle}_${new Date().toISOString().slice(0, 10)}`,
          parent: { id: "0" }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.BOX_ACCESS_TOKEN}`
          }
        }
      );

      const boxFolderId = boxFolder.data.id;

      for (const file of files) {
        const download = await axios.get(
          `${process.env.PORTAL_URL}/api/2.0/files/${file.id}/download`,
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`
            },
            responseType: "stream"
          }
        );

        const tempPath = path.join(__dirname, file.title);
        const writer = fs.createWriteStream(tempPath);
        await new Promise((resolve, reject) => {
          download.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        const form = new FormData();
        form.append("attributes", JSON.stringify({
          name: file.title,
          parent: { id: boxFolderId }
        }));
        form.append("file", fs.createReadStream(tempPath));

        await axios.post("https://upload.box.com/api/2.0/files/content", form, {
          headers: {
            Authorization: `Bearer ${process.env.BOX_ACCESS_TOKEN}`,
            ...form.getHeaders()
          }
        });

        fs.unlinkSync(tempPath);
        console.log(`Archived to Box: ${file.title}`);
      }
    }

    // Step 4: Notify user with restore link
    if (email) {
      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: email,
          subject: "Folder deleted",
          message: `Your folder "${folderTitle}" (ID: ${folderId}) has been permanently deleted.\nIf this was a mistake, you can request recovery here:\n${process.env.RESTORE_URL_BASE}?folderId=${folderId}`
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Step 5: Notify admin if sensitive path
    const isSensitive = SENSITIVE_PATH_KEYWORDS.some(k => folderPath.includes(k));
    if (isSensitive) {
      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Sensitive folder deleted",
          message: `A folder "${folderTitle}" (ID: ${folderId}) was permanently deleted by ${fullName}.\nPath: ${folderPath}\nUser ID: ${createBy}`
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Error handling folder.deleted:", err.response?.data || err.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
