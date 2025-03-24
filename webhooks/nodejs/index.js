const express = require("express");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config();


const app = express();

app.use(express.json());

const envFilePath = path.join(__dirname, ".env");

function getSecretKey() {
    const envContent = fs.readFileSync(envFilePath, "utf8");
    return envContent;
}

function getSecretHash(secretKey, body) {
    const hasher = crypto.createHmac("sha256", Buffer.from(secretKey, "utf8"));
    hasher.update(Buffer.from(body, "utf8"));
    return "sha256=" + hasher.digest("hex").toUpperCase();
}

app.head("/webhook", (req, res) => {
    res.sendStatus(200);
})

app.post("/webhook", (req, res) => {
    const sig = req.headers["x-docspace-signature-256"];
    
    if (!sig){
        console.error("Unsigned request!");
        res.sendStatus(401);
        return;
    }
  
    const secretKey = getSecretKey();
    
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