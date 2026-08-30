
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend server is running.');
});

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

app.post('/get-summary', async (req, res) => {
    const { transcript } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        return res.status(500).json({ error: 'Gemini API key not found.' });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Summarize this YouTube video transcript as plain text with short paragraphs. Include timestamps like [0:00] where topics change. No markdown, no HTML, no formatting symbols. Just clean readable text:\n\n${transcript}`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 2048
                }
            })
        });

        clearTimeout(timeout);
        const data = await response.json();
        console.log('Gemini response status:', response.status);
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.json({ summary: data.candidates[0].content.parts[0].text });
        } else {
            console.log('Gemini response:', JSON.stringify(data).substring(0, 500));
            res.status(500).json({ error: data?.error?.message || 'Could not summarize text.' });
        }
    } catch (error) {
        console.error('Error summarizing transcript:', error);
        if (error.name === 'AbortError') {
            res.status(504).json({ error: 'AI took too long. Try with a shorter video.' });
        } else {
            res.status(500).json({ error: 'Failed to summarize transcript.' });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
