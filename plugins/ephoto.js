const { JB } = require('../ryan');
const mumaker = require('mumaker');

// Reusable message templates for error and success messages
const messageTemplates = {
    error: (message) => ({
        text: `> ${message}`
    }),
    success: (imageUrl) => ({
        image: { url: imageUrl },
        caption: "JAILBREAK_AI"
    })
};

// A helper function to handle the core logic for all text effects
async function generateTextImage(conn, mek, q, url) {
    // Check if the user provided text to process
    if (!q) {
        return await conn.sendMessage(
            mek.key.remoteJid,
            messageTemplates.error("Please provide some text, e.g., `.ice JAILBREAK`")
        );
    }

    try {
        await conn.sendMessage(mek.key.remoteJid, {
            react: { text: "⏳", key: mek.key }
        });

        // Use the mumaker library to generate the image
        const result = await mumaker.ephoto(url, q);

        if (!result || !result.image) {
            throw new Error('No image URL received from the API.');
        }

        // Send the generated image back to the user
        await conn.sendMessage(mek.key.remoteJid, messageTemplates.success(result.image));

        // Remove the loading reaction
        await conn.sendMessage(mek.key.remoteJid, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error('Error generating text image:', error);
        // Inform the user about the error and remove the reaction
        await conn.sendMessage(mek.key.remoteJid, messageTemplates.error(`Error: ${error.message}`));
        await conn.sendMessage(mek.key.remoteJid, {
            react: { text: "❌", key: mek.key }
        });
    }
}

// --- Text Effect Commands ---

JB({
    pattern: "metallic",
    alias: ["metal"],
    desc: "Creates a 3D metallic text effect.",
    category: "textmaker",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html");
});

JB({
    pattern: "ice",
    alias: ["iceeffect"],
    desc: "Creates a text effect with ice and snow.",
    category: "textmaker",
    react: "🧊",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/ice-text-effect-online-101.html");
});

JB({
    pattern: "snow",
    alias: ["snoweffect"],
    desc: "Creates a 3D snow text effect.",
    category: "textmaker",
    react: "❄️",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html");
});

JB({
    pattern: "impressive",
    alias: ["colorful"],
    desc: "Creates an impressive colorful paint text effect.",
    category: "textmaker",
    react: "🌈",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html");
});

JB({
    pattern: "matrix",
    alias: ["matrixeffect"],
    desc: "Creates a Matrix-style text effect.",
    category: "textmaker",
    react: "💻",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/matrix-text-effect-154.html");
});

JB({
    pattern: "light",
    alias: ["lighteffect"],
    desc: "Creates a futuristic light text effect.",
    category: "textmaker",
    react: "💡",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html");
});

JB({
    pattern: "neon",
    alias: ["neoneffect"],
    desc: "Creates a colorful neon light text effect.",
    category: "textmaker",
    react: "💖",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html");
});

JB({
    pattern: "devil",
    alias: ["devileffect"],
    desc: "Creates a neon devil wings text effect.",
    category: "textmaker",
    react: "😈",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html");
});

JB({
    pattern: "purple",
    alias: ["purpleeffect"],
    desc: "Creates a purple text effect.",
    category: "textmaker",
    react: "💜",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/purple-text-effect-online-100.html");
});

JB({
    pattern: "thunder",
    alias: ["thundereffect"],
    desc: "Creates a thunder text effect.",
    category: "textmaker",
    react: "⚡️",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/thunder-text-effect-online-97.html");
});

JB({
    pattern: "leaves",
    alias: ["leaveseffect"],
    desc: "Creates a green leaves text effect.",
    category: "textmaker",
    react: "🌿",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html");
});

JB({
    pattern: "1917",
    alias: ["1917effect"],
    desc: "Creates a 1917-style text effect.",
    category: "textmaker",
    react: "🎖️",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/1917-style-text-effect-523.html");
});

JB({
    pattern: "arena",
    alias: ["arenaeffect"],
    desc: "Creates an Arena of Valor cover text effect.",
    category: "textmaker",
    react: "⚔️",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html");
});

JB({
    pattern: "hacker",
    alias: ["hackereffect"],
    desc: "Creates a hacker-style avatar text effect.",
    category: "textmaker",
    react: "🕶️",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html");
});

JB({
    pattern: "sand",
    alias: ["sandeffect"],
    desc: "Creates a text effect on sand.",
    category: "textmaker",
    react: "🏖️",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html");
});

JB({
    pattern: "blackpink",
    alias: ["blackpinkeffect"],
    desc: "Creates a Blackpink-style logo.",
    category: "textmaker",
    react: "🖤",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html");
});

JB({
    pattern: "glitch",
    alias: ["glitcheffect"],
    desc: "Creates a digital glitch text effect.",
    category: "textmaker",
    react: "👾",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html");
});

JB({
    pattern: "fire",
    alias: ["fireeffect"],
    desc: "Creates a flame lettering text effect.",
    category: "textmaker",
    react: "🔥",
    filename: __filename
}, async (conn, mek, m, { q }) => {
    await generateTextImage(conn, mek, q, "https://en.ephoto360.com/flame-lettering-effect-372.html");
});
