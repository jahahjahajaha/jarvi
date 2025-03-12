const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

/**
 * Handle event when a member leaves any guild
 * @param {Client} client - Bot client instance
 * @param {GuildMember} member - Guild member that left
 */
module.exports = {
    name: "guildMemberRemove",
    async run(client, member) {
        try {
            // Check if this is our support server
            if (member.guild.id !== config.bot.supportServerID) return;
            
            // Skip if it's a bot (unless we want to log bot leaves too)
            if (member.user.bot) return;
            
            // Check if leave channel exists
            const leaveChannel = await client.channels.fetch(config.logs.leave).catch(() => null);
            if (!leaveChannel) {
                return client.logger.log("Support server goodbye channel not found!", "error");
            }
            
            // Calculate how long they were in the server
            const joinTimestamp = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
            const leaveTimestamp = Math.floor(Date.now() / 1000);
            const timeInServer = joinTimestamp ? (leaveTimestamp - joinTimestamp) : null;
            
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
            
            // Member count after the member left
            const memberCount = member.guild.memberCount;
            
            // Roles the member had
            const roles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => `<@&${r.id}>`).join(', ') || 'None';
            
            // Create goodbye embed
            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setAuthor({
                    name: `${member.user.tag} left the server`,
                    iconURL: member.user.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`
                    <a:Goodbye_gif:1340405392307388468> <@${member.id}> has left the server.
                    
                    <a:Yellow_members_icon_gif:1342819050446782537> We now have **${memberCount}** members.
                    
                    <a:Save_the_date_gif:1342818099610517534> Joined: ${joinTimestamp ? `<t:${joinTimestamp}:F> (<t:${joinTimestamp}:R>)` : 'Unknown'}
                    <:Clock_timer:1342818097765589013> Time in server: **${timeString}**
                `)
                .addFields({ 
                    name: '🔶 Roles', 
                    value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles
                })
                .setFooter({ 
                    text: `ID: ${member.id}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();
            
            // Send goodbye message
            await leaveChannel.send({
                embeds: [embed]
            });
            
            client.logger.log(`Member left support server: ${member.user.tag}`, "info");
            
        } catch (error) {
            client.logger.log(`Error in guildMemberRemove event: ${error.stack}`, "error");
        }
    }
};