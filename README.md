# Catherine Fashion Store — AI Responder

An AI assistant that answers customer questions (sizing, delivery, payment,
booking) automatically on the website, WhatsApp, Facebook Messenger and
Telegram — so Catherine can reply fast without watching every inbox herself.

It's grounded in one shared file, `knowledge.js`, so updating a price or
policy once updates every channel.

## 1. Install

```bash
cd ai-responder
npm install
cp .env.example .env
```

Open `.env` and fill in the keys described below. You don't need every key —
each channel only turns on once its own keys are set; the rest are skipped
with a friendly log message.

## 2. Get a Claude API key (required for all channels)

1. Go to https://console.anthropic.com and create an account.
2. Create an API key and paste it into `ANTHROPIC_API_KEY` in `.env`.
3. Claude API usage is billed per message — check current pricing at
   https://docs.claude.com before going live with high volumes.

## 3. Website chat widget (already wired up)

The site's floating chat button (`js/chatbot-widget.js`) is already built to
call this backend. Once the server is running, open that file and set:

```js
const CFS_CHAT_CONFIG = {
  apiUrl: 'https://your-server-address/api/chat',
  ...
};
```

Until you deploy a server somewhere reachable from the internet, the widget
keeps working using its built-in offline FAQ answers — nothing breaks.

## 4. Telegram (easiest to set up — start here)

1. Open Telegram, message **@BotFather**, send `/newbot`, and follow the
   prompts to name your bot.
2. BotFather gives you a token like `123456:AAxxxxx...` — put it in
   `TELEGRAM_BOT_TOKEN` in `.env`.
3. Run `npm start`. Message your new bot on Telegram — it replies using
   Claude, grounded in `knowledge.js`.

No public server URL is needed for Telegram in this setup (it uses
long-polling), so this is the fastest one to test locally.

## 5. WhatsApp (Meta Cloud API)

WhatsApp requires a Meta developer account and a server reachable from the
internet (for local testing, a tunnel tool like `ngrok` works).

1. Create an app at https://developers.facebook.com → add the **WhatsApp**
   product.
2. In WhatsApp → API Setup, copy the **temporary access token** and **phone
   number ID** into `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
   (Temporary tokens expire in 24 hours — for production, generate a
   permanent token via a Meta System User.)
3. Choose any string as `WHATSAPP_VERIFY_TOKEN`, e.g. `catherine-verify-2026`.
4. Deploy the server (or run `ngrok http 3000` locally) and, in Meta's
   webhook settings, set the callback URL to
   `https://your-server-address/webhook/whatsapp` with the same verify token.
5. Subscribe the webhook to the `messages` field.
6. To message real customers beyond the 24-hour test window, you'll need
   WhatsApp Business verification — Meta walks you through this in the same
   dashboard.

## 6. Facebook Messenger (Meta)

Uses the same Meta developer app as WhatsApp.

1. In your Meta app, add the **Messenger** product and connect Catherine's
   Facebook Page.
2. Copy the **Page access token** into `MESSENGER_PAGE_TOKEN`.
3. Set `MESSENGER_VERIFY_TOKEN` to any string.
4. In Messenger webhook settings, set the callback URL to
   `https://your-server-address/webhook/messenger` and subscribe to the
   `messages` field.

## 7. X (Twitter) — please read before promising this to Catherine

Automatically replying to DMs on X requires the **paid X API tier** (the free
tier does not include DM endpoints), and X's terms have changed several times
on what automation is allowed. Before building this in:
- Check current access tiers and pricing at https://developer.x.com.
- If it's worth the cost for your volume, the same `generateReply()` function
  in `ai.js` can power an X handler exactly like the others — just add a
  `handlers/x.js` once you have API access confirmed.

## 8. TikTok — please read before promising this to Catherine

TikTok does not currently offer a public API for third-party apps to send and
receive **direct messages** the way Meta or Telegram do. For fast responses
on TikTok today, the realistic options are:
- Use TikTok's own **Auto-reply** and **Quick replies** features inside
  TikTok Shop / Business Messaging (in the TikTok Seller/Business app), which
  are built by TikTok and don't need custom code.
- Have a team member check TikTok comments/DMs manually, using the same FAQ
  answers in `knowledge.js` as a script.
- Re-check https://developers.tiktok.com periodically — this is an area that
  changes as TikTok opens more of its platform.

## 9. Keeping answers accurate

Whenever prices, hours, delivery fees or policies change, update
`knowledge.js` only — every connected channel picks up the change on the next
message, with no other code changes needed.

## 10. Running in production

`npm start` runs everything in one process, which is fine to begin with.
When traffic grows, consider:
- A process manager like `pm2` so the server restarts if it crashes.
- Moving the in-memory conversation history (currently `Map()`s in each
  handler) to a small database so context survives a restart.
- Rate limiting `/api/chat` so the public website endpoint can't be spammed.
