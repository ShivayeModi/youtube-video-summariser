
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

app.post('/get-summary', async (req, res) => {
    const { transcript } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        return res.status(500).json({ error: 'Gemini API key not found.' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Summarize the following YouTube video transcript:\n\n${transcript}`
                    }]
                }]
            })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            res.json({ summary: data.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ error: 'Could not summarize text.' });
        }
    } catch (error) {
        console.error('Error summarizing transcript:', error);
        res.status(500).json({ error: 'Failed to summarize transcript.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
