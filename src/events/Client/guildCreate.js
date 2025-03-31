const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const config = require('../../config');

/**
 * Handle event when the bot joins a new guild
 * @param {Client} client - Bot client instance
 * @param {Guild} guild - Guild that bot joined
 */
module.exports = {
    name: "guildCreate",
    async run(client, guild) {
        try {
            // Get the server join notification channel from config (BOT joined new server)
            const logChannel = await client.channels.fetch('1335329531262668803').catch(() => null);
            if (!logChannel) {
                return client.logger.log("Server join notification channel not found!", "error");
            }

            // Log the event in English only
            client.logger.logBilingual(
                `[GUILD JOIN] Bot joined ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`,
                `[GUILD JOIN] Bot joined ${guild.name} (${guild.id}) | Members: ${guild.memberCount}`,
                "info", true
            );

            // Fetch Guild Owner
            const owner = await guild.fetchOwner().catch(() => null);

            // Community Enabled Check
            const isCommunity = guild.features.includes("COMMUNITY");
            let inviteLink = "Not Available";

            // Invite Link Creation
            try {
                const channels = guild.channels.cache;
                let inviteChannel = channels.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has("CreateInstantInvite"));

                if (inviteChannel) {
                    const invite = await inviteChannel.createInvite({
                        maxAge: 0, // Permanent Invite
                        maxUses: 0
                    });
                    inviteLink = invite.url;
                }
            } catch (err) {
                client.logger.log(`Failed to create invite for ${guild.name}: ${err.message}`, "error");
            }

            // Fetching Inviter (If Available)
            let inviter = "Unknown";
            let inviterId = null;
            try {
                const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 1 }); // 28 is BOT_ADD
                const entry = auditLogs.entries.first();
                if (entry) {
                    inviterId = entry.executor.id;
                    inviter = `[${entry.executor.tag}](https://discord.com/users/${entry.executor.id})`;
                }
            } catch (err) {
                client.logger.log(`Failed to fetch inviter for ${guild.name}: ${err.message}`, "warn");
            }

            // Server Info Embed
            const embed = new EmbedBuilder()
                .setColor('#44ff44')
                .setAuthor({ name: `📥 Joined a New Server!`, iconURL: guild.iconURL({ dynamic: true }) })
                .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }) || client.user.displayAvatarURL())
                .setDescription(`
                    <:Jarvi_Logo:1340405392307388468> **Server Name:** \`${guild.name}\`
                    <a:Config_gif:1340947266772533360> **Server ID:** \`${guild.id}\`
                    ${owner ? `<a:King_mukut_gif:1342818101816856577> **Owner:** [${owner.user.tag}](https://discord.com/users/${owner.id})\n<:Id_card:1342864306441556121> **Owner ID:** \`${owner.id}\`` : ''}
                    <a:Save_the_date_gif:1342818099610517534> **Created On:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>
                    <a:Yellow_members_icon_gif:1342819050446782537> **Members:** \`${guild.memberCount.toLocaleString()}\`
                    🛡 **Community Enabled:** \`${isCommunity ? "Yes ✅" : "No ❌"}\`
                `)
                .addFields(
                    { name: "📌 Server Details", value: [
                        `<:Chat_Bubble:1342850239886790696> **Channels:** \`${guild.channels.cache.size}\``,
                        `<:Theatre_Mask:1342851810313900095> **Roles:** \`${guild.roles.cache.size}\``,
                        `<a:Discord_rocket:1342842402167324806> **Boosts:** \`${guild.premiumSubscriptionCount || 0}\``
                        ].join("\n"), inline: true
                    },
                    { name: "🔗 Invite Link", value: `[Click Here](${inviteLink})`, inline: true },
                    { name: "🤝 Invited By", value: inviter, inline: false },
                    { name: "🌐 Server Count", value: `${client.guilds.cache.size} servers`, inline: false }
                )
                .setFooter({ 
                    text: `${client.user.username} now in ${client.guilds.cache.size} servers`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Buttons
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Join Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteLink)
                    .setDisabled(inviteLink === "Not Available"),
                new ButtonBuilder()
                    .setLabel('Owner Profile')
                    .setStyle(ButtonStyle.Link)
                    .setURL(owner ? `https://discord.com/users/${owner.id}` : config.bot.supportServer)
                    .setDisabled(!owner)
            );

            // Send Log
            await logChannel.send({
                content: "🎉 **Bot joined a new server!**",
                embeds: [embed],
                components: [buttons]
            });

        } catch (error) {
            client.logger.log(`Error in guildCreate event: ${error.stack}`, "error");
        }
    }
};