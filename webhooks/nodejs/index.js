const express = require("express");
const crypto = require("node:crypto");

require("dotenv").config();


const app = express();

app.use(express.json());

function getSecretHash(secretKey, body) {
    const hasher = crypto.createHmac("sha256", Buffer.from(secretKey, "utf8"));
    hasher.update(Buffer.from(body, "utf8"));
    return "sha256=" + hasher.digest("hex").toUpperCase();
}

// listening head request for verification of the webhook URL
app.head("/webhook", (req, res) => {
    res.sendStatus(200);
})

// listening post request for the webhook
app.post("/webhook", (req, res) => {
    const sig = req.headers["x-docspace-signature-256"];

    if (!sig){
        console.error("Unsigned request!");
        res.sendStatus(401);
        return;
    }

    const secretKey = process.env.WEBHOOK_SECRET_KEY;

    const body = JSON.stringify(req.body);

    const hash = getSecretHash(secretKey, body);

    if (sig !== hash) {
        console.error("Incorrect signature!");
        res.sendStatus(401);
    } else {
        console.log(body);
        res.sendStatus(200);
    }

});

app.listen(8080, () => {
    console.log("Server started on port 8080");
});