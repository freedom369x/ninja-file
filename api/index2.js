// ===== OPTIMIZED SEND DOCUMENT (WORKING VERSION) =====
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, chat_id, document, filename } = req.body;

    if (!token || !chat_id || !document || !filename) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
        });
    }

    try {
        // Convert base64 to buffer (fast)
        const docBuffer = Buffer.from(document, 'base64');
        
        // Create optimized multipart form data
        const boundary = '----TelegramBoundary' + Date.now();
        
        // Build form parts
        const parts = [
            `--${boundary}\r\n`,
            `Content-Disposition: form-data; name="chat_id"\r\n\r\n${chat_id}\r\n`,
            `--${boundary}\r\n`,
            `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n`,
            `Content-Type: application/octet-stream\r\n\r\n`
        ];
        
        // Combine efficiently
        const formDataBuffer = Buffer.concat([
            Buffer.from(parts.join(''), 'utf8'),
            docBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
        ]);

        // Send to Telegram (no unnecessary logging)
        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendDocument`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                },
                body: formDataBuffer
            }
        );

        const result = await response.json();

        if (result.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: result.description 
            });
        }

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
}