const { prefix } = require("../../config.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    name: "ready",
    run: async (client) => {
        // Initialize lavalink manager
        client.manager.init(client.user.id);
        
        // Create startup info for logs in both Hindi and English
        const serverCount = client.guilds.cache.size;
        const userCount = client.users.cache.size;
        const commandCount = client.slashCommands.size;
        
        // Prepare bilingual startup message
        const startupMessage = 
            `🤖 ${client.user.username} (test) online!\n` +
            `🤖 ${client.user.username} (टेस्ट) ऑनलाइन है!\n\n` +
            
            `🌐 Ready on ${serverCount} servers, for a total of ${userCount} users\n` +
            `🌐 कुल ${userCount} उपयोगकर्ताओं के लिए ${serverCount} सर्वरों पर तैयार है\n\n` +
            
            `⚙️ Enabled commands (सक्षम कमांड्स): help, play, pause, resume\n` +
            `🔊 Music engine (संगीत इंजन): Lavalink\n` +
            `💻 Platform (प्लेटफॉर्म): ${os.platform()} ${os.release()}\n` +
            `💾 Memory (मेमोरी): ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`;
        
        // Log to console with colored format
        client.logger.log(`${client.user.username} online!`, "ready");
        client.logger.log(`Ready on ${serverCount} servers, for a total of ${userCount} users`, "ready");
        console.log("[BOT] " + client.user.tag + " is ready!");

        // Try to send startup notification to log channel if configured
        if (client.config.logChannelId) {
            try {
                const logChannel = await client.channels.fetch(client.config.logChannelId).catch(() => null);
                
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🚀 Bot Started / बॉट शुरू हुआ')
                        .setDescription(startupMessage)
                        .setThumbnail(client.user.displayAvatarURL())
                        .setTimestamp();
                        
                    await logChannel.send({ embeds: [embed] });
                    client.logger.log(`Sent startup notification to log channel: ${client.config.logChannelId}`, "info");
                }
            } catch (error) {
                client.logger.log(`Failed to send startup notification: ${error.message}`, "error");
            }
        }
        
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

        // Status update function
        function updateStatus() {
            let serverCount = client.guilds.cache.size;
            let userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            let status = (`${prefix}help | Serving Music in ${serverCount} servers & ${userCount} users` || `Serving Music in ${serverCount} servers & ${userCount} users`);

            client.user.setPresence({
                activities: [
                    {
                        name: status,
                        type: (client.config.status.type || `STREAMING`),
                        url: (client.config.status.url || `https://www.youtube.com/watch?v=8kfP22meDL0`)
                    }
                ],
                status: (client.config.status.name || "online")
            });
        }

        // Pehli baar status set karega
        updateStatus();

        // Har 10 seconds me status update karega
        setInterval(updateStatus, 10000);
    }
};