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

// Handle uncaught errors - improved error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    // Don't exit the process, just log the error
});

// Handle uncaught exceptions to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Don't exit the process, just log the error
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

// Start the bot
client.connect().catch(error => {
    console.error('[FATAL] Application startup failed:', error);
    process.exit(1);
});

module.exports = client;