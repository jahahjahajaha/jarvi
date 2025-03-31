const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
            
            // Check if leave channel exists (member leave channel for SUPPORT server)
            const leaveChannel = await client.channels.fetch('1335329530885308539').catch(() => null);
            if (!leaveChannel) {
                return client.logger.log("Support server goodbye channel not found!", "error");
            }
            
            // Calculate how long they were in the server
            const joinTimestamp = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
            const leaveTimestamp = Math.floor(Date.now() / 1000);
            const timeInServer = joinTimestamp ? (leaveTimestamp - joinTimestamp) : null;
            
            // More attractive time formatting
            let timeString = "Unknown";
            if (timeInServer) {
                const days = Math.floor(timeInServer / 86400);
                const hours = Math.floor((timeInServer % 86400) / 3600);
                const minutes = Math.floor((timeInServer % 3600) / 60);
                const seconds = Math.floor(timeInServer % 60);
                
                const parts = [];
                if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
                if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
                if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
                if (seconds > 0 && parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
                
                timeString = parts.join(', ');
            }
            
            // Was the user a new member? (less than 1 day)
            const wasNewMember = timeInServer && timeInServer < 86400;
            
            // Member count after the member left
            const memberCount = member.guild.memberCount;
            
            // Roles the member had (sort by position for better display)
            const roles = member.roles.cache
                .filter(r => r.id !== member.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => `<@&${r.id}>`)
                .join(', ') || 'No roles';
            
            // User activity analysis
            let activityNotes = [];
            if (wasNewMember) {
                activityNotes.push('⚠️ **Note:** User left shortly after joining');
            }
            
            // Get user's badge emojis if any were cached
            const userBadges = '';
            
            // Create a more attractive goodbye embed with color gradient based on time in server
            let embedColor = '#FF5555'; // Default red for leave
            
            if (timeInServer) {
                if (timeInServer < 3600) { // Less than an hour
                    embedColor = '#FF3333'; // Bright red
                } else if (timeInServer < 86400) { // Less than a day
                    embedColor = '#FF6666'; // Lighter red
                } else if (timeInServer > 2592000) { // More than 30 days
                    embedColor = '#AA55AA'; // Purple for long time members leaving
                }
            }
            
            // Create a more attractive goodbye embed
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({
                    name: `${member.user.tag} ${userBadges}`,
                    iconURL: member.user.displayAvatarURL({ dynamic: true })
                })
                .setTitle('Member Left the Server')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`
                    <a:Goodbye_wave_gif:1348297693318144060> **${member.user.username}** has left our server.
                    
                    <a:Yellow_members_icon_gif:1342819050446782537> We now have **${memberCount.toLocaleString()}** members.
                    ${activityNotes.length > 0 ? `\n${activityNotes.join('\n')}` : ''}
                `)
                .addFields([
                    {
                        name: '⏱ Time in Server',
                        value: `
                        <a:Save_the_date_gif:1342818099610517534> **Joined:** ${joinTimestamp ? `<t:${joinTimestamp}:F> (<t:${joinTimestamp}:R>)` : 'Unknown'}
                        <:Clock_timer:1342818097765589013> **Duration:** ${timeString}
                        `,
                        inline: false
                    },
                    { 
                        name: '🔶 Roles', 
                        value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles,
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `User ID: ${member.id} • Left at: ${new Date().toLocaleString()}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();
            
            // Create buttons for potential actions
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('User Profile')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/users/${member.id}`)
                    .setEmoji('👤')
            );
            
            // Send goodbye message with the embed and buttons
            await leaveChannel.send({
                embeds: [embed],
                components: [row]
            });
            
            client.logger.log(`Member left support server: ${member.user.tag} (${timeString} in server)`, "info");
            
            // If the member left very quickly, might want to notify mods
            if (wasNewMember && timeInServer < 3600 && config.logs.moderation) { // Less than an hour
                const modChannel = await client.channels.fetch(config.logs.moderation).catch(() => null);
                if (modChannel) {
                    const suspiciousEmbed = new EmbedBuilder()
                        .setColor('#FFAA00')
                        .setTitle('⚠️ Quick Leave Alert')
                        .setDescription(`
                            <@${member.id}> (${member.user.tag}) joined and left very quickly.
                            **Time in server:** ${timeString}
                            **Joined at:** <t:${joinTimestamp}:F>
                            **Left at:** <t:${leaveTimestamp}:F>
                            
                            This might indicate spam activity or a raid attempt.
                        `)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `User ID: ${member.id}` })
                        .setTimestamp();
                    
                    await modChannel.send({ embeds: [suspiciousEmbed] });
                }
            }
            
        } catch (error) {
            client.logger.log(`Error in guildMemberRemove event: ${error.stack}`, "error");
        }
    }
};