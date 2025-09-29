const { JB } = require('../ryan');
const { igdl } = require("ruhend-scraper");

// Function to extract unique media URLs with simple deduplication
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    for (const media of mediaData) {
        if (!media.url) continue;
        
        // Only check for exact URL duplicates
        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }
    
    return uniqueMedia;
}

JB({
    pattern: "instagram",
    alias: ["ig", "igdl", "insta"],
    desc: "Downloads images and videos from an Instagram link.",
    category: "download",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    // Check if a URL was provided
    if (!q) {
        await conn.sendMessage(mek.key.remoteJid, {
            text: "Please provide an Instagram link to download media from."
        }, { quoted: mek });
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        return;
    }

    const url = q.trim();
    
    // Validate the Instagram URL
    const instagramPatterns = [
        /https?:\/\/(?:www\.)?instagram\.com\//,
        /https?:\/\/(?:www\.)?instagr\.am\//,
        /https?:\/\/(?:www\.)?instagram\.com\/p\//,
        /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
        /https?:\/\/(?:www\.)?instagram\.com\/tv\//
    ];
    const isValidUrl = instagramPatterns.some(pattern => pattern.test(url));
    
    if (!isValidUrl) {
        await conn.sendMessage(mek.key.remoteJid, {
            text: "That is not a valid Instagram link. Please provide a valid post, reel, or video link."
        }, { quoted: mek });
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        return;
    }

    // React to let the user know we're working on it
    await conn.sendMessage(mek.key.remoteJid, {
        react: { text: '⏳', key: mek.key }
    });

    try {
        const downloadData = await igdl(url);
        
        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            await conn.sendMessage(mek.key.remoteJid, {
                text: "❌ No media found at the provided link. The post might be private or the link is invalid."
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return;
        }

        const mediaData = downloadData.data;
        
        // Simple deduplication - just remove exact URL duplicates
        const uniqueMedia = extractUniqueMedia(mediaData);
        
        // Limit to maximum 20 unique media items
        const mediaToDownload = uniqueMedia.slice(0, 20);
        
        if (mediaToDownload.length === 0) {
            await conn.sendMessage(mek.key.remoteJid, {
                text: "❌ No valid media found to download. This might be a private post or the scraper failed."
            }, { quoted: mek });
            await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return;
        }

        // Download and send all media
        for (let i = 0; i < mediaToDownload.length; i++) {
            try {
                const media = mediaToDownload[i];
                const mediaUrl = media.url;
                
                // Determine if it's a video or image based on URL and type
                const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || media.type === 'video';

                if (isVideo) {
                    await conn.sendMessage(mek.key.remoteJid, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption: "Downloaded by JAILBREAK_BOT"
                    }, { quoted: mek });
                } else {
                    await conn.sendMessage(mek.key.remoteJid, {
                        image: { url: mediaUrl },
                        caption: "Downloaded by JAILBREAK_BOT"
                    }, { quoted: mek });
                }
                
                // Add a small delay between downloads to prevent rate limiting
                if (i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (mediaError) {
                console.error(`Error downloading media ${i + 1}:`, mediaError);
                // Continue with the next media if one fails
            }
        }
        
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('Error in Instagram command:', error);
        await conn.sendMessage(mek.key.remoteJid, {
            text: "❌ An unexpected error occurred while processing the Instagram request. Please try again."
        }, { quoted: mek });
        await conn.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
    }
});
