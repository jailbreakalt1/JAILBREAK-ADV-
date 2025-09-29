require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const P = require('pino');
const readline = require('readline');
const {
    makeInMemoryStore,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeWASocket,
    DisconnectReason,
    getContentType,
    Browsers
} = require('@whiskeysockets/baileys');

const { commands } = require('./ryan');
const antiLink = require('./plugins/antilink');
const { handleChatbotResponse } = require('./plugins/chatbot.js'); // Import the chatbot response handler

const prefix = process.env.PREFIX || '.';
const mode = process.env.MODE || 'public';
const ownerNumbers = (process.env.OWNER_NUMBER || '')
    .split(',')
    .map(num => num.trim());

const warningsLimit = parseInt(process.env.WARNINGS || '20', 10);
const stealthMode = process.env.STEALTH_MODE === 'true';
const disableReadReceipts = process.env.DISABLE_READ_RECEIPTS === 'true';

const app = express();
const port = process.env.PORT || 9090;

const dynamicImport = new Function('modulePath', 'return import(modulePath)');

function sanitizeNumberDigits(x = '') {
    return String(x).replace(/\D/g, '');
}

// Global session object (now just holds the one connection instance)
let connInstance = null; 

// readline for console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const ask = (q) => new Promise(res => rl.question(q, ans => res(ans.trim())));

// Load plugins
const pluginDir = path.join(__dirname, 'plugins');
fs.readdirSync(pluginDir)
    .filter(file => file.endsWith('.js'))
    .forEach(file => require(path.join(pluginDir, file)));

/**
 * Starts the bot connection, defaulting to a single session ID 'default'.
 * @param {boolean} promptIfUnregistered - Whether to prompt for a pairing code.
 */
async function startBot(promptIfUnregistered = false) {
    const sessionId = 'default'; // Hardcode to ensure only one session runs
    const chalk = (await dynamicImport('chalk')).default;
    const authDir = path.join(__dirname, 'sessions', sessionId);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Firefox'),
        auth: state
    });

    connInstance = conn; // Store the single connection instance

    // --- FIX 2: Debounce saveCreds for robustness ---
    let credsUpdateTimeout = null;
    const debouncedSaveCreds = () => {
        if (credsUpdateTimeout) clearTimeout(credsUpdateTimeout);
        // Throttle saving creds to prevent file writing conflicts during high load
        credsUpdateTimeout = setTimeout(saveCreds, 500); 
    };
    
    if (!conn.authState.creds.registered && promptIfUnregistered) {
        let number = await ask("Enter your WhatsApp number (e.g., 263788363700): \n\n");
        number = sanitizeNumberDigits(number);
        try {
            const code = await conn.requestPairingCode(number);
            const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(chalk.greenBright(`\n✅ Your Pairing Code for ${number}: ${formatted}`));
            console.log(chalk.yellow(`\n👉 On your WhatsApp:\n1. Open Settings > Linked Devices\n2. Tap "Link a Device"\n3. Enter the code above\n`));
        } catch (e) {
            console.error(chalk.red("❌ Failed to get pairing code:"), e);
            process.exit(1);
        }
    }

    conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
            console.log(chalk.hex('#ffff00').bgHex('#000000')(`Reconnecting session ${sessionId}...`));
            startBot(); // Restart the single session
        } else if (connection === 'open') {
            console.log(chalk.hex('#00ffff').bgHex('#000000')(`✅ Session ${sessionId} connected`));

            if (stealthMode) {
                await conn.sendPresenceUpdate('unavailable');
                conn.sendPresenceUpdate = async () => {};
                conn.ws.on('CB:presence', () => {});
                console.log(chalk.gray(`🕵️ Stealth mode enabled for ${sessionId}`));
            }

            if (disableReadReceipts) {
                conn.readMessages = async () => {};
                console.log(chalk.gray(`📭 Read receipts disabled for ${sessionId}`));
            }

            conn.sendMessage(conn.user.id, { text: `*JAILBREAK*\n> online & ready${stealthMode ? ' (stealth mode)' : ''}.` });
        }
    });

    // Use the debounced function
    conn.ev.on('creds.update', debouncedSaveCreds);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const mek = messages[0];
        
        // Get the bot's own JID
        const botJid = conn.user.id;
        const from = mek.key.remoteJid;
        const senderJid = (mek?.key?.participant) || (mek?.participant) || (mek?.key?.remoteJid) || from || '';

        if (!mek.message) return;

        const mtype = getContentType(mek.message);
        const body = (
            mtype === 'conversation' ? mek.message.conversation
                : mek.message[mtype]?.caption || mek.message[mtype]?.text || ''
        )?.trim();
        if (!body) return;

        const isGroup = from.endsWith('@g.us');
        const senderNumber = sanitizeNumberDigits(senderJid.split('@')[0] || senderJid);
        const owners = ownerNumbers.map(sanitizeNumberDigits);
        const isOwner = owners.includes(senderNumber);

        console.log(
            `📨 [${isGroup
                ? chalk.hex('#FFD700')('GROUP')
                : chalk.hex('#00FFFF')('INBOX')
            }] ${chalk.hex('#32CD32')(senderNumber)} → ${chalk.hex('#FF69B4')(body)}`
        );

        // Check if the message is a command first
        const isCmd = body.startsWith(prefix);

        // Handle messages from the bot's own number more intelligently
        // If the message is from the bot's device AND is NOT a command, we'll ignore it.
        if (mek.key.fromMe && !isCmd) {
            console.log('🤖 Bot received a non-command message from its own device, ignoring.');
            return;
        }

        await antiLink.onMessage(conn, mek, null, {
            owners,
            warningsLimit,
            senderNumber,
            isGroup,
            from,
            body
        });
        
        const normalizedBody = body.replace(/^[^\w]+/, '').trim().toLowerCase();
        const cmdName = isCmd ? normalizedBody.split(/\s+/)[0] : '';
        const args = normalizedBody.split(/\s+/).slice(1);

        if (isCmd) {
            // Now we check for ownership and mode ONLY if the message is a command.
            if (!isOwner) {
                if (mode === 'private') {
                    console.log('🚦 Filtering message: Bot is in private mode and sender is not an owner.');
                    return;
                }
                if (isGroup && mode === 'inbox') {
                    console.log('🚦 Filtering message: Bot is in inbox mode and message is from a group.');
                    return;
                }
                if (!isGroup && mode === 'groups') {
                    console.log('🚦 Filtering message: Bot is in groups mode and message is from a private chat.');
                    return;
                }
            }

            console.log(`✅ Message is a command. Attempting to execute: "${cmdName}"`);
            const cmd = commands.find(c =>
                c.pattern.toLowerCase() === cmdName ||
                (Array.isArray(c.alias) && c.alias.map(a => a.toLowerCase()).includes(cmdName))
            );

            if (!cmd) {
                console.log(`❓ Unknown command: "${cmdName}"`);
                return;
            }

            console.log(`⚡ [${sessionId}] Command matched: "${cmdName}" → ${cmd.filename}`);

            if (cmd.react) {
                await conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
            }

            try {
                await cmd.function(conn, mek, {}, {
                    sender: senderJid,
                    body,
                    args,
                    q: args.join(" "),
                    text: args.join(" "),
                    from,
                    isGroup,
                    reply: (text) => conn.sendMessage(from, { text }, { quoted: mek })
                });
            } catch (err) {
                console.error(`❌ Error in command "${cmdName}":`, err);
                conn.sendMessage(from, { text: '❌ Error occurred while executing command.' }, { quoted: mek });
            }
        } else {
            // --- Chatbot Integration ---
            // This is the new section for handling non-command messages.
            // We check if it's a private chat and not a command.
            const isPrivateChat = !isGroup;
            if (isPrivateChat) {
                console.log('💬 Message is a non-command in a private chat. Passing to chatbot.');
                await handleChatbotResponse(conn, mek, null, {
                    reply: (text) => conn.sendMessage(from, { text }, { quoted: mek }),
                    text: body
                });
            }
        }
    });
}

(async () => {
    const chalk = (await dynamicImport('chalk')).default;
    const sessionsPath = path.join(__dirname, 'sessions');
    if (!fs.existsSync(sessionsPath)) fs.mkdirSync(sessionsPath, { recursive: true });

    // --- FIX 1: Start only the single 'default' session ---
    const defaultAuthDir = path.join(sessionsPath, 'default', 'creds.json');
    
    if (fs.existsSync(defaultAuthDir)) {
        console.log(chalk.green(`▶️ Loading existing 'default' session.`));
        startBot(false);
    } else {
        console.log(chalk.yellow('⚠️ No valid sessions found, prompting for first pairing...'));
        await startBot(true);
    }
    // --- End FIX 1 ---

    app.get('/', (_, res) => res.send(`🟢 JAILBREAK BOT ONLINE${stealthMode ? ' (stealth mode)' : ''}`));
    app.listen(port, () => console.log(`🌐 Listening at http://localhost:${port}`));
})();
