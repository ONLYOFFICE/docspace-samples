// Archived room: full file export to Box storage

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
    title: roomTitle,
    rootId
  } = req.body.payload;

  if (trigger === "room.archived") {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const boxFolderName = `ARCHIVE_${roomTitle}_${today}`;

      // Step 1: Create a folder in Box
      const createFolderRes = await axios.post(
        "https://api.box.com/2.0/folders",
        {
          name: boxFolderName,
          parent: { id: "0" } // "0" is the root folder in Box
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.BOX_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      const boxFolderId = createFolderRes.data.id;
      console.log(`Box folder created: ${boxFolderName} (ID: ${boxFolderId})`);

      // Step 2: Get list of files in the archived room
      const filesRes = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/files/${rootId}/list`,
        {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const files = filesRes.data?.response || [];

      for (const file of files) {
        if (file.folder) continue; // skip folders

        const fileId = file.id;
        const fileName = file.title;

        // Step 3: Get download link for the file
        const downloadLinkRes = await axios.get(
          `${process.env.PORTAL_URL}/api/2.0/files/${fileId}/download`,
          {
            headers: {
              Authorization: `Bearer ${process.env.API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        const downloadUrl = downloadLinkRes.data?.response?.downloadUrl;
        if (!downloadUrl) {
          console.warn(`Skipping file ${fileName}, no download URL`);
          continue;
        }

        // Step 4: Download file temporarily
        const tempPath = path.join(__dirname, "temp", fileName);
        const fileData = await axios.get(downloadUrl, {
          responseType: "stream"
        });
        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(tempPath);
          fileData.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        // Step 5: Upload file to Box
        const form = new FormData();
        form.append("attributes", JSON.stringify({
          name: fileName,
          parent: { id: boxFolderId }
        }));
        form.append("file", fs.createReadStream(tempPath));

        await axios.post("https://upload.box.com/api/2.0/files/content", form, {
          headers: {
            Authorization: `Bearer ${process.env.BOX_ACCESS_TOKEN}`,
            ...form.getHeaders()
          }
        });

        console.log(`Uploaded "${fileName}" to Box folder ${boxFolderName}`);
        fs.unlinkSync(tempPath); // clean up
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("Error archiving room to Box:", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
