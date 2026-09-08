const axios = require('axios');
const { generateReply } = require('../ai');

const historyByUser = new Map();

function verifyWhatsapp(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function handleWhatsapp(req, res) {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message || message.type !== 'text') return;

    const from = message.from;
    const text = message.text.body;

    const history = historyByUser.get(from) || [];
    const reply = await generateReply(text, history, 'whatsapp');
    history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
    historyByUser.set(from, history.slice(-10));

    await axios.post(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      { messaging_product: 'whatsapp', to: from, text: { body: reply } },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    );
  } catch (err) {
    console.error('[whatsapp] error:', err.response?.data || err.message);
  }
}

module.exports = { verifyWhatsapp, handleWhatsapp };
