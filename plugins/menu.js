// plugins/menu.js
const { JB, commands } = require("../ryan");

// 📂 MENU Command
JB({
  pattern: "menu",
  alias: ["jailbreak", "list"],
  desc: "Shows all available commands grouped by category",
  category: "general",
  react: "📜",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  let categories = {};

  // Group commands by category
  for (let cmd of commands) {
    let cat = cmd.category || "misc";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  }

  let menuText = `*📜JAILBREAK COMMANDS MENU*\n\nUse *.JB  <command>* to see details about a command.\n\n`;

  for (let cat in categories) {
    menuText += `╭───❏ *${cat.toUpperCase()}*\n`;
    for (let c of categories[cat]) {
      menuText += `│ • .${c.pattern}${c.alias && c.alias.length ? ` (alias: ${c.alias.join(", ")})` : ""}\n`;
    }
    menuText += `╰───────────────\n\n`;
  }

  await conn.sendMessage(from, { text: menuText }, { quoted: mek });
});

// 📖 HELP Command
JB({
  pattern: "help",
  alias: ["jb"],
  desc: "Get detailed info about a specific command",
  category: "general",
  react: "ℹ️",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  if (!q) {
    return reply("⚠️ Usage: *.help <command>*");
  }

  const name = q.toLowerCase();
  const cmd = commands.find(c =>
    c.pattern.toLowerCase() === name ||
    (Array.isArray(c.alias) && c.alias.map(a => a.toLowerCase()).includes(name))
  );

  if (!cmd) {
    return reply(`❌ Command *${name}* not found.`);
  }

  let info = `╭───❏ *JAILBREAK~HELP– > .${cmd.pattern}*\n`;
  info += `│ • *Description:* ${cmd.desc || "No description"}\n`;
  info += `│ • *Category:* ${cmd.category || "misc"}\n`;
  info += `│ • *Aliases:* ${cmd.alias && cmd.alias.length ? cmd.alias.map(a => "." + a).join(", ") : "None"}\n`;
  info += `│ • *File:* ${cmd.filename || "Not provided"}\n`;
  info += `╰───────────────`;

  await conn.sendMessage(from, { text: info }, { quoted: mek });
});
