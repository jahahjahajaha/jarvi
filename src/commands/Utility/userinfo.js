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
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const user = member.user;

        // Get user presence status with emoji
        const status = {
            online: "<a:Online_gif:1342820038465552476> Online",
            idle: "<a:Idle_gif:1342820038465552476> Idle",
            dnd: "<a:DND_gif:1342820038465552476> Do Not Disturb",
            offline: "<a:Offline_gif:1342820038465552476> Offline"
        };

        // Get user badges
        const flags = {
            DISCORD_EMPLOYEE: "<a:Staff_gif:1342820038465552476>",
            DISCORD_PARTNER: "<a:Partner_gif:1342820038465552476>",
            BUGHUNTER_LEVEL_1: "<a:BugHunter_gif:1342820038465552476>",
            BUGHUNTER_LEVEL_2: "<a:BugHunter2_gif:1342820038465552476>",
            HYPESQUAD_EVENTS: "<a:HypeSquad_gif:1342820038465552476>",
            HOUSE_BRAVERY: "<a:Bravery_gif:1342820038465552476>",
            HOUSE_BRILLIANCE: "<a:Brilliance_gif:1342820038465552476>",
            HOUSE_BALANCE: "<a:Balance_gif:1342820038465552476>",
            EARLY_SUPPORTER: "<a:EarlySupporter_gif:1342820038465552476>",
            VERIFIED_BOT: "<a:VerifiedBot_gif:1342820038465552476>",
            VERIFIED_DEVELOPER: "<a:VerifiedDev_gif:1342820038465552476>"
        };

        const userFlags = user.flags ? user.flags.toArray() : [];

        // Get member roles except @everyone
        const memberRoles = member.roles.cache
            .filter(role => role.id !== message.guild.id) // Filter out @everyone
            .sort((a, b) => b.position - a.position)
            .map(role => `<@&${role.id}>`); // Format as role mentions

        // Get user display name - in Discord.js v14, discriminators are being phased out
        const userTag = user.discriminator && user.discriminator !== '0' 
            ? `${user.username}#${user.discriminator}` 
            : user.username;
            
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: userTag, 
                iconURL: user.displayAvatarURL({ dynamic: true }) 
            })
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor(member.displayHexColor || client.embedColor)
            .addFields([
                {
                    name: "📋 User Information",
                    value: `
**ID:** ${user.id}
**Nickname:** ${member.nickname || "None"}
**Status:** ${status[user.presence?.status || 'offline']}
**Account Created:** ${moment(user.createdAt).format('MMMM Do YYYY, h:mm:ss a')} (${moment(user.createdAt).fromNow()})
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
