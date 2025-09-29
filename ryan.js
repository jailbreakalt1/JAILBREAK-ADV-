// ryan.js
var commands = [];

/**
 * Register a command or button handler.
 * @param {Object} info - Command info.
 * @param {Function} func - Handler function.
 */
function JB(info, func) {
    const data = { ...info, function: func };
    // Set default values if not provided
    if (data.dontAddCommandList === undefined) data.dontAddCommandList = false;
    if (data.desc === undefined) data.desc = '';
    if (data.fromMe === undefined) data.fromMe = false;
    if (data.category === undefined) data.category = 'misc';
    if (data.filename === undefined) data.filename = "Not Provided";
    commands.push(data);
    return data;
}

/**
 * Dispatcher to run commands.
 * Call this inside your main Baileys message handler.
 * @param {object} conn - The Baileys connection object.
 * @param {object} mek - The message object.
 */
async function handleMessage(conn, mek) {
    try {
        let body = '';
        let isButton = false;

        // Determine message body and type
        const messageContent = getContentType(mek.message);
        if (messageContent === 'conversation') {
            body = mek.message.conversation;
        } else if (messageContent === 'extendedTextMessage') {
            body = mek.message.extendedTextMessage.text;
        } else if (messageContent === 'buttonsResponseMessage') {
            body = mek.message.buttonsResponseMessage.selectedButtonId;
            isButton = true;
        } else if (messageContent === 'templateButtonReplyMessage') {
            body = mek.message.templateButtonReplyMessage.selectedId;
            isButton = true;
        }

        if (!body) return;

        const normalizedBody = body.toLowerCase();

        for (let cmd of commands) {
            // Normalize pattern to be case-insensitive and match with optional prefix
            const patternRegex = new RegExp(`^${cmd.pattern}`, "i");

            // Check if it's a command
            if (patternRegex.test(normalizedBody)) {
                // If it's a button, check if it's a specific button command
                if (isButton && !cmd.onButton) continue;
                // If it's a text command, check if it's a specific text command
                if (!isButton && cmd.onButton) continue;

                const q = body.replace(patternRegex, "").trim();

                try {
                    await cmd.function(conn, mek, mek.message, {
                        from: mek.key.remoteJid,
                        reply: (txt) =>
                            conn.sendMessage(mek.key.remoteJid, { text: txt }, { quoted: mek }),
                        q,
                    });
                } catch (err) {
                    console.error(`❌ Error executing command '${cmd.pattern}':`, err);
                    await conn.sendMessage(mek.key.remoteJid, { text: 'An internal error occurred while executing this command.' }, { quoted: mek });
                }
                return;
            }
        }
    } catch (err) {
        console.error("handleMessage error:", err);
    }
}

module.exports = {
    JB,
    AddCommand: JB,
    Function: JB,
    Module: JB,
    commands,
    handleMessage,
};
