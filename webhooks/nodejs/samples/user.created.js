// HR Folder + NDA Generation + Group Assignment

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Generate HMAC-SHA256 signature
function getSecretHash(secretKey, body) {
    return (
        "sha256=" +
        crypto.createHmac("sha256", secretKey).update(body).digest("hex").toUpperCase()
    );
}

app.post("/webhook", async (req, res) => {
    const sig = req.headers["x-docspace-signature-256"];
    if (!sig) {
        console.error("Unsigned request");
        return res.sendStatus(401);
    }

    const secretKey = process.env.WEBHOOK_SECRET_KEY;
    const body = JSON.stringify(req.body);
    const hash = getSecretHash(secretKey, body);

    if (sig !== hash) {
        console.error("Invalid signature");
        return res.sendStatus(401);
    }

    const event = req.body?.event?.trigger;
    if (event !== "user.created") return res.sendStatus(200);

    const user = req.body.payload;
    const fullName = `${user.firstName} ${user.lastName}`;
    const hrFolderId = process.env.HR_FOLDER_ID;

    try {
        // Step 1: Create personal HR folder
        const folderResponse = await axios.post(
            `${process.env.PORTAL_URL}/api/2.0/files/folder/${hrFolderId}`,
            {
                title: fullName,
                parentId: hrFolderId
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const personalFolderId = folderResponse.data.response.id;
        console.log(`HR folder "${fullName}" created`);

        // Step 2: Copy NDA template to the user's folder
        const ndaFileTitle = `NDA_${user.firstName}_${user.lastName}.docx`;

        await axios.post(
            `${process.env.PORTAL_URL}/api/2.0/files/copy`,
            {
                fileId: process.env.NDA_TEMPLATE_FILE_ID,
                folderId: personalFolderId,
                title: ndaFileTitle
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`NDA file created: ${ndaFileTitle}`);

        // Step 3: Add user to the "New Hires" group
        await axios.post(
            `${process.env.PORTAL_URL}/api/2.0/group/${process.env.NEW_HIRES_GROUP_ID}/add`,
            {
                userIds: [user.id]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`User ${fullName} added to New Hires group`);
        res.sendStatus(200);
    } catch (err) {
        console.error("Error processing user.created event:", err.response?.data || err.message);
        res.sendStatus(500);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
});
