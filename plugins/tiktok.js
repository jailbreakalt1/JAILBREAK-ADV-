const { JB } = require('../ryan');
const axios = require('axios');
const { ttdl } = require("ruhend-scraper");

JB({
    pattern: "tiktok",
    alias: ["tt", "tiktokdl"],
    desc: "Downloads TikTok videos and audio.",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    // Check if a TikTok link was provided
    if (!q) {
        await conn.sendMessage(mek.key.remoteJid, {
            text: "Please provide a TikTok link for the video."
        }, { quoted: mek });
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        return;
    }

    const url = q.trim();

    // Validate the TikTok URL
    const tiktokPatterns = [
        /https?:\/\/(?:www\.)?tiktok\.com\//,
        /https?:\/\/(?:vm\.)?tiktok\.com\//,
        /https?:\/\/(?:vt\.)?tiktok\.com\//,
        /https?:\/\/(?:www\.)?tiktok\.com\/@/,
        /https?:\/\/(?:www\.)?tiktok\.com\/t\//
    ];
    const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
    
    if (!isValidUrl) {
        await conn.sendMessage(mek.key.remoteJid, {
            text: "That is not a valid TikTok link. Please provide a valid TikTok video link."
        }, { quoted: mek });
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        return;
    }

    // React to let the user know we're working on it
    await conn.sendMessage(mek.key.remoteJid, {
        react: { text: '⏳', key: mek.key }
    });

    try {
        let videoUrl = null;
        let audioUrl = null;
        let title = null;

        // Try a series of APIs as a fallback mechanism
        const apis = [
            `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,
            `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
            `https://api.princetechn.com/api/download/tiktokdlv3?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
            `https://api.princetechn.com/api/download/tiktokdlv4?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
            `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
        ];

        for (const apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 10000 });
                if (response.data) {
                    if (response.data.result && response.data.result.videoUrl) {
                        videoUrl = response.data.result.videoUrl;
                        audioUrl = response.data.result.audioUrl;
                        title = response.data.result.title;
                        break;
                    } else if (response.data.tiktok && response.data.tiktok.video) {
                        videoUrl = response.data.tiktok.video;
                        break;
                    } else if (response.data.video) {
                        videoUrl = response.data.video;
                        break;
                    }
                }
            } catch (apiError) {
                console.error(`TikTok API failed: ${apiError.message}`);
                continue;
            }
        }

        // If no API worked, try the original `ttdl` method
        if (!videoUrl) {
            console.log("No external API worked, trying ruhend-scraper...");
            let downloadData = await ttdl(url);
            if (downloadData && downloadData.data && downloadData.data.length > 0) {
                const mediaData = downloadData.data;
                for (const media of mediaData) {
                    // Find a video URL from the results
                    if (media.type === 'video' || /\.(mp4|mov|avi|mkv|webm)$/i.test(media.url)) {
                        videoUrl = media.url;
                        break;
                    }
                }
            }
        }

        // Send the video if a URL was successfully found
        if (videoUrl) {
            // Attempt to send the video as a buffer first
            try {
                const videoResponse = await axios.get(videoUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const videoBuffer = Buffer.from(videoResponse.data);
                
                const caption = title ? `*JAILBREAK TIKTOK DOWNLOADER*\n📝 Title: ${title}` : "*JAILBREAK TIKTOK DOWNLOADER*";
                
                await conn.sendMessage(mek.key.remoteJid, {
                    video: videoBuffer,
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: mek });

                // Also send the audio if available
                if (audioUrl) {
                    try {
                        const audioResponse = await axios.get(audioUrl, {
                            responseType: 'arraybuffer',
                            timeout: 30000,
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });
                        await conn.sendMessage(mek.key.remoteJid, {
                            audio: Buffer.from(audioResponse.data),
                            mimetype: "audio/mp3",
                            caption: "🎵 *Audio from TikTok*"
                        }, { quoted: mek });
                    } catch (audioError) {
                        console.error(`Failed to download audio: ${audioError.message}`);
                    }
                }
                
            } catch (bufferError) {
                console.error(`Failed to download video as buffer: ${bufferError.message}. Falling back to URL.`);
                // If buffer download fails, try sending the URL directly
                const caption = title ? `*JAILBREAK TIKTOK DOWNLOADER*\n📝 Title: ${title}` : "*JAILBREAK TIKTOK DOWNLOADER*";
                await conn.sendMessage(mek.key.remoteJid, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: mek });
            }

            await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });

        } else {
            // If no video URL was found from any method
            await conn.sendMessage(mek.key.remoteJid, {
                text: "❌ Failed to download TikTok video. All download methods failed. Please try again with a different link or check if the video is available."
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        }

    } catch (error) {
        console.error('Error in TikTok command:', error);
        await conn.sendMessage(mek.key.remoteJid, {
            text: "An unexpected error occurred while processing the request. Please try again later."
        }, { quoted: mek });
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
    }
});
