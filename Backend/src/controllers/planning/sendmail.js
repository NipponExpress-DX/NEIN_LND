// autoSendMail.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getToken } = require('./Auth');

async function autoSendMail(from = "", to, cc, body, subject, attachments = [], bcc = "") {
    try {
        console.log("📧 Mail function called (Graph API)");
        if (bcc) {
                const bccCount = bcc.split(',').filter(Boolean).length;
                if (bccCount > 50) {
                    console.warn(`⚠️ BCC list has ${bccCount} recipients — consider batching to avoid Graph API limits`);
                }
            }
        const token = await getToken();
        if (!token) {
            throw new Error("Failed to acquire access token");
        }

        const toRecipients = to.split(',').map(email => ({
            emailAddress: { address: email.trim() }
        }));

        // Process attachments
        const formattedAttachments = [];
        for (const file of attachments) {
            try {
                if (file.filename && file.content) {
                    formattedAttachments.push({
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        name: file.filename,
                        contentBytes: Buffer.from(file.content).toString('base64'),
                        contentType: "application/octet-stream"
                    });
                } else if (file.path) {
                    const fileContent = await fs.promises.readFile(file.path);
                    formattedAttachments.push({
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        name: path.basename(file.path),
                        contentBytes: fileContent.toString('base64'),
                        contentType: "application/octet-stream"
                    });
                }
            } catch (error) {
                console.error(`⚠️ Error processing attachment ${file.filename || file.path}:`, error.message);
            }
        }

        const messageBody = {
            subject: subject || "No Subject",
            body: {
                contentType: "HTML",
                content: body || ""
            },
            toRecipients,
            from: {
                emailAddress: {
                    address: from || "noreply.nein@nipponexpress.com"
                }
            }
        };

        // ── CC ──────────────────────────────────────────────
        if (cc && cc.trim()) {
            const ccList = cc.split(',').map(e => e.trim()).filter(Boolean);
            if (ccList.length > 0) {
                messageBody.ccRecipients = ccList.map(email => ({
                    emailAddress: { address: email }
                }));
            }
        }

        // ── BCC ─────────────────────────────────────────────
        if (bcc && bcc.trim()) {
            const bccList = bcc.split(',').map(e => e.trim()).filter(Boolean);
            if (bccList.length > 0) {
                messageBody.bccRecipients = bccList.map(email => ({
                    emailAddress: { address: email }
                }));
            }
        }

        if (formattedAttachments.length > 0) {
            messageBody.attachments = formattedAttachments;
        }

        const message = {
            message: messageBody,
            saveToSentItems: true
        };

        const sender = from || "noreply.nein@nipponexpress.com";
        const response = await axios.post(
            `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`,
            message,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log("✅ Email sent successfully via Graph API");
        return { success: true, response: response.data };

    } catch (error) {
        console.error("❌ Error sending email via Graph API:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = autoSendMail;