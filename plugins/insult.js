// insult.js
const { JB } = require('../ryan');

// Prewritten insults (sample 20, you can extend up to 100)
const insults = [
  "You're as useless as the 'ueue' in 'queue'.",
  "I'd agree with you, but then we'd both be wrong.",
  "You bring everyone so much joy... when you leave the room.",
  "You're proof that even evolution takes a break sometimes.",
  "If I wanted to kill myself, I'd climb your ego and jump to your IQ.",
  "You're like a cloud. When you disappear, it's a beautiful day.",
  "You're the reason they put instructions on shampoo bottles.",
  "You're slower than Internet Explorer on dial-up.",
  "You're about as sharp as a butter knife.",
  "If ignorance is bliss, you must be the happiest person alive.",
  "You have something on your face… oh wait, that's just your face.",
  "You're living proof that even mistakes can be useful… as bad examples.",
  "You're like a software update: whenever I see you, I think 'do I really need this now?'",
  "You're the human version of a typo.",
  "Your secrets are safe with me. I never even listen when you tell me them.",
  "You're like a cloud storage error: always taking up space for no reason.",
  "You're the reason pencils have erasers.",
  "If common sense was laced with sugar, you'd still be tasteless.",
  "You're like a candle in the wind—dim and easily blown away.",
  "You have something money can’t buy: bad taste.",
];

JB({
  pattern: "insult",
  alias: ["roast"],
  react: "🔥",
  desc: "Roast someone with a random insult",
  category: "fun",
  use: ".insult (by reply or mention)",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    const randomInsult = insults[Math.floor(Math.random() * insults.length)];
    let target = null;

    // Case 1: Replying to someone
    if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
      target = mek.message.extendedTextMessage.contextInfo.participant;
    }

    // Case 2: Mentioned someone
    else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      target = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    // Case 3: No reply or mention
    if (!target) {
      return reply("⚠️ Please *reply* to someone’s message or *mention* them to insult.");
    }

    // Roast with mention
    await conn.sendMessage(from, {
      text: `@${target.split('@')[0]}, ${randomInsult}`,
      mentions: [target]
    }, { quoted: mek });

  } catch (err) {
    console.error("insult.js error:", err);
    reply("❌ Failed to roast. Something went wrong.");
  }
});

