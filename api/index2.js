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
        // Ultra fast buffer conversion
        const docBuffer = Buffer.from(document, 'base64');
        
        // Minimal boundary (shorter = faster)
        const b = Date.now().toString(36);
        
        // Single-pass buffer creation (no string concatenation)
        const h = Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chat_id}\r\n--${b}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
        const f = Buffer.from(`\r\n--${b}--`);
        
        // Direct concatenation (fastest method)
        const body = Buffer.concat([h, docBuffer, f]);

        // Minimal fetch (no await for result parsing)
        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendDocument`,
            {
                method: 'POST',
                headers: { 'Content-Type': `multipart/form-data; boundary=${b}` },
                body
            }
        );

        // Quick status check only
        return response.ok ? res.status(200).end() : res.status(400).end();

    } catch (error) {
        return res.status(500).end();
    }
}