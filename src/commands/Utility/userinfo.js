const { EmbedBuilder } = require("discord.js");
const moment = require("moment");

module.exports = {
    name: "userinfo",
    category: "Utility",
    aliases: ["ui", "user", "whois"],
    description: "Get detailed information about a user",
    args: false,
    usage: "[@user]",
    permission: [],
    owner: false,

    execute: async (message, args, client, prefix) => {
        // Fix: Get the mentioned user or the user by ID, or default to the message author
        const targetUser = message.mentions.users.first() || 
                          (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) || 
                          message.author;
                          
        // Get the member object if the user is in the guild
        const member = message.guild.members.cache.get(targetUser.id) || 
                      (await message.guild.members.fetch(targetUser.id).catch(() => null));
        
        if (!member) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`❌ | User not found in this server!`)
                ]
            });
        }

        // Get user presence status with emoji
        const status = {
            online: "🟢 Online",
            idle: "🟠 Idle",
            dnd: "🔴 Do Not Disturb",
            offline: "⚫ Offline"
        };

        // Get user badges
        const flags = {
            DISCORD_EMPLOYEE: "👨‍💼",
            DISCORD_PARTNER: "🤝",
            BUGHUNTER_LEVEL_1: "🐛",
            BUGHUNTER_LEVEL_2: "🐞",
            HYPESQUAD_EVENTS: "🏃‍♂️",
            HOUSE_BRAVERY: "🧡",
            HOUSE_BRILLIANCE: "💜",
            HOUSE_BALANCE: "💙",
            EARLY_SUPPORTER: "🎖️",
            VERIFIED_BOT: "✅",
            VERIFIED_DEVELOPER: "👨‍💻"
        };

        const userFlags = targetUser.flags ? targetUser.flags.toArray() : [];

        // Get member roles except @everyone
        const memberRoles = member.roles.cache
            .filter(role => role.id !== message.guild.id) // Filter out @everyone
            .sort((a, b) => b.position - a.position)
            .map(role => `<@&${role.id}>`); // Format as role mentions

        // Get user display name - handle global names properly
        const userTag = targetUser.globalName || targetUser.username;
            
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: userTag, 
                iconURL: targetUser.displayAvatarURL({ dynamic: true }) 
            })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor(member.displayHexColor || client.embedColor)
            .addFields([
                {
                    name: "📋 User Information",
                    value: `
**Username:** ${targetUser.username}
**Global Name:** ${targetUser.globalName || "None"}
**ID:** ${targetUser.id}
**Nickname:** ${member.nickname || "None"}
**Status:** ${status[targetUser.presence?.status || 'offline']}
**Account Created:** ${moment(targetUser.createdAt).format('MMMM Do YYYY, h:mm:ss a')} (${moment(targetUser.createdAt).fromNow()})
**Server Joined:** ${moment(member.joinedAt).format('MMMM Do YYYY, h:mm:ss a')} (${moment(member.joinedAt).fromNow()})
**Badges:** ${userFlags.length ? userFlags.map(flag => flags[flag]).join(' ') : 'None'}
                    `,
                    inline: false
                },
                {
                    name: `👥 Roles [${memberRoles.length}]`,
                    value: memberRoles.length ? memberRoles.join(", ") : "No roles",
                    inline: false
                }
            ])
            .setFooter({ 
                text: `Requested by ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
