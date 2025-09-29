const { JB } = require('../ryan');

// Using dynamic import inside the function for node-fetch compatibility
// This ensures the file works regardless of whether the environment is CJS or ESM.

JB({
    pattern: "lyrics",
    alias: ["lyric"],
    desc: "Finds and returns lyrics for a given song.",
    category: "utility",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    // 1. Dynamic Import of node-fetch
    let fetch;
    try {
        const fetchModule = await import('node-fetch');
        fetch = fetchModule.default || fetchModule;
    } catch (e) {
        // Send error if module loading fails (should be rare)
        await conn.sendMessage(mek.key.remoteJid, {
            text: '❌ Critical Error: Could not load fetch module.'
        }, { quoted: mek });
        return;
    }

    const chatId = mek.key.remoteJid; // Use mek.key.remoteJid as the chat ID

    // 2. Check for song title
    if (!q) {
        await conn.sendMessage(chatId, {
            text: '🔍 Please enter the song name to get the lyrics! Usage: *lyrics <song name>*'
        }, { quoted: mek });
        await conn.sendMessage(chatId, { react: { text: "❌", key: mek.key } });
        return;
    }

    // Send a pending reaction
    await conn.sendMessage(chatId, {
        react: { text: '⏳', key: mek.key }
    });

    try {
        const songTitle = q;
        const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(songTitle)}`;

        const res = await fetch(apiUrl);

        if (!res.ok) {
            // Check if the non-ok response is JSON (the API error you saw)
            let errorDetails = `Status: ${res.status}`;
            try {
                const errJson = await res.json();
                errorDetails = errJson.details || errJson.error || JSON.stringify(errJson);
            } catch (jsonError) {
                errorDetails = await res.text();
            }
            throw new Error(`API returned an error: ${errorDetails}`);
        }

        const data = await res.json();

        const lyrics = data && data.result && data.result.lyrics ? data.result.lyrics : null;
        
        if (!lyrics) {
            await conn.sendMessage(chatId, {
                text: `❌ Sorry, I couldn't find any lyrics for "${songTitle}".`
            }, { quoted: mek });
            await conn.sendMessage(chatId, { react: { text: "❌", key: mek.key } });
            return;
        }

        const maxChars = 4096;
        const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;

        await conn.sendMessage(chatId, { text: output }, { quoted: mek });
        await conn.sendMessage(chatId, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('Error in lyrics command:', error);
        
        // Use a generic error message for the user, especially since the Baileys error is volatile
        await conn.sendMessage(chatId, {
            text: `❌ An error occurred while fetching the lyrics for "${q}". Please try again later.`
        }, { quoted: mek });
        
        await conn.sendMessage(chatId, { react: { text: "❌", key: mek.key } });
    }
});