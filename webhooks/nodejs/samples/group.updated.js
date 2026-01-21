// Critical group monitoring and external user check

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

const SENSITIVE_GROUP_KEYWORDS = ["hr", "finance", "legal", "management"];
const EXTERNAL_DOMAINS = ["external.com"];

app.head("/webhook", (req, res) => {
  res.sendStatus(200);
});

app.post("/webhook", async (req, res) => {
  const sig = req.headers["x-docspace-signature-256"];
  if (!sig) return res.sendStatus(401);

  const secretKey = process.env.WEBHOOK_SECRET_KEY;
  const rawBody = JSON.stringify(req.body);
  const computedHash = getSecretHash(secretKey, rawBody);

  if (sig !== computedHash) return res.sendStatus(401);

  const eventType = req.body?.event?.trigger;
  const { id: groupId, name: groupName } = req.body?.payload || {};

  if (eventType !== "group.updated" || !groupId) return res.sendStatus(200);

  console.log(`Group updated: "${groupName}" (${groupId})`);

  try {
    // Step 1: Get updated group info
    const groupInfoRes = await axios.get(
      `${process.env.PORTAL_URL}/api/2.0/group/${groupId}`,
      {
        params: { includeMembers: true },
        headers: { Authorization: `Bearer ${process.env.API_KEY}` }
      }
    );

    const groupInfo = groupInfoRes.data.response || {};
    const description = groupInfo.description || "[No description]";
    const members = groupInfo.members || [];

    // Step 2: Check for sensitive groups
    const isSensitiveGroup = SENSITIVE_GROUP_KEYWORDS.some(keyword => groupName.toLowerCase().includes(keyword));

    if (isSensitiveGroup) {
      let externalUsers = [];

      // Step 3: Check for external users
      for (const member of members) {
        const email = member.email || "";
        if (EXTERNAL_DOMAINS.some(domain => email.toLowerCase().endsWith("@" + domain))) {
          externalUsers.push(email);
        }
      }

      const externalNotice = externalUsers.length > 0
        ? `\n\n External users detected:\n${externalUsers.map(e => "- " + e).join("\n")}`
        : "";

      const adminMessage = `
Critical group "${groupName}" has been updated.

Description: ${description}
Total Members: ${members.length}

Changes detected:${externalNotice}

Group ID: ${groupId}
Time: ${new Date().toISOString()}
      `.trim();

      await axios.post(
        process.env.NOTIFY_WEBHOOK_URL,
        {
          to: process.env.ADMIN_EMAIL,
          subject: "Critical Group Updated",
          message: adminMessage
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Admin notified about critical group update.");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling group.updated:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
