const Anthropic = require('@anthropic-ai/sdk');
const { STORE_KNOWLEDGE } = require('./knowledge');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate a reply to a customer message.
 * @param {string} message - the customer's latest message
 * @param {Array<{role:'user'|'assistant', content:string}>} history - prior turns, optional
 * @param {string} channel - 'web' | 'whatsapp' | 'messenger' | 'telegram' | 'x' (for logging/tone only)
 */
async function generateReply(message, history = [], channel = 'web') {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: STORE_KNOWLEDGE,
    messages: [...history, { role: 'user', content: message }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text : "Thanks for reaching out — a team member will follow up with you shortly.";
}

module.exports = { generateReply };
