require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { generateReply } = require('./ai');
const { startTelegramBot } = require('./handlers/telegram');
const { verifyWhatsapp, handleWhatsapp } = require('./handlers/whatsapp');
const { verifyMessenger, handleMessenger } = require('./handlers/messenger');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- Website chat widget ----------
// This is what js/chatbot-widget.js on the site calls.
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const reply = await generateReply(message, [], 'web');
    res.json({ reply });
  } catch (err) {
    console.error('[web chat] error:', err.message);
    res.status(500).json({ error: 'Something went wrong generating a reply.' });
  }
});

// ---------- WhatsApp (Meta Cloud API) ----------
app.get('/webhook/whatsapp', verifyWhatsapp);
app.post('/webhook/whatsapp', handleWhatsapp);

// ---------- Facebook Messenger (Meta) ----------
app.get('/webhook/messenger', verifyMessenger);
app.post('/webhook/messenger', handleMessenger);

// ---------- Telegram ----------
// Telegram uses long-polling here, so it doesn't need an HTTP route —
// it's started separately below once the server is up.

app.get('/', (req, res) => {
  res.send('Catherine Fashion Store AI responder is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI responder listening on port ${PORT}`);
  startTelegramBot();
});
