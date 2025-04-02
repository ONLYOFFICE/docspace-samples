const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const config = {
    PORTAL_SRC: process.env.PORTAL_SRC,
    PUBLIC_DOCX_ID: process.env.PUBLIC_DOCX_ID,
    PUBLIC_XLSX_ID: process.env.PUBLIC_XLSX_ID,
    PUBLIC_PPTX_ID: process.env.PUBLIC_PPTX_ID,
    PUBLIC_PDF_ID: process.env.PUBLIC_PDF_ID,
    FILLFORM_PDF_ID: process.env.FILLFORM_PDF_ID,
    PUBLIC_ROOM_ID: process.env.PUBLIC_ROOM_ID,
    COLLABORATION_ROOM_ID: process.env.COLLABORATION_ROOM_ID,
    LOGIN: process.env.LOGIN,
    PASSWORD: process.env.PASSWORD,
}

nunjucks.configure('examples', {
    autoescape: true,
    noCache: true,
    express: app
});

function getSamples(p) {
    const samples = []
    const root = fs.readdirSync(path.join(...p))
    root.forEach(e => {
        if (e.endsWith('.html')) {
            samples.push(e)
        } else {
            const r = getSamples([...p, e])
            samples.push({folder: e, files: r})
        }
    })
    return samples
}

function getSampleLink(e, p = "") {
    if (typeof e === 'string') {
        return `
        <li>
            <a href="/?sample=${path.join(p, e.slice(0, e.lastIndexOf('.')))}">${e.slice(0, e.lastIndexOf('.'))}</a>
        </li>
        `
    } else {
        return `
        <ul>${e.folder}
            ${e.files.map(
                f => getSampleLink(f, `${p}${e.folder}/`)
            ).join('\n')}
        </ul>
        `
    }
}

app.get('/', (req, res) => {
    if (req.query.sample) {
        const template = req.query.sample + '.html';

        if (!fs.existsSync(path.join(__dirname, 'examples', template))) {
            res.redirect('/');
            return;
        }

        res.render(template, config);
        return
    }

    const samples = getSamples([__dirname, 'examples'])
    const main = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>DocSpace JavaScript SDK Samples</title>
            </head>
            <body>
                ${samples.map(
                    e => getSampleLink(e)
                ).join('\n')}
            </body>
        </html>
    `
    res.send(main);
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});