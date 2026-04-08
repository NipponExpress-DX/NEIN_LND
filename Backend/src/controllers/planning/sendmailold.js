const fs = require("fs");
const path = require("path");
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");
const { ConfidentialClientApplication } = require("@azure/msal-node");

const msalConfig = {
    auth: {
        clientId: "d4531c4f-ffd2-4d4f-b327-075b7272f07",
        authority: "https://login.microsoftonline.com/c1e5a355-9690-47b4-8d12-00ef54493edb",
        clientSecret: process.env.CLIENT_SECRET
    }
};

const FROM_EMAIL = "noreply.nein@nipponexpress.com";

async function getGraphClient() {
    const cca = new ConfidentialClientApplication(msalConfig);
    const result = await cca.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"]
    });

    return Client.init({
        authProvider: done => done(null, result.accessToken)
    });
}

async function autoSendMail({ from, to, cc, bcc, subject, body, attachmentDir }) {
    const client = await getGraphClient();

    const parseEmails = (emails) =>
        (emails || "").split(',').filter(Boolean).map(email => ({
            emailAddress: { address: email.trim() }
        }));

    const attachments = [];
    if (attachmentDir && fs.existsSync(attachmentDir)) {
        const files = fs.readdirSync(attachmentDir);
        for (const file of files) {
            const filePath = path.join(attachmentDir, file);
            if (fs.statSync(filePath).isFile()) {
                const contentBytes = fs.readFileSync(filePath, { encoding: "base64" });
                attachments.push({
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    name: file,
                    contentType: "application/pdf",
                    contentBytes
                });
            }
        }
    }

    const mail = {
        message: {
            subject,
            body: {
                contentType: "HTML",
                content: body
            },
            toRecipients: parseEmails(to),
            ccRecipients: parseEmails(cc),
            bccRecipients: parseEmails(bcc),
            attachments
        },
        saveToSentItems: true
    };

    await client.api(`/users/${from || FROM_EMAIL}/sendMail`).post(mail);
    console.log(`✅ Mail sent to ${to}`);
}

module.exports = autoSendMail;
