const { JB } = require("../ryan");
const axios = require('axios');
const yts = require('yt-search');
const { downloadContentFromMessage } = require("@whiskeysockets/baileys"); // You may need this if you want to use bailey's features.

// Izumi API configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

JB({
    pattern: "video",
    alias: ["ytv", "vid", "ytvid"],
    react: "🎥",
    desc: "Search and download videos from YouTube.",
    category: "media",
    filename: __filename
}, async (conn, mek, m, { from, args }) => {
    try {
        const searchQuery = args.join(' ').trim();
        
        if (!searchQuery) {
            await conn.sendMessage(from, { text: 'What video do you want to download?' }, { quoted: mek });
            return;
        }

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        
        const youtubeUrlRegex = /(?:http?s?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([\w-]{11})(?:\S+)?/i;

        if (youtubeUrlRegex.test(searchQuery)) {
            videoUrl = searchQuery;
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await conn.sendMessage(from, { text: 'No videos found!' }, { quoted: mek });
                return;
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
            const captionTitle = videoTitle || searchQuery;
            if (thumb) {
                await conn.sendMessage(from, {
                    image: { url: thumb },
                    caption: `*${captionTitle}*\n\n_Downloading..._`
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

        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=720`;
        
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            throw new Error('Izumi API failed to return a valid video link.');
        }

        const videoData = res.data.result;

        await conn.sendMessage(from, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${videoData.title || videoTitle || 'video'}.mp4`,
            caption: `*${videoData.title || videoTitle || 'Video'}*\n\n> *_Downloaded by Knight Bot MD_*`
        }, { quoted: mek });

    } catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        await conn.sendMessage(from, { text: 'Download failed: ' + (error?.message || 'Unknown error') }, { quoted: mek });
    }
});