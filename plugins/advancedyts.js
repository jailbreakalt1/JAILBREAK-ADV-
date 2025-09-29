// yts_command.js
const { JB } = require("../ryan");
const yts = require("yt-search");

JB({
    pattern: "yts",
    alias: ["ytsearch", "search", "ytfind"],
    react: "🔎",
    desc: "Search YouTube and return styled results.",
    category: "media",
    filename: __filename
}, async (conn, mek, m, { from, args }) => {
    try {
        const searchQuery = args.join(" ").trim();

        if (!searchQuery) {
            return await conn.sendMessage(from, { text: "> ❌ SEARCH YOUTUBE FOR WHAT EXACTLY ?" }, { quoted: mek });
        }

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await conn.sendMessage(from, { text: "❌ No results found." }, { quoted: mek });
        }

        // Limit to top 9 results
        const topResults = videos.slice(0, 9);

        let resultText = `🔎 *SEARCHED:* \n> ${searchQuery}\n\n`;
        topResults.forEach((vid, i) => {
            resultText += `JAILBREAK_AI YT RESULTS\n`;
            resultText += `───────────────────\n`;
            resultText += `*${i + 1}. ${vid.title}*\n`;
            resultText += `> ⏳ ${vid.timestamp || "N/A"}\n`;
            resultText += `> 👀 ${vid.views.toLocaleString()} views\n`;
            resultText += `> 👤 ${vid.author.name}\n`;
            resultText += `> 🔗 ${vid.url}\n`;
            resultText += `───────────────────\n`;
        });

        await conn.sendMessage(from, {
            text: resultText.trim()
        }, { quoted: mek });

    } catch (error) {
        console.error("[YTS] Error:", error);
        await conn.sendMessage(from, { text: "❌ Search failed: " + error.message }, { quoted: mek });
    }
});
