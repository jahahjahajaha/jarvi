const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

/**
 * Handle event when the bot leaves a guild
 * @param {Client} client - Bot client instance
 * @param {Guild} guild - Guild that bot left
 */
module.exports = {
    name: "guildDelete",
    async run(client, guild) {
        try {
            // Get the server leave notification channel from config
            const logChannel = await client.channels.fetch(config.logs.serverjoinleave).catch(() => null);
            if (!logChannel) {
                return client.logger.log("Server leave notification channel not found!", "error");
            }
            
            // Log the event in English only
            client.logger.logBilingual(
                `[GUILD LEAVE] Bot left ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`,
                `[GUILD LEAVE] Bot left ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`,
                "info", true
            );

            // Fetch the guild owner if available
            const ownerID = guild.ownerId;
            let owner;
            try {
                owner = await client.users.fetch(ownerID);
            } catch (error) {
                client.logger.log(`Could not fetch owner of ${guild.name}: ${error.message}`, "warn");
            }

            // Calculate how long the bot was in the server
            const joinedAt = guild.joinedAt ? Math.floor(guild.joinedAt.getTime() / 1000) : null;
            const now = Math.floor(Date.now() / 1000);
            const timeInServer = joinedAt ? (now - joinedAt) : null;
            
            let timeString = "Unknown";
            if (timeInServer) {
                const days = Math.floor(timeInServer / 86400);
                const hours = Math.floor((timeInServer % 86400) / 3600);
                const minutes = Math.floor((timeInServer % 3600) / 60);
                
                if (days > 0) {
                    timeString = `${days} days, ${hours} hours, ${minutes} minutes`;
                } else if (hours > 0) {
                    timeString = `${hours} hours, ${minutes} minutes`;
                } else {
                    timeString = `${minutes} minutes`;
                }
            }

            // Create embed for server leave notification
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setAuthor({ name: `📤 Left a Server!`, iconURL: guild.iconURL({ dynamic: true }) })
                .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }) || client.user.displayAvatarURL())
                .setDescription(`
                    <:Jarvi_Logo:1340405392307388468> **Server Name:** \`${guild.name}\`
                    <a:Config_gif:1340947266772533360> **Server ID:** \`${guild.id}\`
                    ${owner ? `<a:King_mukut_gif:1342818101816856577> **Owner:** [${owner.tag}](https://discord.com/users/${owner.id})\n<:Id_card:1342864306441556121> **Owner ID:** \`${owner.id}\`` : `<:Id_card:1342864306441556121> **Owner ID:** \`${ownerID}\``}
                    <a:Save_the_date_gif:1342818099610517534> **Created On:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>
                    <a:Yellow_members_icon_gif:1342819050446782537> **Members:** \`${guild.memberCount.toLocaleString()}\`
                `)
                .addFields([
                    { 
                        name: "⏱️ Time in Server", 
                        value: timeString, 
                        inline: true 
                    },
                    { 
                        name: "🌐 Remaining Servers", 
                        value: `${client.guilds.cache.size} servers`, 
                        inline: true 
                    },
                    {
                        name: "📊 Bot Statistics",
                        value: [
                            `**Total Users:** ${client.users.cache.size}`,
                            `**Total Players:** ${client.manager?.players?.size || 0}`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `${client.user.username} now in ${client.guilds.cache.size} servers`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Create button row if we have owner info
            const components = [];
            if (owner) {
                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Owner Profile')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/users/${owner.id}`),
                    new ButtonBuilder()
                        .setLabel('Support Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL(config.bot.supportServer)
                );
                components.push(buttons);
            }

            // Send Log
            await logChannel.send({
                content: "😢 **Bot left a server!**", 
                embeds: [embed],
                components: components
            });

        } catch (error) {
            client.logger.log(`Error in guildDelete event: ${error.stack}`, "error");
        }
    }
};