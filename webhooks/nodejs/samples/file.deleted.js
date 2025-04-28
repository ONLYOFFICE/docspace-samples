// Archive Deleted Files to Box

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

// Search for a Box file by name
async function searchBoxFileByName(fileName) {
  try {
    const response = await axios.get(
      `https://api.box.com/2.0/search`,
      {
        params: {
          query: fileName,
          type: "file",
          content_types: "name"
        },
        headers: {
          Authorization: `Bearer ${process.env.BOX_ACCESS_TOKEN}`
        }
      }
    );

    const match = response.data.entries.find(entry => entry.name === fileName);
    return match || null;
  } catch (err) {
    console.error("Error searching file in Box:", err.response?.data || err.message);
    return null;
  }
}

// Move a file to Box archive folder
async function moveBoxFile(fileId, folderId) {
  try {
    await axios.put(
      `https://api.box.com/2.0/files/${fileId}`,
      {
        parent: { id: folderId }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BOX_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`File ${fileId} moved to Box folder ${folderId}`);
  } catch (err) {
    console.error("Error moving file in Box:", err.response?.data || err.message);
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
  const { id: fileId, title } = req.body.payload;

  if (trigger === "file.deleted") {
    console.log(`File deleted in DocSpace: "${title}"`);

    try {
      const boxFile = await searchBoxFileByName(title);
      if (boxFile) {
        await moveBoxFile(boxFile.id, process.env.BOX_ARCHIVE_FOLDER_ID);
      } else {
        console.log(`No matching file found in Box: "${title}"`);
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("Error during Box archive process:", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
