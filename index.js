const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const PORTAL_SRC = process.env.PORTAL_SRC;

nunjucks.configure('examples', {
    autoescape: true,
    noCache: true,
    express: app
});

app.get('/', (req, res) => {
    let examples = fs.readdirSync(path.join(__dirname, 'examples'))
    let main = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>DocSpace JavaScript SDK Examples</title>
            </head>
            <body>
                ${examples.map(
                    e => `
                        <li>
                            <a href="/${e.slice(0,e.lastIndexOf('.'))}">${e.slice(0,e.lastIndexOf('.'))}</a>
                        </li>
                    `
                ).join('\n')}
            </body>
        </html>
    `
    res.send(main);
});

app.get('/:filename', (req, res) => {
    let template = req.params.filename + '.html';

    if (!req.params.filename || !fs.existsSync(path.join(__dirname, 'examples', template))) {
        res.redirect('/');
        return;
    }

    res.render(template, {PORTAL_SRC});
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});