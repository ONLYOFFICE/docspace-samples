const axios = require("axios");

require("dotenv").config();


// Async function to create the webhook
// Documentation: https://api.onlyoffice.com/docspace/api-backend/usage-api/create-webhook/
async function createWebhook(name, uri, secretKey, enabled, ssl, triggers, targetId) {
    const url = process.env.PORTAL_URL + "/api/2.0/settings/webhook";
    const apiKey = process.env.API_KEY;

    const data = {
        name,
        uri,
        secretKey,
        enabled,
        ssl,
        triggers,
        targetId
    };

    try {
        const response = await axios.post(
            url,
            data,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        console.log("Webhook created successfully:");
        console.log(JSON.stringify(response.data));

    } catch (error) {
        console.log("Error creating webhook:");
        console.log(JSON.stringify(error.response ? error.response.data : error.message));
    }
}

// TODO: Replace these values ​​with your own.
const name = "My Webhook"; // Webhook name
const uri = "http://localhost:8080/webhook"; // Webhook payload url
const secretKey = process.env.WEBHOOK_SECRET_KEY;
const ssl = true; // SSL verification
const triggers = 0; // All triggers are selected by default
const targetId= ""; // Target ID

createWebhook(name, uri, secretKey, true, ssl, triggers, targetId);
