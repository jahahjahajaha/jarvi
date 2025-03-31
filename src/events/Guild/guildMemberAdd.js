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
            
            // Check if join channel exists (member join channel for SUPPORT server)
            const joinChannel = await client.channels.fetch('1335329530885308539').catch(() => null);
            if (!joinChannel) {
                return client.logger.log("Support server welcome channel not found!", "error");
            }
            
            // Calculate account creation date and time
            const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
            const joinTimestamp = Math.floor(member.joinedTimestamp / 1000);
            const accountAge = joinTimestamp - createdTimestamp;
            
            // Flag accounts based on age
            const isDangerousAccount = accountAge < 60 * 60 * 24 * 3; // 3 days
            const isNewAccount = accountAge < 60 * 60 * 24 * 7; // 7 days
            
            // Member count
            const memberCount = member.guild.memberCount;
            
            // Get user's badges (if available)
            const flags = member.user.flags ? member.user.flags.toArray() : [];
            const badgeEmojis = {
                'DISCORD_EMPLOYEE': '<:staff:1342864322480361583>',
                'PARTNERED_SERVER_OWNER': '<:partner:1342864320475021373>',
                'HYPESQUAD_EVENTS': '<:hypesquad_events:1342864317631451176>',
                'BUGHUNTER_LEVEL_1': '<:bug_hunter:1342864314431967354>',
                'HOUSE_BRAVERY': '<:hypesquad_bravery:1342864316163018782>',
                'HOUSE_BRILLIANCE': '<:hypesquad_brilliance:1342864314968854669>',
                'HOUSE_BALANCE': '<:hypesquad_balance:1342864313643421766>',
                'EARLY_SUPPORTER': '<:early_supporter:1342864315227189329>',
                'TEAM_USER': '<:team_user:1342864322513920040>',
                'BUGHUNTER_LEVEL_2': '<:bug_hunter_gold:1342864313957122208>',
                'VERIFIED_BOT': '<:verified_bot:1342864323864313867>',
                'EARLY_VERIFIED_BOT_DEVELOPER': '<:verified_developer:1342864323071574218>',
                'DISCORD_CERTIFIED_MODERATOR': '<:certified_moderator:1342864314842513468>',
                'ACTIVE_DEVELOPER': '<:active_developer:1342864312628605039>'
            };
            
            // Format badges if any exist
            const userBadges = flags.length ? flags.map(flag => badgeEmojis[flag] || '').filter(Boolean).join(' ') : '';
            
            // Choose color based on account age
            let welcomeColor = '#44FF44'; // Default green
            let accountAgeWarning = '';
            
            if (isDangerousAccount) {
                welcomeColor = '#FF3333'; // Red for very new accounts
                accountAgeWarning = '⚠️ **HIGH RISK**: Account created less than 3 days ago!';
            } else if (isNewAccount) {
                welcomeColor = '#FFAA00'; // Orange for somewhat new accounts
                accountAgeWarning = '⚠️ **CAUTION**: This account is less than 7 days old.';
            }
            
            // Create welcome embed with improved design
            const embed = new EmbedBuilder()
                .setColor(welcomeColor)
                .setAuthor({
                    name: `Welcome to ${member.guild.name}!`,
                    iconURL: member.guild.iconURL({ dynamic: true })
                })
                .setTitle(`${member.user.tag} ${userBadges}`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`
                    <a:Welcome_gif:1340405392307388468> Hey <@${member.id}>, welcome to our community!
                    
                    <:Jarvi_Logo:1340405392307388468> Thanks for joining the **Jarvi Music Bot** support server.
                    
                    <a:Yellow_members_icon_gif:1342819050446782537> You are our **${memberCount.toLocaleString()}${getNumberSuffix(memberCount)}** member!
                `)
                .addFields([
                    {
                        name: '📝 Account Information',
                        value: `
                        <a:Save_the_date_gif:1342818099610517534> **Created:** <t:${createdTimestamp}:D> (<t:${createdTimestamp}:R>)
                        <:Id_card:1342864306441556121> **User ID:** \`${member.id}\`
                        ${accountAgeWarning ? `\n${accountAgeWarning}` : ''}
                        `,
                        inline: false
                    },
                    {
                        name: '🎯 Next Steps',
                        value: `
                        <:Chat_Bubble:1342850239886790696> Check out our rules channel
                        <:help:1342864316742942720> Get support in our help channels 
                        <a:Discord_rocket:1342842402167324806> Explore our bot features and commands
                        `,
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `Joined at ${new Date().toLocaleString()}`,
                    iconURL: client.user.displayAvatarURL()
                })
                .setTimestamp();
            
            // Create interactive buttons with proper URLs
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Rules')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/1335329530121945139/1335330915479584809`)
                    .setEmoji('📜'),
                new ButtonBuilder()
                    .setLabel('Music')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/1335329530121945139/1335329531069988974`)
                    .setEmoji('🎵'),
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(config.bot.inviteURL || "https://discord.com/oauth2/authorize?client_id=1333994486979887186&permissions=8&scope=bot%20applications.commands")
                    .setEmoji('🤖')
            );
            
            // Send welcome message with animations and styling
            await joinChannel.send({
                content: `<a:Hyper_Welcome_gif:1342834543138017331> Welcome <@${member.id}>!`,
                embeds: [embed],
                components: [buttons]
            });
            
            client.logger.log(`New member joined support server: ${member.user.tag}`, "info");
            
            // Notify moderators about suspicious accounts
            if (isDangerousAccount && config.logs.moderation) {
                const modChannel = await client.channels.fetch(config.logs.moderation).catch(() => null);
                if (modChannel) {
                    const alertEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⚠️ High Risk Account Joined')
                        .setDescription(`
                            <@${member.id}> (${member.user.tag}) just joined with a very new account.
                            **Account age:** ${Math.floor(accountAge / (60 * 60 * 24))} days
                            **Created at:** <t:${createdTimestamp}:F>
                            **Joined at:** <t:${joinTimestamp}:F>
                        `)
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `User ID: ${member.id}` })
                        .setTimestamp();
                    
                    await modChannel.send({ 
                        content: `<@&1335329531262668800> Please review this new member.`,
                        embeds: [alertEmbed] 
                    });
                }
            }
            
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