const TelegramBot = require('node-telegram-bot-api');
const { generateReply } = require('../ai');

function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[telegram] Skipped — no TELEGRAM_BOT_TOKEN set in .env');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  console.log('[telegram] Bot is listening for messages…');

  const historyByChat = new Map();

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text) return;

    const history = historyByChat.get(chatId) || [];

    try {
      const reply = await generateReply(text, history, 'telegram');
      history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
      historyByChat.set(chatId, history.slice(-10));
      await bot.sendMessage(chatId, reply);
    } catch (err) {
      console.error('[telegram] error:', err.message);
      await bot.sendMessage(chatId, "Sorry, I'm having trouble replying right now — our team will follow up shortly.");
    }
  });
}

module.exports = { startTelegramBot };
