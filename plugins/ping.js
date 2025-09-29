/**
 * A comprehensive ping command to check bot latency, uptime, and resource usage.
 * This code is designed to be used within a bot framework that uses the JB function.
 */

// Assuming your framework provides these from the main file.
const { JB, commands } = require("../ryan");
const os = require('os');

// Helper function to format uptime into a human-readable string.
function formatUptime(uptime) {
  const seconds = Math.floor(uptime % 60);
  const minutes = Math.floor((uptime / 60) % 60);
  const hours = Math.floor((uptime / (60 * 60)) % 24);
  const days = Math.floor(uptime / (60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  return parts.join(', ') || '0 seconds';
}

// 🏓 PING Command
JB({
  pattern: "ping",
  alias: ["p"],
  desc: "Checks the bot's latency, uptime, and current resource usage.",
  category: "general",
  react: "🏓",
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  // Use Date.now() to get a timestamp before sending the message.
  const startTimestamp = Date.now();

  // Send a temporary message to the same channel.
  // The 'reply' function in your framework seems to handle this nicely.
  await reply('Pinging...').then(async sentMessage => {
    // Calculate the bot's latency (the time it took to send the message).
    const botLatency = sentMessage.messageTimestamp - startTimestamp;

    // The API latency is the WebSocket heartbeat latency.
    const apiLatency = conn.ws.ping;
    const botUptime = formatUptime(process.uptime());

    // Calculate memory usage.
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usedMemoryPercentage = ((usedMemory / totalMemory) * 100).toFixed(2);

    const usedMemoryMB = (usedMemory / 1024 / 1024).toFixed(2);
    const totalMemoryMB = (totalMemory / 1024 / 1024).toFixed(2);
    
    // Get server count.
    const serverCount = conn.guilds.cache.size;

    // Get platform information.
    const osType = os.type();
    const nodeVersion = process.version;

    const responseText = `╭───❏ *JAILBREAK~PING– > .ping*\n` +
      `│ • *Bot Latency:* ${botLatency}ms\n` +
      `│ • *API Latency:* ${apiLatency}ms\n` +
      `│ • *Uptime:* ${botUptime}\n` +
      `│ • *Bot Name:* ${conn.user.name}\n` +
      `│ • *Servers:* ${serverCount}\n` +
      `│ • *Memory:* ${usedMemoryMB}MB / ${totalMemoryMB}MB (${usedMemoryPercentage}%)\n` +
      `│ • *Platform:* ${osType} (${nodeVersion})\n` +
      `╰───────────────`;

    // Edit the temporary message to show the final results.
    // Assuming `sentMessage` and `edit` work in this framework.
    await conn.sendMessage(sentMessage.key.remoteJid, { text: responseText, edit: sentMessage.key });

  }).catch(console.error);
});
