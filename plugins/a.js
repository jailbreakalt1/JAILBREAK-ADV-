const { JB } = require("../ryan");
const axios = require('axios');
const yts = require('yt-search');
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

// Izumi API configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

JB({
    pattern: "play",
    alias: ["song", "mp3", "yta"],
    react: "🎧", // Changed reaction to reflect audio
    desc: "Search and download audio from YouTube.", // Updated description
    category: "media",
    filename: __filename
}, async (conn, mek, m, { from, args }) => {
    try {
        const searchQuery = args.join(' ').trim();
        
        if (!searchQuery) {
            await conn.sendMessage(from, { text: 'What audio do you want to download?' }, { quoted: mek });
            return;
        }

        let videoUrl = '';
        let videoDataFromYts;
        
        const youtubeUrlRegex = /(?:http?s?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([\w-]{11})(?:\S+)?/i;

        if (youtubeUrlRegex.test(searchQuery)) {
            videoUrl = searchQuery;
            const { videos } = await yts({ videoId: youtubeUrlRegex.exec(searchQuery)[1] });
            if (videos && videos.length > 0) {
                videoDataFromYts = videos[0];
            }
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await conn.sendMessage(from, { text: 'No videos found!' }, { quoted: mek });
                return;
            }
            videoDataFromYts = videos[0];
            videoUrl = videos[0].url;
        }

        const { title, timestamp, views, author, ago } = videoDataFromYts;
        const caption =
            '```JAILBREAK_SONG_REQUEST```' +
            `\n\n> ${title || "Unknown"}
> ⏳ *ᵈᵘʳᵃᵗⁱᵒⁿ:* ${timestamp || "Unknown"}
> 👀${views || "Unknown"} *ᵥᵢₑwₛ*
> 🗓️ *ʳᵉˡᵉᵃˢᵉᵈ:* ${ago || "Unknown"}
> ✍️ *ᵃᵘᵗʰᵒʳ:* ${author?.name || "Unknown"}
> *⫘⫘⫘⫘⫘⫘⫘⫘*
  ⌖𝙹𝚘𝚒𝚗 𝚜𝚘𝚗𝚐 𝚛𝚎𝚚𝚞𝚎𝚜𝚝
> *⫘⫘⫘⫘⫘⫘⫘⫘*
╰┈➤ https://chat.whatsapp.com/KyMilQ19hOk893MZ3Ssyvn?mode=ac_t`;
        
        // Reverting the thumbnail to the original YouTube one, and adding the new link to the caption
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoDataFromYts.thumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
            if (thumb) {
                await conn.sendMessage(from, {
                    image: { url: thumb },
                    caption: caption + `\n\n_Downloading audio..._`,
                    contextInfo: {
                        externalAdReply: {
                            title: "ᴶᴬᴵᴸᴮᴿᴱᴬᴷ_ᴬᴵ \n ˢᵒⁿᵍ_ʳᵉqᵘᵉˢᵗ_ʳᵒᵇᵒᵗ",
                            thumbnailUrl: "https://files.catbox.moe/ou7q48.jpg",
                            renderLargerThumbnail: false,
                            mediaType: 1,
                            showAdAttribution: false
                        }
                    }
                }, { quoted: mek });
            }
        } catch (e) {
            console.error('[VIDEO] thumb error:', e?.message || e);
        }
        
        const urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            await conn.sendMessage(from, { text: 'This is not a valid YouTube link!' }, { quoted: mek });
            return;
        }

        // Change the API call to request MP3 format
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=mp3`;
        
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            throw new Error('Izumi API failed to return a valid audio link.');
        }

        const audioData = res.data.result;

        // Change from video to document, update mimetype and filename
        await conn.sendMessage(from, {
            document: { url: audioData.download },
            mimetype: 'audio/mpeg', // Changed mimetype to audio/mpeg for MP3
            fileName: `${videoDataFromYts.title}.mp3`, // Changed filename to include artist and title
            caption: `*${videoDataFromYts.author.name} - ${videoDataFromYts.title}*\n\n> *_Downloaded by JAILBREAK_*` // Updated caption
        }, { quoted: mek });

    } catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        await conn.sendMessage(from, { text: 'Download failed: ' + (error?.message || 'Unknown error') }, { quoted: mek });
    }
});
