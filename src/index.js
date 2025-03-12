// Suppress deprecation warnings
process.env.NODE_NO_WARNINGS = 1;

const MusicBot = require("./structures/MusicClient");
const Topgg = require("@top-gg/sdk");
const { EmbedBuilder } = require('discord.js');

// Remove server dependency - bot only mode
// const { server } = require('./server');

// Initialize the bot
const client = new MusicBot();

// Setup Top.gg API if configured
if (client.api?.topggapi) {
    client.topgg = new Topgg.Api(client.api.topggapi);
}

// Enhanced error handling system with logging to Discord channels (if possible)
process.on('unhandledRejection', async (error) => {
    console.error('[ERROR] Unhandled promise rejection:', error);
    
    try {
        // Try to log to Discord if client is ready and logger is initialized
        if (client.isReady() && client.logger) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔥 Error: Unhandled Promise Rejection')
                .setDescription(`\`\`\`js\n${error.stack ? error.stack.substring(0, 4000) : error}\n\`\`\``)
                .addFields([
                    { name: '⏰ Timestamp', value: new Date().toISOString() },
                    { name: '📊 Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB` }
                ])
                .setTimestamp();
                
            // Log to Discord channel if possible
            await client.logger.sendToLogChannel({ embeds: [errorEmbed] }, 'error');
        }
    } catch (logError) {
        console.error('Failed to log error to Discord:', logError);
    }
    // Don't exit the process, maintain stability
});

// Enhanced exception handler with bilingual support
process.on('uncaughtException', async (error) => {
    console.error('[CRITICAL] Uncaught exception:', error);
    
    try {
        // Log to Discord if possible
        if (client.isReady() && client.logger) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⚠️ Critical Error: Uncaught Exception')
                .setDescription(`\`\`\`js\n${error.stack ? error.stack.substring(0, 4000) : error}\n\`\`\``)
                .addFields([
                    { name: '⏰ Timestamp', value: new Date().toISOString() },
                    { name: '📊 Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB` },
                    { name: '💡 Recovery', value: 'Bot will attempt to continue operation. If issues persist, please contact support.' }
                ])
                .setTimestamp();
                
            // Log to Discord channel if possible
            await client.logger.sendToLogChannel({ embeds: [errorEmbed] }, 'error');
        }
    } catch (logError) {
        console.error('Failed to log critical error to Discord:', logError);
    }
    // Don't exit to maintain stability - serious errors will still show in console
});

// Add extra exit handlers to prevent accidental shutdown
process.on('SIGINT', () => {
    console.log('SIGINT received - ignoring to prevent shutdown');
    // Ignore SIGINT to prevent shutdown
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received - ignoring to prevent shutdown');
    // Ignore SIGTERM to prevent shutdown
});

// Initialize embed properties in ready event
client.once('ready', () => {
    client.embed = {
        footertext: process.env.FOOTER_TEXT || "Jarvi",
        footericon: process.env.FOOTER_ICON || client.user.displayAvatarURL(),
    };
    console.log(`[BOT] ${client.user.tag} is ready!`);
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    let options = interaction.values;
    const funny = options[0];

    const createEmbed = (title, description) => {
        return new EmbedBuilder()
            .setColor(client.embedColor)
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(description)
            .setAuthor({ 
                name: title, 
                iconURL: client.user.displayAvatarURL() 
            });
    };

    let embed;
    switch (funny) {
        case 'first':
            embed = createEmbed("Information Commands", "➡ `:` Help\n➡ `:` Invite\n➡ `:` Ping\n➡ `:` Node\n➡ `:` Stats\n➡ `:` Uptime");
            break;
        case 'second':
            embed = createEmbed("Music Commands", "➡ `:` AutoPlay\n➡ `:` Clearqueue\n➡ `:` Join\n➡ `:` Leave\n➡ `:` Loop\n➡ `:` Nowplaying\n➡ `:` Pause\n➡ `:` Play\n➡ `:` Volume\n➡ `:` Destroy\n➡ `:` Queue\n➡ `:` Resume\n➡ `:` Shuffle\n➡ `:` Skip\n➡ `:` Stop");
            break;
        case 'third':
            embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields([
                    { name: "Information Commands [6]", value: "`help, invite, ping, node, stats, uptime`" },
                    { name: "Music Commands [15]", value: "`autoplay, clearqueue, join, leave, loop, nowplaying, pause, play, volume, destroy, queue, resume, shuffle, skip, stop`" },
                    { name: "Filter Commands [1]", value: "`filters`" },
                    { name: "Settings [3]", value: "`24/7, setprefix, destroy`" }
                ])
                .setAuthor({ 
                    name: "All Commands", 
                    iconURL: client.user.displayAvatarURL() 
                });
            break;
        case 'fourth':
            embed = createEmbed("Filter Commands", "➡ `:` Filters");
            break;
        case 'fifth':
            embed = createEmbed("Config Commands", "➡ `:` 24/7\n➡ `:` Setprefix\n➡ `:` Destroy");
            break;
        case 'sixth':
            embed = createEmbed("Utility Commands", "➡ `:` Avatar\n➡ `:` Serverinfo\n➡ `:` Servericon\n➡ `:` Membercount\n➡ `:` Firstmsg\n➡ `:` Listroles\n➡ `:` Listemojis");
            break;
        default:
            embed = createEmbed("Unknown Command", "❌ Invalid selection. Please try again.");
            break;
    }

    await interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error);
});

// Start the bot with detailed diagnostics
console.log('[STARTUP] Starting connection process with the following configuration:');
console.log(`[STARTUP] Bot Client ID: ${client.config.bot.clientId}`);
console.log(`[STARTUP] MongoDB URL configured: ${client.config.api.mongourl ? 'Yes' : 'No'}`);
console.log(`[STARTUP] Lavalink Node: ${client.config.nodes[0]?.host || 'Not configured'}`);
console.log(`[STARTUP] Total commands loaded: ${client.commands.size}`);
console.log(`[STARTUP] Total slash commands loaded: ${client.slashCommands.size}`);
console.log('[STARTUP] Initiating connection to Discord...');

// Try direct login with raw tokens as a temporary workaround for testing
console.log('[STARTUP] Attempting direct connection with token...');
const directToken = process.env.DISCORD_TOKEN || process.env.TOKEN;

if (!directToken) {
    console.error('[FATAL] No token available! Both DISCORD_TOKEN and TOKEN are missing or empty.');
    process.exit(1);
}

// First try with client's normal connect method
client.connect().then(() => {
    console.log('[STARTUP] Successfully connected to Discord!');
    console.log(`[STARTUP] Logged in as: ${client.user.tag} (${client.user.id})`);
    console.log(`[STARTUP] Bot is in ${client.guilds.cache.size} servers`);
}).catch(error => {
    console.error('[CONNECTION ERROR] Primary connection method failed:', error.message);
    
    // More detailed error diagnostics
    if (error.code === 'TOKEN_INVALID') {
        console.error('[TOKEN_ERROR] The provided token is invalid. Please check your .env file.');
        console.error('[TOKEN_DEBUG] Token value being used:', directToken.substring(0, 10) + '...');
        console.error('[TOKEN_DEBUG] Environment variable values:');
        console.error('[TOKEN_DEBUG] DISCORD_TOKEN exists:', !!process.env.DISCORD_TOKEN);
        console.error('[TOKEN_DEBUG] TOKEN exists:', !!process.env.TOKEN);
        
        // Attempt a direct login as fallback
        console.log('[RETRY] Attempting direct login as fallback...');
        client.login(directToken).then(() => {
            console.log('[STARTUP] Successfully connected via direct login!');
            console.log(`[STARTUP] Logged in as: ${client.user.tag} (${client.user.id})`);
            console.log(`[STARTUP] Bot is in ${client.guilds.cache.size} servers`);
        }).catch(directError => {
            console.error('[FATAL] Direct login also failed:', directError.message);
            process.exit(1);
        });
    } else if (error.code === 'DISALLOWED_INTENTS') {
        console.error('[INTENTS_ERROR] The bot is missing required privileged intents. Please enable them in the Discord Developer Portal.');
        process.exit(1);
    } else {
        console.error('[UNKNOWN_ERROR] Error details:', error.message);
        process.exit(1);
    }
});

module.exports = client;