// Create Room and Generate NDA for Each Group Member

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Save raw body for signature verification
function rawBodySaver(req, res, buf) {
    req.rawBody = buf.toString();
}

// Generate HMAC-SHA256 signature
function getSecretHash(secretKey, body) {
    return (
        "sha256=" +
        crypto.createHmac("sha256", secretKey).update(body).digest("hex").toUpperCase()
    );
}

// Send notification to HR
async function notifyHR(subject, message) {
    try {
        await axios.post(
            process.env.NOTIFY_WEBHOOK_URL,
            {
                to: process.env.HR_EMAIL,
                subject,
                message
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );
        console.log(`HR notified: ${subject}`);
    } catch (err) {
        console.error("Failed to notify HR:", err.response?.data || err.message);
    }
}

// Create a new Room
async function createRoom(title) {
    const response = await axios.post(
        `${process.env.PORTAL_URL}/api/2.0/files/room`,
        { title },
        {
            headers: {
                Authorization: `Bearer ${process.env.API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data.response;
}

// Create subfolders inside a Room
async function createSubfolders(roomId, folders) {
    for (const folderName of folders) {
        await axios.post(
            `${process.env.PORTAL_URL}/api/2.0/files/folder/${roomId}`,
            { title: folderName },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(`Subfolder created: ${folderName}`);
    }
}

// Assign group access to a Room
async function assignGroupAccess(roomId, groupId) {
    await axios.post(
        `${process.env.PORTAL_URL}/api/2.0/files/rooms/${roomId}/share`,
        {
            shareTo: [{
                id: groupId,
                isGroup: true,
                permissions: { read: true, edit: true, download: true }
            }]
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    console.log(`Access assigned to group ID ${groupId}`);
}

// Get group members
async function getGroupMembers(groupId) {
    const response = await axios.get(
        `${process.env.PORTAL_URL}/api/2.0/group/${groupId}`,
        {
            params: { includeMembers: true },
            headers: {
                Authorization: `Bearer ${process.env.API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data.response.members || [];
}

// Copy NDA template for each user
async function generateNDAs(members, targetFolderId) {
    for (const member of members) {
        const firstName = member.firstName || "User";
        const lastName = member.lastName || "Unknown";
        const newTitle = `NDA_${firstName}_${lastName}.docx`;

        await axios.post(
            `${process.env.PORTAL_URL}/api/2.0/files/copy`,
            {
                fileId: process.env.NDA_TEMPLATE_FILE_ID,
                folderId: targetFolderId,
                title: newTitle
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(`NDA generated for ${firstName} ${lastName}`);
    }
}

// Webhook listener
app.post("/webhook", async (req, res) => {
    const signature = req.headers["x-docspace-signature-256"];
    const computedSignature = getSecretHash(process.env.WEBHOOK_SECRET_KEY, JSON.stringify(req.body));

    if (signature !== computedSignature) {
        console.warn("Invalid signature");
        return res.sendStatus(401);
    }

    const { trigger } = req.body.event;
    const { id: groupId, name: groupName } = req.body.payload;

    if (trigger === "group.created") {
        try {
            // Step 1: Create Room
            const room = await createRoom(groupName);

            // Step 2: Create Subfolders
            const subfolders = ["Plan", "Files", "Reports"];
            await createSubfolders(room.id, subfolders);

            // Step 3: Assign access to group
            await assignGroupAccess(room.id, groupId);

            // Step 4: Get members of the group
            const members = await getGroupMembers(groupId);

            // Step 5: Find ID of "Files" folder
            const filesFolderRes = await axios.get(
                `${process.env.PORTAL_URL}/api/2.0/files/${room.id}/list`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            const filesFolder = filesFolderRes.data.response.find(item => item.title === "Files" && item.folder);

            if (!filesFolder) {
                throw new Error("Files folder not found in the new room");
            }

            // Step 6: Generate NDA files
            await generateNDAs(members, filesFolder.id);

            // Step 7: Notify HR
            await notifyHR(
                "New group setup complete",
                `Room for group "${groupName}" has been created. NDAs for each member have been generated.`
            );

            res.sendStatus(200);
        } catch (err) {
            console.error("Error handling group.created event:", err.response?.data || err.message);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(200);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
});
