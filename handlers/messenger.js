const axios = require('axios');
const { generateReply } = require('../ai');

const historyByUser = new Map();

function verifyMessenger(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.MESSENGER_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function handleMessenger(req, res) {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const text = messaging?.message?.text;
    const senderId = messaging?.sender?.id;
    if (!text || !senderId) return;

    const history = historyByUser.get(senderId) || [];
    const reply = await generateReply(text, history, 'messenger');
    history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
    historyByUser.set(senderId, history.slice(-10));

    await axios.post(
      `https://graph.facebook.com/v20.0/me/messages`,
      { recipient: { id: senderId }, message: { text: reply } },
      { params: { access_token: process.env.MESSENGER_PAGE_TOKEN } }
    );
  } catch (err) {
    console.error('[messenger] error:', err.response?.data || err.message);
  }
}

module.exports = { verifyMessenger, handleMessenger };
