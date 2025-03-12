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
        // Only use English messages
        this.log(englishContent, type, true, detailed);
    }
    
    /**
     * Send a server join notification
     * @param {Guild} guild - The guild that was joined
     */
    static async logServerJoin(guild) {
        const embed = new EmbedBuilder()
            .setColor("#45D15A")
            .setTitle("➕ Bot Added to Server")
            .setThumbnail(guild.iconURL({ dynamic: true }) || "https://i.imgur.com/AWGDmiu.png")
            .addFields([
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}> (${guild.ownerId})`, inline: true },
                { name: 'Members', value: `${guild.memberCount} members`, inline: true },
                { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Server Count', value: `${this.client.guilds.cache.size} servers`, inline: true }
            ])
            .setTimestamp();
        
        this.log({ embeds: [embed] }, "join");
        
        // Also send to serverjoinleave channel
        if (config.logs.serverjoinleave) {
            try {
                const joinLeaveChannel = await this.client.channels.fetch(config.logs.serverjoinleave);
                if (joinLeaveChannel) {
                    joinLeaveChannel.send({ embeds: [embed] });
                }
            } catch (err) {
                console.error(`Failed to send join log to serverjoinleave channel: ${err.message}`);
            }
        }
    }
    
    /**
     * Send a server leave notification
     * @param {Guild} guild - The guild that was left
     */
    static async logServerLeave(guild) {
        const embed = new EmbedBuilder()
            .setColor("#F75C5C")
            .setTitle("➖ Bot Removed from Server")
            .setThumbnail(guild.iconURL({ dynamic: true }) || "https://i.imgur.com/AWGDmiu.png")
            .addFields([
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}> (${guild.ownerId})`, inline: true },
                { name: 'Members', value: `${guild.memberCount} members`, inline: true },
                { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Server Count', value: `${this.client.guilds.cache.size} servers`, inline: true }
            ])
            .setTimestamp();
        
        this.log({ embeds: [embed] }, "leave");
        
        // Also send to serverjoinleave channel
        if (config.logs.serverjoinleave) {
            try {
                const joinLeaveChannel = await this.client.channels.fetch(config.logs.serverjoinleave);
                if (joinLeaveChannel) {
                    joinLeaveChannel.send({ embeds: [embed] });
                }
            } catch (err) {
                console.error(`Failed to send leave log to serverjoinleave channel: ${err.message}`);
            }
        }
    }
    
    /**
     * Log a server boost
     * @param {GuildMember} member - The member who boosted
     */
    static async logServerBoost(member) {
        if (!member || !config.logs.boost) return;
        
        const embed = new EmbedBuilder()
            .setColor("#F47FFF")
            .setTitle("🚀 Server Boosted!")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`**${member.user.tag}** just boosted the server!`)
            .addFields([
                { name: 'User', value: `<@${member.user.id}> (${member.user.id})`, inline: true },
                { name: 'Boost Count', value: `${member.guild.premiumSubscriptionCount} boosts`, inline: true },
                { name: 'Boost Level', value: `Level ${member.guild.premiumTier}`, inline: true }
            ])
            .setTimestamp();
        
        this.log({ embeds: [embed] }, "boost");
    }
};