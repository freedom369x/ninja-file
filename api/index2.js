// ===== ULTRA FAST SEND DOCUMENT =====
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { token, chat_id, document, filename } = req.body;

    if (!token || !chat_id || !document || !filename) {
        return res.status(400).end();
    }

    try {
        // Fast buffer conversion
        const docBuffer = Buffer.from(document, 'base64');
        
        // Minimal multipart form
        const boundary = Date.now().toString(36);
        
        const header = `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chat_id}\r\n--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
        const footer = `\r\n--${boundary}--`;
        
        const body = Buffer.concat([
            Buffer.from(header),
            docBuffer,
            Buffer.from(footer)
        ]);

        // Ultra fast fetch
        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendDocument`,
            {
                method: 'POST',
                headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
                body
            }
        );

        // Minimal check
        if (response.ok) {
            return res.status(200).end();
        } else {
            return res.status(400).end();
        }

    } catch (error) {
        return res.status(500).end();
    }
}