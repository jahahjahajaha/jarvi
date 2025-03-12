const { EmbedBuilder } = require('discord.js');

/**
 * Handle event when the bot leaves a guild
 * @param {Client} client - Bot client instance
 * @param {Guild} guild - Guild that bot left
 */
module.exports = {
    name: "guildDelete",
    async run(client, guild) {
        // Log the guild leave to console
        client.logger.log(`[GUILD LEAVE] ${guild.name} (${guild.id})`, "log");

        // Fetch the guild owner if available
        const ownerID = guild.ownerId;
        let owner;
        try {
            owner = await client.users.fetch(ownerID);
        } catch (error) {
            owner = { tag: "Unknown Owner", id: ownerID };
        }

        // Create a rich embed with detailed information
        const embed = new EmbedBuilder()
            .setTitle("😢 Bot left a server")
            .setThumbnail(guild.iconURL({ dynamic: true }) || "https://i.imgur.com/AWGELbd.png")
            .setColor("#FF5555") // Red color for leaving
            .addFields([
                { name: "Server Name", value: `${guild.name}`, inline: true },
                { name: "Server ID", value: `${guild.id}`, inline: true },
                { name: "Owner", value: `${owner.tag || "Unknown"} (${ownerID})`, inline: true },
                { name: "Member Count", value: `${guild.memberCount} members`, inline: true },
                { name: "Server Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: "Remaining Server Count", value: `${client.guilds.cache.size} servers`, inline: true }
            ])
            .setFooter({ text: "Bot Logs System", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Send log to all log channels defined in config, if any
        try {
            // If you have a logging channel configured, send notification there
            const logChannelId = process.env.LOG_CHANNEL_ID;
            if (logChannelId) {
                const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] }).catch(error => {
                        client.logger.log(`Error sending guild leave log: ${error.message}`, "error");
                    });
                }
            }
        } catch (error) {
            client.logger.log(`Error processing guild leave log: ${error.message}`, "error");
        }
    }
};