const { prefix } = require("../../config.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { EmbedBuilder, ActivityType } = require('discord.js');
const os = require('os');

module.exports = {
    name: "ready",
    run: async (client) => {
        // Initialize lavalink manager
        client.manager.init(client.user.id);
        
        // Create startup info for logs in both Hindi and English
        const serverCount = client.guilds.cache.size;
        const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const commandCount = client.slashCommands.size;
        
        // Prepare startup message (English only)
        const startupMessage = 
            `🤖 ${client.user.username} (test) online!\n\n` +
            
            `🌐 Ready on ${serverCount} servers, for a total of ${userCount} users\n\n` +
            
            `⚙️ Enabled commands: help, play, pause, resume\n` +
            `🔊 Music engine: Lavalink\n` +
            `💻 Platform: ${os.platform()} ${os.release()}\n` +
            `💾 Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`;
        
        // Log to console with colored format using new bilingual logger
        client.logger.logBilingual(
            `${client.user.username} online!`, 
            `${client.user.username} ऑनलाइन है!`, 
            "ready"
        );
        
        client.logger.logBilingual(
            `Ready on ${serverCount} servers, for a total of ${userCount} users`,
            `कुल ${userCount} उपयोगकर्ताओं के लिए ${serverCount} सर्वरों पर तैयार है`,
            "ready"
        );
        
        console.log("[BOT] " + client.user.tag + " is ready!");

        // Try to send startup notification to general log channel (not status channel)
        if (client.config.logs.general) {
            try {
                const generalLogChannel = await client.channels.fetch(client.config.logs.general).catch(() => null);
                
                if (generalLogChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🚀 Bot Started')
                        .setDescription(startupMessage)
                        .setThumbnail(client.user.displayAvatarURL())
                        .setTimestamp();
                        
                    await generalLogChannel.send({ embeds: [embed] });
                    client.logger.log(`Sent startup notification to general log channel: ${client.config.logs.general}`, "info", false);
                }
            } catch (error) {
                client.logger.log(`Failed to send startup notification: ${error.message}`, "error", true);
            }
        }
        
        // No longer initialize status monitoring here
        // Status monitoring is now handled in MusicClient.js to avoid duplicates
        
        // Register slash commands with Discord API
        try {
            client.logger.log('Started refreshing application (/) commands.', "info");
            
            // Get command data from each command
            const commands = client.slashCommands.map(command => command.data.toJSON());
            
            // Create REST instance for API calls
            const rest = new REST({ version: '9' }).setToken(client.token);
            
            // Register commands globally
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
            
            client.logger.log(`Successfully registered ${commands.length} application (/) commands.`, "ready");
        } catch (error) {
            client.logger.log(`Error registering application commands: ${error}`, "error");
        }

        // Status update function - updated for Discord.js v14
        function updateStatus() {
            let serverCount = client.guilds.cache.size;
            let userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            let status = (`${prefix}help | Serving Music in ${serverCount} servers & ${userCount} users` || `Serving Music in ${serverCount} servers & ${userCount} users`);

            // Convert the status type string to ActivityType enum for v14
            let activityType;
            switch(client.config.status.type.toUpperCase()) {
                case 'PLAYING': activityType = ActivityType.Playing; break;
                case 'STREAMING': activityType = ActivityType.Streaming; break;
                case 'LISTENING': activityType = ActivityType.Listening; break;
                case 'WATCHING': activityType = ActivityType.Watching; break;
                case 'COMPETING': activityType = ActivityType.Competing; break;
                default: activityType = ActivityType.Playing;
            }

            client.user.setPresence({
                activities: [
                    {
                        name: status,
                        type: activityType,
                        url: client.config.status.url || "https://www.youtube.com/watch?v=8kfP22meDL0"
                    }
                ],
                status: client.config.status.name || "online"
            });
        }

        // First time status update
        updateStatus();

        // Update status every 10 seconds
        setInterval(updateStatus, 10000);
    }
};