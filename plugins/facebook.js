const { JB } = require('../ryan');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

JB({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    desc: "Downloads Facebook videos.",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    try {
        const url = q;

        if (!url) {
            await conn.sendMessage(mek.key.remoteJid, {
                text: "Please provide a Facebook video URL.\nExample: .fb https://www.facebook.com/..."
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return;
        }

        // Validate Facebook URL
        if (!url.includes('facebook.com')) {
            await conn.sendMessage(mek.key.remoteJid, {
                text: "That is not a valid Facebook link."
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return;
        }

        // Send loading reaction
        await conn.sendMessage(mek.key.remoteJid, {
            react: { text: '🔄', key: mek.key }
        });

        // Resolve share/short URLs to their final destination first
        let resolvedUrl = url;
        try {
            const res = await axios.get(url, { timeout: 20000, maxRedirects: 10, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const possible = res?.request?.res?.responseUrl;
            if (possible && typeof possible === 'string') {
                resolvedUrl = possible;
            }
        } catch {
            // ignore resolution errors; use original url
        }

        // Helper to call API with retries and variants
        async function fetchFromApi(u) {
            const apiUrl = `https://api.princetechn.com/api/download/facebook?apikey=prince&url=${encodeURIComponent(u)}`;
            return axios.get(apiUrl, {
                timeout: 40000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*'
                },
                maxRedirects: 5,
                validateStatus: s => s >= 200 && s < 500
            });
        }

        // Try resolved URL, then fallback to original URL
        let response;
        try {
            response = await fetchFromApi(resolvedUrl);
            if (!response || response.status >= 400 || !response.data) throw new Error('bad');
        } catch {
            response = await fetchFromApi(url);
        }

        const data = response.data;

        if (!data || data.status !== 200 || !data.success || !data.result) {
            await conn.sendMessage(mek.key.remoteJid, {
                text: 'Sorry the API did not return a valid response. Please try again later!'
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return;
        }

        const fbvid = data.result.hd_video || data.result.sd_video;

        if (!fbvid) {
            await conn.sendMessage(mek.key.remoteJid, {
                text: 'Wrong Facebook data. Please ensure the video exists.'
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return;
        }

        // Send the video
        await conn.sendMessage(mek.key.remoteJid, {
            video: { url: fbvid },
            mimetype: "video/mp4",
            caption: "JAILBREAK_AI"
        }, { quoted: mek });

        await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('Error in Facebook command:', error);
        await conn.sendMessage(mek.key.remoteJid, {
            text: "An error occurred. API might be down. Error: " + error.message
        }, { quoted: mek });
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
    }
});
