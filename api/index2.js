// ===== OPTIMIZED SEND DOCUMENT =====
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, chat_id, document, filename } = req.body;

    // Validate required fields
    if (!token || !chat_id || !document || !filename) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
        });
    }

    try {
        // Convert base64 directly to buffer
        const docBuffer = Buffer.from(document, 'base64');
        
        // Use FormData API (Node 18+)
        const FormData = (await import('formdata-node')).FormData;
        const { Blob } = await import('buffer');
        
        const formData = new FormData();
        formData.append('chat_id', chat_id);
        formData.append('document', new Blob([docBuffer]), filename);

        // Direct Telegram upload
        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendDocument`,
            {
                method: 'POST',
                body: formData
            }
        );

        const result = await response.json();

        if (result.ok) {
            return res.status(200).json({ 
                success: true, 
                message_id: result.result.message_id 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: result.description 
            });
        }

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
}