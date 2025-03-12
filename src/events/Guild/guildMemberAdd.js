const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

/**
 * Handle event when a member joins any guild
 * @param {Client} client - Bot client instance
 * @param {GuildMember} member - Guild member that joined
 */
module.exports = {
    name: "guildMemberAdd",
    async run(client, member) {
        try {
            // Check if this is our support server
            if (member.guild.id !== config.bot.supportServerID) return;
            
            // Skip if it's a bot (unless we want to welcome bots too)
            if (member.user.bot) return;
            
            // Check if join channel exists
            const joinChannel = await client.channels.fetch(config.logs.join).catch(() => null);
            if (!joinChannel) {
                return client.logger.log("Support server welcome channel not found!", "error");
            }
            
            // Calculate account creation date and time
            const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
            const joinTimestamp = Math.floor(member.joinedTimestamp / 1000);
            const accountAge = joinTimestamp - createdTimestamp;
            
            // Flag accounts that are less than 7 days old
            const newAccountFlag = accountAge < 60 * 60 * 24 * 7; // 7 days in seconds
            
            // Member count
            const memberCount = member.guild.memberCount;
            
            // Create welcome embed
            const embed = new EmbedBuilder()
                .setColor('#44FF44')
                .setAuthor({
                    name: `${member.user.tag} joined the server`,
                    iconURL: member.user.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`
                    <a:Welcome_gif:1340405392307388468> Welcome to Jarvi Support, <@${member.id}>! 
                    
                    <a:Yellow_members_icon_gif:1342819050446782537> You are our **${memberCount}${getNumberSuffix(memberCount)}** member!
                    
                    <a:Save_the_date_gif:1342818099610517534> Account Created: <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)
                    ${newAccountFlag ? '⚠️ **New Account Warning**: This account is less than 7 days old!' : ''}
                    
                    Please check the rules and have a great time in our community!
                `)
                .setFooter({ 
                    text: `ID: ${member.id}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();
            
            // Create buttons
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Rules')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${config.bot.supportServerID}/1335329531262668801/rules`),
                new ButtonBuilder()
                    .setLabel('Commands')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${config.bot.supportServerID}/1335329530734186534`)
            );
            
            // Send welcome message
            await joinChannel.send({
                content: `<@${member.id}> Welcome to Jarvi Support!`,
                embeds: [embed],
                components: [buttons]
            });
            
            client.logger.log(`New member joined support server: ${member.user.tag}`, "info");
            
        } catch (error) {
            client.logger.log(`Error in guildMemberAdd event: ${error.stack}`, "error");
        }
    }
};

/**
 * Get the suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {Number} n - The number to get a suffix for
 * @returns {String} The suffix for the number
 */
function getNumberSuffix(n) {
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return 'th';
    }
    
    switch (lastDigit) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}