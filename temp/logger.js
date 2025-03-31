const chalk = require("chalk");
const moment = require("moment");
const { EmbedBuilder, WebhookClient, ChannelType } = require("discord.js");
const config = require("../config.js");

module.exports = class Logger {
    static client = null;
    static webhooks = {};
    
    /**
     * Set the client instance to use for sending logs
     * @param {Client} clientInstance - Discord.js client instance
     */
    static setClient(clientInstance) {
        this.client = clientInstance;
        this.initWebhooks();
    }
    
    /**
     * Initialize webhook clients for various log channels
     * Only creates webhooks for private channels if useWebhooks is enabled
     */
    static async initWebhooks() {
        if (!this.client) return;
        
        try {
            // Clear existing webhook cache
            this.webhooks = {};
            
            // Only create webhooks if enabled in config
            if (!config.monitoring.useWebhooks) return;
            
            // Get all log channels for setup
            const channels = {
                error: config.logs.error ? await this.client.channels.fetch(config.logs.error).catch(() => null) : null,
                general: config.logs.general ? await this.client.channels.fetch(config.logs.general).catch(() => null) : null,
                console: config.logs.console ? await this.client.channels.fetch(config.logs.console).catch(() => null) : null,
                serverjoinleave: config.logs.serverjoinleave ? await this.client.channels.fetch(config.logs.serverjoinleave).catch(() => null) : null,
                boost: config.logs.boost ? await this.client.channels.fetch(config.logs.boost).catch(() => null) : null,
                botstatus: config.logs.botstatus ? await this.client.channels.fetch(config.logs.botstatus).catch(() => null) : null,
            };
            
            // Create webhooks for private channels only
            for (const [name, channel] of Object.entries(channels)) {
                if (!channel) continue;
                
                // Skip public channels in the excluded list
                if (config.monitoring.publicChannels && config.monitoring.publicChannels.includes(name)) {
                    console.log(chalk.yellow(`[INFO] Channel ${name} configured as public channel - using normal messages`));
                    continue;
                }
                
                // Only create webhooks for private text channels
                if (channel.type === ChannelType.GuildText && 
                    !channel.permissionsFor(channel.guild.roles.everyone).has('ViewChannel')) {
                    
                    // Find existing webhook or create new one
                    const webhooks = await channel.fetchWebhooks();
                    let webhook = webhooks.find(wh => wh.name === 'Jarvi Logs');
                    
                    if (!webhook) {
                        webhook = await channel.createWebhook({
                            name: 'Jarvi Logs',
                            avatar: config.embed.footericon,
                            reason: 'Created for improved bot logging'
                        });
                        console.log(chalk.green(`[READY] Created webhook for ${name} logs in channel ${channel.name}`));
                    }
                    
                    this.webhooks[name] = new WebhookClient({ id: webhook.id, token: webhook.token });
                }
            }
            
            console.log(chalk.green(`[READY] Initialized ${Object.keys(this.webhooks).length} webhook clients for logging`));
        } catch (err) {
            console.error(`Failed to initialize webhooks: ${err.message}`);
        }
    }
    
    /**
     * Get the appropriate channel for a log type
     * @param {String} type - Log type (error, info, ready, etc.)
     * @returns {String} Channel ID for this log type
     */
    static getChannelIdForLogType(type) {
        type = type.toLowerCase();
        
        // Map log types to their respective channels
        switch (type) {
            case "error":
                return config.logs.error;
            case "warn":
                return config.logs.warning; // New dedicated warning channel
            case "ready":
            case "info":
            case "log":
                return config.logs.general;
            case "join":
                return config.logs.join;
            case "leave":
                return config.logs.leave;
            case "console":
                return config.logs.console;
            case "boost":
                return config.logs.boost;
            case "serverjoin":
            case "serverleave":
                return config.logs.serverjoinleave;
            default:
                return config.logs.logChannelId; // Default general logs
        }
    }
    
    /**
     * Send log to Discord channel using webhook if available
     * @param {Object|String} content - The content to send
     * @param {String} type - Log type (log, error, warn, etc.)
     * @param {Boolean} detailed - Whether to create a detailed embed
     * @returns {Promise<void>}
     */
    static async sendToLogChannel(content, type = "log", detailed = false) {
        if (!this.client) return;
        
        try {
            // Get appropriate channel ID for this log type
            const channelId = this.getChannelIdForLogType(type);
            if (!channelId) return;
            
            // Fetch the channel
            const logChannel = await this.client.channels.fetch(channelId).catch(() => null);
            if (!logChannel) return;
            
            // If content is already a formatted message object, send it directly
            if (typeof content === 'object' && (content.embeds || content.content)) {
                if (this.webhooks[type] && config.monitoring.useWebhooks) {
                    await this.webhooks[type].send(content);
                } else {
                    await logChannel.send(content);
                }
                return;
            }
            
            // Get the appropriate color and emoji based on log type
            let color;
            let emoji;
            switch (type.toLowerCase()) {
                case "error": 
                    color = "#FF0000"; 
                    emoji = "❌"; 
                    break;
                case "warn": 
                    color = "#FFA500"; 
                    emoji = "⚠️"; 
                    break;
                case "ready": 
                    color = "#00FF00"; 
                    emoji = "✅"; 
                    break;
                case "info": 
                    color = "#0099FF"; 
                    emoji = "ℹ️"; 
                    break;
                case "cmd": 
                    color = "#9932CC"; 
                    emoji = "🔧"; 
                    break;
                case "join":
                    color = "#45D15A";
                    emoji = "➕";
                    break;
                case "leave":
                    color = "#F75C5C";
                    emoji = "➖";
                    break;
                case "boost":
                    color = "#F47FFF";
                    emoji = "🚀";
                    break;
                default: 
                    color = "#7289DA";
                    emoji = "📝";
            }
            
            // Create the embed
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} ${type.toUpperCase()} Log`)
                .setTimestamp()
                .setFooter({ 
                    text: "Jarvi Logging System", 
                    iconURL: config.embed.footericon 
                });
            
            // Add detailed information if requested
            if (detailed) {
                // Convert content to string if it's not already
                const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
                
                // Get server stats
                const usedMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
                const totalMemory = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
                
                embed.setDescription(`\`\`\`${contentStr.substring(0, 4000)}\`\`\``)
                    .addFields([
                        { 
                            name: '📊 System Info', 
                            value: `Memory: ${usedMemory}MB / ${totalMemory}MB\nUptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s` 
                        },
                        {
                            name: '🎵 Music Stats',
                            value: `Active Players: ${this.client.manager?.players?.size || 0}\nTotal Guilds: ${this.client.guilds.cache.size}`
                        }
                    ]);
            } else {
                // Simple version for regular logs
                embed.setDescription(typeof content === 'string' 
                    ? `\`\`\`${content.substring(0, 4000)}\`\`\`` 
                    : `\`\`\`json\n${JSON.stringify(content, null, 2).substring(0, 4000)}\n\`\`\``);
            }
            
            // Send the embed using webhook if available, otherwise use normal channel
            if (this.webhooks[type] && config.monitoring.useWebhooks) {
                await this.webhooks[type].send({ embeds: [embed] });
            } else {
                await logChannel.send({ embeds: [embed] });
            }
            
            // Special handling for console logs - also send to console channel
            if (type.toLowerCase() !== "console" && config.logs.console) {
                try {
                    const consoleChannel = await this.client.channels.fetch(config.logs.console).catch(() => null);
                    if (consoleChannel) {
                        // Use webhook for console channel if available
                        if (this.webhooks.console && config.monitoring.useWebhooks) {
                            await this.webhooks.console.send({ embeds: [embed] });
                        } else {
                            await consoleChannel.send({ embeds: [embed] });
                        }
                    }
                } catch (err) {
                    console.error(`Failed to send log to console channel: ${err.message}`);
                }
            }
        } catch (err) {
            console.error(`Failed to send log to Discord channel: ${err.stack}`);
        }
    }
    
    /**
     * Log messages to console and Discord channel
     * @param {String|Object} content - Message content to log
     * @param {String} type - Type of log (log, warn, error, etc.)
     * @param {Boolean} sendToDiscord - Whether to send to Discord
     * @param {Boolean} detailed - Whether to include detailed info
     */
    static log(content, type = "log", sendToDiscord = true, detailed = false) {
        // Format date consistently
        const date = `${moment().format("DD-MM-YYYY hh:mm:ss")}`;
        
        // Create formatted console message
        let formattedContent = content;
        
        // Handle objects by converting to readable format
        if (typeof content === 'object' && content !== null) {
            try {
                formattedContent = JSON.stringify(content, null, 2);
            } catch (e) {
                formattedContent = '[Complex Object]';
            }
        }
        
        // Console logging with chalk colors and emojis for better readability
        let consoleLog;
        switch (type.toLowerCase()) {
            case "log": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgBlue(type.toUpperCase())}] ${formattedContent}`;
                break;
            }
            case "warn": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgYellow(type.toUpperCase())}] ⚠️ ${formattedContent}`;
                break;
            }
            case "error": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgRed(type.toUpperCase())}] ❌ ${formattedContent}`;
                break;
            }
            case "debug": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgGreen(type.toUpperCase())}] 🔍 ${formattedContent}`;
                break;
            }
            case "cmd": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgWhite(type.toUpperCase())}] 🔧 ${formattedContent}`;
                break;
            }
            case "event": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgWhite(type.toUpperCase())}] 📊 ${formattedContent}`;
                break;
            }
            case "ready": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgBlueBright(type.toUpperCase())}] ✅ ${formattedContent}`;
                break;
            }
            case "info": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgCyan(type.toUpperCase())}] ℹ️ ${formattedContent}`;
                break;
            }
            case "join": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgGreen("JOIN")}] ➕ ${formattedContent}`;
                break;
            }
            case "leave": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgRed("LEAVE")}] ➖ ${formattedContent}`;
                break;
            }
            case "boost": {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgMagenta("BOOST")}] 🚀 ${formattedContent}`;
                break;
            }
            default: {
                consoleLog = `[${chalk.gray(date)}]: [${chalk.black.bgWhite(type.toUpperCase())}] 📝 ${formattedContent}`;
                break;
            }
        }
        
        // Log to console
        console.log(consoleLog);
        
        // Send to Discord log channel if enabled
        if (sendToDiscord) {
            this.sendToLogChannel(content, type, detailed);
        }
    }
    
    /**
     * Log bilingual messages to console and Discord (converted to English only)
     * @param {String} englishContent - English message content
     * @param {String} hindiContent - Hindi message content (no longer used)
     * @param {String} type - Type of log
     * @param {Boolean} detailed - Whether to include detailed system info
     */
    static logBilingual(englishContent, hindiContent, type = "log", detailed = false) {
        // Always use English content, but log to both console and Discord
        console.log(`[${type.toUpperCase()}] ${englishContent}`);
        
        // Also send to Discord (using the primary method)
        this.sendToLogChannel(englishContent, type, detailed);
    }
    
    /**
     * Send a server join notification
     * @param {Guild} guild - The guild that was joined
     */
    static async logServerJoin(guild) {
        try {
            // Fetch Guild Owner
            const owner = await guild.fetchOwner().catch(() => null);

            // Community Enabled Check
            const isCommunity = guild.features.includes("COMMUNITY");
            let inviteLink = "Not Available";

            // Invite Link Creation
            try {
                const channels = guild.channels.cache;
                let inviteChannel = channels.find(c => 
                    c.type === 0 && // Text Channel
                    c.permissionsFor(guild.members.me).has("CreateInstantInvite")
                );

                if (inviteChannel) {
                    const invite = await inviteChannel.createInvite({
                        maxAge: 0, // Permanent Invite
                        maxUses: 0
                    });
                    inviteLink = invite.url;
                }
            } catch (err) {
                console.error(`Failed to create invite for ${guild.name}: ${err.message}`);
            }

            // Fetching Inviter (If Available)
            let inviter = "Unknown";
            try {
                const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 1 }); // 28 is BOT_ADD
                const entry = auditLogs.entries.first();
                if (entry) inviter = `${entry.executor.tag} (${entry.executor.id})`;
            } catch (err) {
                console.error(`Failed to fetch inviter for ${guild.name}: ${err.message}`);
            }

            // Create a beautiful embed for server join
            const embed = new EmbedBuilder()
                .setColor('#44ff44')
                .setAuthor({ 
                    name: `📥 Jarvi joined a New Server!`, 
                    iconURL: this.client.user.displayAvatarURL() 
                })
                .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }) || this.client.user.displayAvatarURL())
                .setDescription(`
                    <:Jarvi_Logo:1340405392307388468> **Server Name:** \`${guild.name}\`
                    <a:Config_gif:1340947266772533360> **Server ID:** \`${guild.id}\`
                    ${owner ? `<a:King_mukut_gif:1342818101816856577> **Owner:** [${owner.user.tag}](https://discord.com/users/${owner.id})\n<:Id_card:1342864306441556121> **Owner ID:** \`${owner.id}\`` : ''}
                    <a:Save_the_date_gif:1342818099610517534> **Created On:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>
                    <a:Yellow_members_icon_gif:1342819050446782537> **Members:** \`${guild.memberCount.toLocaleString()}\`
                    🛡 **Community Enabled:** \`${isCommunity ? "Yes ✅" : "No ❌"}\`
                `)
                .addFields([
                    { 
                        name: "📌 Server Details", 
                        value: [
                            `<:Chat_Bubble:1342850239886790696> **Channels:** \`${guild.channels.cache.size}\``,
                            `<:Theatre_Mask:1342851810313900095> **Roles:** \`${guild.roles.cache.size}\``,
                            `<a:Discord_rocket:1342842402167324806> **Boosts:** \`${guild.premiumSubscriptionCount || 0}\``
                        ].join("\n"), 
                        inline: true
                    },
                    { 
                        name: "🔗 Invite Link", 
                        value: inviteLink !== "Not Available" ? `[Click Here](${inviteLink})` : "Not Available", 
                        inline: true 
                    },
                    { 
                        name: "🤝 Invited By", 
                        value: inviter, 
                        inline: false 
                    },
                    { 
                        name: "🌐 Server Count", 
                        value: `${this.client.guilds.cache.size} servers`, 
                        inline: false 
                    }
                ])
                .setFooter({ 
                    text: `${this.client.user.username} now in ${this.client.guilds.cache.size} servers`,
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Create buttons if possible
            let components = [];
            if (inviteLink !== "Not Available" || owner) {
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
                components.push(buttons);
            }

            // Send the log specifically to the server join/leave channel
            this.log({ embeds: [embed], components }, "serverjoin");
            
        } catch (error) {
            console.error(`Error in logServerJoin: ${error.stack}`);
            this.log(`Error logging server join: ${error.message}`, "error");
        }
    }
    
    /**
     * Send a server leave notification
     * @param {Guild} guild - The guild that was left
     */
    static async logServerLeave(guild) {
        try {
            // Create a beautiful embed for server leave
            const embed = new EmbedBuilder()
                .setColor('#F75C5C')
                .setAuthor({ 
                    name: `📤 Jarvi left a Server!`, 
                    iconURL: this.client.user.displayAvatarURL() 
                })
                .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }) || this.client.user.displayAvatarURL())
                .setDescription(`
                    <:Jarvi_Logo:1340405392307388468> **Server Name:** \`${guild.name}\`
                    <a:Config_gif:1340947266772533360> **Server ID:** \`${guild.id}\`
                    <:Id_card:1342864306441556121> **Owner ID:** \`${guild.ownerId}\`
                    <a:Save_the_date_gif:1342818099610517534> **Created On:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>
                    <a:Yellow_members_icon_gif:1342819050446782537> **Members:** \`${guild.memberCount.toLocaleString()}\`
                    📊 **Servers Remaining:** \`${this.client.guilds.cache.size}\`
                `)
                .setFooter({ 
                    text: `${this.client.user.username} now in ${this.client.guilds.cache.size} servers`,
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Create button for owner profile
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Owner Profile')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/users/${guild.ownerId}`)
            );

            // Send the log specifically to the server join/leave channel
            this.log({ embeds: [embed], components: [buttons] }, "serverleave");
            
        } catch (error) {
            console.error(`Error in logServerLeave: ${error.stack}`);
            this.log(`Error logging server leave: ${error.message}`, "error");
        }
    }
    
    /**
     * Log a server boost
     * @param {GuildMember} member - The member who boosted
     */
    static async logServerBoost(member) {
        try {
            if (!member || !config.logs.boost) return;
            
            // Get boost tier information
            const boostLevel = member.guild.premiumTier;
            const boostCount = member.guild.premiumSubscriptionCount || 0;
            
            // Calculate remaining boosts for next level
            let nextLevelBoosts = 0;
            if (boostLevel === 0) {
                nextLevelBoosts = 2 - boostCount; // Need 2 for Level 1
            } else if (boostLevel === 1) {
                nextLevelBoosts = 7 - boostCount; // Need 7 for Level 2 
            } else if (boostLevel === 2) {
                nextLevelBoosts = 14 - boostCount; // Need 14 for Level 3
            }
            
            // Get user's previous boost status if possible
            let hasExistingBoosts = false;
            let boostsSince = null;
            if (member.premiumSince) {
                boostsSince = Math.floor(member.premiumSince.getTime() / 1000);
                hasExistingBoosts = true;
            }
            
            // Create colorful boost embed
            const embed = new EmbedBuilder()
                .setColor("#F47FFF") // Vibrant pink
                .setAuthor({
                    name: `${member.user.tag} boosted the server!`,
                    iconURL: member.user.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setDescription(`
                    <a:Nitro_Booster:1342818101426061472> **${member.user.username}** just boosted the server! ${hasExistingBoosts ? '(again!)' : ''}
                    
                    <a:Boost_Badge_Tier_3:1342864313957122148> The server now has **${boostCount} boost${boostCount !== 1 ? 's' : ''}**!
                    
                    ${hasExistingBoosts ? `<a:Save_the_date_gif:1342818099610517534> Boosting since: <t:${boostsSince}:D> (<t:${boostsSince}:R>)` : ''}
                `)
                .addFields([
                    { 
                        name: '🚀 Server Perks', 
                        value: `
                        <a:Discord_rocket:1342842402167324806> **Current Tier:** Level ${boostLevel}
                        ${nextLevelBoosts > 0 ? `<a:Boost_animated:1348309050277986435> **Next Tier:** ${nextLevelBoosts} more boost${nextLevelBoosts !== 1 ? 's' : ''} needed` : '<a:Boost_animated:1348309050277986435> **Maximum Tier Reached!**'}
                        `,
                        inline: false
                    },
                    { 
                        name: '🎁 Current Perks', 
                        value: this.getBoostPerks(boostLevel),
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `Thank you for supporting the server! 💖`,
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();
                
            // Create a button to link to the boost page
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Server Boost Info')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/servers/${member.guild.id}/subscribe`)
                    .setEmoji('🚀')
            );
    
            // Send the log with components
            this.log({ embeds: [embed], components: [buttons] }, "boost");
            
            // Also send to general channel if configured
            if (config.logs.general) {
                try {
                    const generalChannel = await this.client.channels.fetch(config.logs.general).catch(() => null);
                    if (generalChannel) {
                        await generalChannel.send({ 
                            content: `<@${member.user.id}> Thank you for boosting the server! 💖`,
                            embeds: [embed],
                            components: [buttons]
                        });
                    }
                } catch (err) {
                    console.error(`Failed to send boost notification to general channel: ${err.message}`);
                }
            }
        } catch (error) {
            console.error(`Error in logServerBoost: ${error.stack}`);
            this.log(`Error logging server boost: ${error.message}`, "error");
        }
    }
    
    /**
     * Get the perks for a specific server boost level
     * @param {Number} level - The boost level
     * @returns {String} Formatted string with the perks
     */
    static getBoostPerks(level) {
        const allPerks = [
            // Level 0 (default)
            [
                "96kbps Audio Quality",
                "720p 30fps Go Live streams",
                "No animated server icon"
            ],
            // Level 1
            [
                "128kbps Audio Quality",
                "720p 60fps Go Live streams", 
                "Animated Server Icon",
                "Custom Server Invite Background",
                "50 Additional Emoji Slots"
            ],
            // Level 2
            [
                "256kbps Audio Quality",
                "1080p 60fps Go Live streams",
                "Server Banner",
                "50MB Upload Limit for All Members",
                "Additional 50 Emoji Slots (100 total)"
            ],
            // Level 3
            [
                "384kbps Audio Quality",
                "1080p 60fps Go Live streams",
                "100MB Upload Limit for All Members",
                "Additional 100 Emoji Slots (150 total)",
                "Custom Server URL" 
            ]
        ];
        
        if (level < 0 || level > 3) level = 0;
        
        return allPerks[level].map(perk => `• ${perk}`).join('\n');
    }
};