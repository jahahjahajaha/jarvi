const { EmbedBuilder } = require('discord.js');

/**
 * Handle event when the bot joins a new guild
 * @param {Client} client - Bot client instance
 * @param {Guild} guild - Guild that bot joined
 */
module.exports = {
    name: "guildCreate",
    async run(client, guild) {
        // Log the guild join to console
        client.logger.log(`[GUILD JOIN] ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`, "log");

        // Fetch the guild owner
        const ownerID = guild.ownerId;
        let owner;
        try {
            owner = await client.users.fetch(ownerID);
        } catch (error) {
            owner = { tag: "Unknown Owner", id: ownerID };
        }

        // Create a rich embed with detailed information
        const embed = new EmbedBuilder()
            .setTitle("🎉 Bot joined a new server!")
            .setThumbnail(guild.iconURL({ dynamic: true }) || "https://i.imgur.com/AWGELbd.png")
            .setColor(client.embedColor)
            .addFields([
                { name: "Server Name", value: `${guild.name}`, inline: true },
                { name: "Server ID", value: `${guild.id}`, inline: true },
                { name: "Owner", value: `${owner.tag || "Unknown"} (${ownerID})`, inline: true },
                { name: "Member Count", value: `${guild.memberCount} members`, inline: true },
                { name: "Server Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: "Bot Server Count", value: `${client.guilds.cache.size} servers`, inline: true }
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
                        client.logger.log(`Error sending guild join log: ${error.message}`, "error");
                    });
                }
            }
        } catch (error) {
            client.logger.log(`Error processing guild join log: ${error.message}`, "error");
        }
    }
};