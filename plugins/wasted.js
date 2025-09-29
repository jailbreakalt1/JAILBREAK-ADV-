const { JB } = require('../ryan');
const axios = require('axios');

JB({
    pattern: "wasted",
    alias: ["wastedeffect"],
    desc: "Applies a 'wasted' effect to a user's profile picture.",
    category: "image",
    react: "💀",
    filename: __filename
}, async (conn, mek, m) => {
    let userToWaste;
    
    // Check for mentioned users in the message
    if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToWaste = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for a replied-to message
    else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
        userToWaste = mek.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToWaste) {
        return await conn.sendMessage(mek.key.remoteJid, {
            text: 'Please mention someone or reply to their message to waste them!'
        }, { quoted: mek });
    }

    try {
        await conn.sendMessage(mek.key.remoteJid, {
            react: { text: "⏳", key: mek.key }
        });

        // Get the user's profile picture URL, or use a default if it fails
        let profilePicUrl;
        try {
            profilePicUrl = await conn.profilePictureUrl(userToWaste, 'image');
        } catch {
            // Default image if profile picture is not available or is private
            profilePicUrl = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        // Fetch the wasted effect image from the API
        const wastedResponse = await axios.get(
            `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePicUrl)}`,
            { responseType: 'arraybuffer' }
        );

        // Send the generated image with the caption and mention
        await conn.sendMessage(mek.key.remoteJid, {
            image: Buffer.from(wastedResponse.data),
            caption: `⚰️ *Wasted*: @${userToWaste.split('@')[0]} 💀`,
            mentions: [userToWaste]
        });

        // Remove the loading reaction on success
        await conn.sendMessage(mek.key.remoteJid, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error('Error in wasted command:', error);
        await conn.sendMessage(mek.key.remoteJid, {
            text: 'Failed to create wasted image. Please try again later.'
        }, { quoted: mek });
        // Remove the loading reaction on failure
        await conn.sendMessage(mek.key.remoteJid, {
            react: { text: "❌", key: mek.key }
        });
    }
});
