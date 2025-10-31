// ===== SEND DOCUMENT =====
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, token, chat_id, document, filename } = req.body;

    // Check if it's sendDocument action
    if (action !== 'sendDocument') {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid action' 
        });
    }

    // Validate required fields
    if (!token || !chat_id || !document || !filename) {
        return res.status(400).json({ 
            success: false, 
            error: 'Token, chat_id, document and filename required' 
        });
    }

    console.log('📄 Processing document:', filename);

    try {
        // Convert base64 to buffer
        const docBuffer = Buffer.from(document, 'base64');
        console.log('✅ Buffer size:', docBuffer.length, 'bytes');

        // Create multipart form data
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        
        let formData = '';
        
        formData += `--${boundary}\r\n`;
        formData += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
        formData += `${chat_id}\r\n`;
        
        formData += `--${boundary}\r\n`;
        formData += `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n`;
        formData += `Content-Type: application/octet-stream\r\n\r\n`;
        
        const formDataBuffer = Buffer.concat([
            Buffer.from(formData, 'utf8'),
            docBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
        ]);

        console.log('📤 Uploading document to Telegram...');

        // Send to Telegram
        const baseUrl = `https://api.telegram.org/bot${token}`;
        const response = await fetch(`${baseUrl}/sendDocument`, {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': formDataBuffer.length.toString()
            },
            body: formDataBuffer
        });

        const result = await response.json();

        if (result.ok) {
            console.log('✅ Document sent successfully');
            return res.status(200).json({ 
                success: true, 
                message: 'Document sent',
                data: result 
            });
        } else {
            console.error('❌ Telegram error:', result.description);
            return res.status(400).json({ 
                success: false, 
                error: result.description 
            });
        }

    } catch (error) {
        console.error('❌ Document error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Document processing failed',
            details: error.message
        });
    }
}