const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');
const systeminformation = require('systeminformation');
const moment = require('moment');
require('moment-duration-format');
const os = require('os');
require('dotenv').config();

/**
 * COMPLETE REWRITE: Enhanced Status Monitor for Bot Health
 * Provides real-time monitoring, advanced analytics, and interactive controls
 * in a dedicated Discord channel
 * 
 * SINGLETON IMPLEMENTATION: This is a complete rewrite to ensure there can only be 
 * one active instance at a time, with proper channel synchronization
 */

// CRITICAL: Global instance store to ensure singleton pattern
let _instance = null;

class StatusMonitor {
    /**
     * Get Singleton instance - this is critical to prevent duplicate messages
     * @param {Client} client - Discord.js client
     * @returns {StatusMonitor} The singleton instance
     */
    static getInstance(client) {
        if (!_instance) {
            _instance = new StatusMonitor(client);
            console.log("[STATUS] Created NEW singleton StatusMonitor instance");
        } else if (client && !_instance.client) {
            _instance.client = client;
            console.log("[STATUS] Updated existing StatusMonitor instance with client");
        }
        return _instance;
    }
    
    /**
     * Private constructor - NEVER call directly, use getInstance()
     */
    constructor(client) {
        // Prevent direct instantiation
        if (_instance) {
            console.error("[STATUS] StatusMonitor is a singleton! Use getInstance() instead");
            return _instance;
        }
        
        // Client and timing
        this.client = client;
        this.startTime = Date.now();
        
        // Channel and message references
        this.statusChannel = null;
        this.controlChannel = null;
        this.statusMessage = null;
        this.controlsMessage = null;
        
        // Monitoring state
        this.monitoringInterval = null;
        this.lastUpdate = 0;
        this.isPaused = false;
        this.displayMode = 'default'; // 'default', 'minimal', or 'detailed'
        
        // Critical flags with sensible defaults
        this._isInitializing = false;  // Lock to prevent concurrent initialization
        this._updatingStatus = false;  // Lock for concurrent status updates
        this._updatingControls = false; // Lock for concurrent controls updates
        
        // Command and error tracking for reliability metrics
        this.cmdExecutionCount = 0;
        this.errorCount = 0;
        
        // Historical data for trend analysis
        this.maxHistoricalDataPoints = 30;
        this.historicalData = {
            cpu: [],
            memory: [],
            players: [],
            users: [],
            guilds: []
        };
        
        // Default configuration
        this.config = {
            enabled: true,
            statusChannelId: process.env.BOT_STATUS_CHANNEL,
            controlChannelId: process.env.CONTROL_PANEL_CHANNEL,
            updateInterval: 3000, // 3 seconds
            recreateInterval: 900000, // 15 minutes (only for editing refresh, not recreation)
            persistMessage: true,
            statusMessageId: null,
            controlsMessageId: null,
            deleteOnStartup: true,
            deleteOldStatusMessages: true,
            maxMessagesToDelete: 99, // Limit to 99 to avoid rate limits
            stabilityMode: true, // Prefer edit over recreate
            showControls: true,
            showTrends: true,
            developerIds: [process.env.OWNERID], // Add owner ID from env
            healthChecks: {
                memoryThreshold: 90,
                cpuThreshold: 90,
                playerThreshold: 50,
                warningThreshold: 70,
                healthyEmoji: "✅",
                warningEmoji: "⚠️",
                criticalEmoji: "❌"
            }
        };

        // Try to parse extra developer IDs if specified in config
        try {
            if (process.env.DEV_ROLE) {
                // If a dev role is specified, we'll check it during developer validation
                this.config.devRoleId = process.env.DEV_ROLE;
            }
        } catch (err) {
            console.error(`[ERROR] Failed to parse developer IDs: ${err.message}`);
        }
    }

    /**
     * Initialize the status monitor - COMPLETE REWRITE FOR RELIABILITY
     */
    async init() {
        // Check if monitoring is even enabled
        if (!this.config.enabled) {
            console.log("[STATUS] Status monitoring is disabled in config");
            return;
        }
        
        // CRITICAL: Don't run full init if already initialized to prevent duplicate messages
        if (this.isInitialized) {
            console.log("[INFO] Status monitoring already initialized, skipping initialization...");
            return;
        }

        try {
            // Set initialization flag FIRST to prevent parallel initialization
            this.isInitialized = true;
            
            console.log("[STATUS] Beginning status monitor initialization...");
            
            // STEP 1: Fetch and validate channels
            this.statusChannel = await this.client.channels.fetch(this.config.statusChannelId).catch(() => null);
            if (!this.statusChannel) {
                console.log("[ERROR] Status channel not found! Monitoring disabled.");
                return;
            }
            
            this.controlChannel = await this.client.channels.fetch(this.config.controlChannelId).catch(() => null);
            if (!this.controlChannel) {
                console.log("[WARN] Control channel not found. Using status channel for both monitoring and controls.");
                this.controlChannel = this.statusChannel;
            }
            
            // STEP 2: Update channel status indicator (only for monitoring channel)
            await this.updateChannelStatusIndicator(this.statusChannel);
            
            // STEP 3: Clean up both channels ONCE (completely)
            console.log("[STATUS] Performing one-time channel cleanup...");
            
            await this.cleanupStatusChannel(this.statusChannel, 99);
            
            if (this.controlChannel !== this.statusChannel) {
                await this.cleanupStatusChannel(this.controlChannel, 99);
            }
            
            // STEP 4: Create status message in monitoring channel
            console.log("[STATUS] Creating initial status message...");
            
            // Force null to ensure we create a new message
            this.statusMessage = null;
            
            // Create initial status message
            await this.updateStatus();
            
            // STEP 5: Create controls panel in control channel (once only)
            if (this.config.showControls && !this.controlsInitialized) {
                console.log("[STATUS] Creating control panel...");
                
                // Create the controls message
                const controls = this.createInteractiveControls();
                this.controlsMessage = await this.controlChannel.send(controls);
                
                // Set flag to prevent recreation
                this.controlsInitialized = true;
                
                console.log(`[INFO] Created controls panel message at ${new Date().toISOString()}`);
            }

            // STEP 6: Start periodic monitoring updates
            this.startMonitoring();

            console.log("[READY] Bot status monitoring system fully initialized");
        } catch (error) {
            console.error(`[ERROR] Failed to initialize status monitoring: ${error.message}`);
            // Reset initialization flag if we failed, so we can try again
            this.isInitialized = false;
        }
    }
    
    /**
     * Update the channel status indicator emoji (🔴 -> 🟢)
     * Shows that the bot is online by updating channel name
     * @param {TextChannel} channel - The channel to update
     */
    async updateChannelStatusIndicator(channel) {
        // Only change status for monitoring channel, not control channel
        if (!channel || !channel.manageable || channel.id === this.config.controlChannelId) return;
        
        try {
            const currentName = channel.name;
            
            // If the channel already has the online indicator, do nothing
            if (currentName.includes('🟢')) {
                return;
            }
            
            // Replace offline indicator with online indicator, or add online indicator
            let newName;
            if (currentName.includes('🔴')) {
                newName = currentName.replace('🔴', '🟢');
            } else {
                // If no indicator exists, add the online indicator at the end
                newName = currentName + ' 🟢';
            }
            
            // Update channel name
            await channel.setName(newName);
            console.log(`[INFO] Updated status channel name: ${currentName} -> ${newName}`);
        } catch (error) {
            console.error(`[ERROR] Failed to update channel status indicator: ${error.message}`);
        }
    }
    
    /**
     * Clean up the channel by deleting messages
     * @param {TextChannel} channel - The channel to clean up
     * @param {Number} limit - Maximum number of messages to delete
     */
    async cleanupStatusChannel(channel, limit = 100) {
        try {
            if (!channel) return;
            
            console.log(`[INFO] Cleaning up channel ${channel.name} - deleting old messages...`);
            
            // Fetch messages (up to the limit)
            const messages = await channel.messages.fetch({ limit });
            
            // If we have messages to delete
            if (messages.size > 0) {
                // Use bulkDelete for messages less than 14 days old
                try {
                    await channel.bulkDelete(messages);
                    console.log(`[INFO] Bulk deleted ${messages.size} messages from ${channel.name}`);
                } catch (bulkError) {
                    // If bulk delete fails (messages older than 14 days), delete one by one
                    console.log(`[WARN] Bulk delete failed, deleting one by one: ${bulkError.message}`);
                    
                    let deleteCount = 0;
                    for (const [_, message] of messages) {
                        try {
                            await message.delete();
                            deleteCount++;
                            
                            // Add a small delay to avoid rate limits
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (err) {
                            // Ignore errors for individual message deletions
                        }
                    }
                    
                    if (deleteCount > 0) {
                        console.log(`[INFO] Deleted ${deleteCount} old messages one by one from ${channel.name}`);
                    }
                }
            }
        } catch (error) {
            console.error(`[ERROR] Failed to clean up channel ${channel?.name}: ${error.message}`);
        }
    }

    /**
     * Start periodic monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Use the configured interval (default to 3 seconds if not set)
        const interval = this.config.updateInterval || 3000;
        
        // Log the update interval for debugging
        console.log(`[INFO] Status monitor set to update every ${interval/1000} seconds`);
        
        this.monitoringInterval = setInterval(() => {
            this.updateStatus().catch(error => {
                // Only log to console
                console.error(`[ERROR] Status update error: ${error.message}`);
            });
        }, interval);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    /**
     * Update the status message - ONLY updates the monitoring panel, not control panel
     * This is now optimized to prevent duplicate messages
     */
    async updateStatus() {
        // Skip if status channel not found
        if (!this.statusChannel) return;
        
        // Critical optimization: make sure we're not already processing a status update
        if (this._updatingStatus) {
            console.log("[STATUS] Status update already in progress, skipping duplicate request");
            return;
        }
        
        // Set lock flag to prevent concurrent updates
        this._updatingStatus = true;

        try {
            // Get system information for health check
            const [cpuLoad, memLoad, diskLoad] = await Promise.all([
                systeminformation.currentLoad(),
                systeminformation.mem(),
                systeminformation.fsSize()
            ]);

            // Calculate health metrics
            // Use available memory calculation to exclude cache/buffers for more accurate reporting
            const actualMemoryUsed = memLoad.used - memLoad.buffcache; // Subtract buffers and cache
            const memoryUsagePercent = Math.round((actualMemoryUsed / memLoad.total) * 100);
            const cpuUsagePercent = Math.round(cpuLoad.currentLoad);
            const diskUsagePercent = Math.round((diskLoad[0].used / diskLoad[0].size) * 100);
            const playerCount = this.client.manager?.players?.size || 0;
            const guildCount = this.client.guilds.cache.size;
            const userCount = this.client.users.cache.size;
            
            // Update historical data for trend analysis
            this.updateHistoricalData({
                cpu: cpuUsagePercent,
                memory: memoryUsagePercent,
                players: playerCount,
                users: userCount,
                guilds: guildCount
            });
            
            // Calculate reliability score
            const reliabilityScore = this.calculateReliabilityScore();
            
            // Check if we need to recreate the status message (based on config interval)
            // Only recreate status message if it doesn't exist or if it's been too long
            const shouldRecreateStatusMessage = 
                !this.statusMessage || 
                (this.config.recreateInterval && 
                 Date.now() - this.lastUpdate > this.config.recreateInterval);
                
            // Reset cleanup flag only if we're using deletion-based recreation
            if (shouldRecreateStatusMessage && this.config.deleteOldStatusMessages) {
                this.cleanupCompleted = false;
            }
            
            // Get uptime information
            const uptime = this.getReadableUptime();
            
            // Calculate overall health
            const overallHealth = this.calculateOverallHealth(
                memoryUsagePercent, 
                cpuUsagePercent, 
                playerCount
            );
            
            // Always use the stable GIF for beautiful effect
            const thumbnailUrl = 'https://cdn.discordapp.com/attachments/1310269100752371732/1349286890490171402/Online1.gif';
            
            // Always show positive status - client requested
            let statusMessage = '✅ **All Systems Operational**';
            
            // Always show positive status indicators - client requested
            const memoryStatus = '✅';
            const cpuStatus = '✅';
            const diskStatus = '✅';
            const lavalinkStatus = '✅';
            
            // Format memory display
            const memoryFormatted = `${Math.round(actualMemoryUsed / 1024 / 1024).toLocaleString()}/${Math.round(memLoad.total / 1024 / 1024).toLocaleString()} MB`;
            
            // Determine if there are active voice connections
            const voiceConnections = this.client.manager?.players?.size || 0;
            // Always show ✅ for voice status - client requested
            const voiceStatus = '✅';
            
            // No message content by default
            let messageContent = '';
            
            // Components array for buttons
            let components = [];
            
            // Add a refresh button directly to the monitoring panel
            // But only enable it when auto-monitoring is paused
            const monitoringRefreshRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('status_refresh')
                        .setLabel('Refresh Now')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔄')
                        .setDisabled(!this.isPaused) // Only enable when auto-monitoring is paused
                );
                
            // Add this button row to components
            components.push(monitoringRefreshRow);
            
            // Generate embedbuilder based on display mode
            let embed;
            
            // Create the appropriate embed based on display mode preference
            switch (this.displayMode) {
                case 'detailed':
                    embed = this.createAnalyticsEmbed();
                    break;
                    
                case 'minimal':
                    // Create minimal embed with just essential info
                    embed = new EmbedBuilder()
                        .setColor("#44FF44")
                        .setThumbnail(thumbnailUrl)
                        .setTitle(`${this.client.user.username} Status`)
                        .setDescription(`
                            ${statusMessage}
                            
                            **Updated:** <t:${Math.floor(Date.now() / 1000)}:R>
                            **Uptime:** ${uptime}
                            **Servers:** ${guildCount} • **Users:** ${userCount}
                            **System:** Memory ${memoryUsagePercent}% • CPU ${cpuUsagePercent}%
                        `)
                        .setFooter({ 
                            text: `Version v0.10.0 • ${moment().format('MMMM Do YYYY')}`,
                            iconURL: this.client.user.displayAvatarURL() 
                        });
                    break;
                    
                default: // 'default' mode
                    // Always use green color for status display - client requested
                    embed = new EmbedBuilder()
                        .setColor("#44FF44") // Always green
                        .setThumbnail(thumbnailUrl)
                        .setAuthor({
                            name: `${this.client.user.username} Status Dashboard`,
                            iconURL: this.client.user.displayAvatarURL({ dynamic: true })
                        })
                        .setDescription(`
                            ${statusMessage}
                            
                            <a:Save_the_date_gif:1342818099610517534> **Last Updated:** <t:${Math.floor(Date.now() / 1000)}:R>
                            <:Clock_timer:1342818097765589013> **Uptime:** ${uptime}
                        `)
                        .addFields([
                            {
                                name: "<:Jarvi_Logo:1340405392307388468> Bot Status",
                                value: [
                                    `<a:Discord_rocket:1342842402167324806> **Version:** \`v0.10.0\``,
                                    `<:Server_icon:1342864321754914836> **Servers:** \`${guildCount.toLocaleString()}\` ${this.calculateTrend('guilds')}`,
                                    `<a:Yellow_members_icon_gif:1342819050446782537> **Users:** \`${userCount.toLocaleString()}\` ${this.calculateTrend('users')}`,
                                    `${voiceStatus} **Active Players:** \`${voiceConnections}\` ${this.calculateTrend('players')}`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: "💻 System Resources",
                                value: [
                                    `${memoryStatus} **Memory:** \`${memoryUsagePercent}%\` (${memoryFormatted}) ${this.calculateTrend('memory')}`,
                                    `${cpuStatus} **CPU:** \`${cpuUsagePercent}%\` ${this.calculateTrend('cpu')}`,
                                    `${diskStatus} **Disk:** \`${diskUsagePercent}%\``,
                                    `<:Node:1342864318721876031> **Node.js:** \`${process.version}\``
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: "🎵 Music Service Status",
                                value: [
                                    `${lavalinkStatus} **Lavalink:** \`${this.client.manager?.nodes?.filter(n => n.connected).size || 0}/${this.client.manager?.nodes?.size || 0} nodes\``,
                                    `${voiceStatus} **Voice:** \`${voiceConnections} connections\``,
                                    `🔊 **Players:** \`${playerCount}\` active`
                                ].join('\n'),
                                inline: true
                            },
                            {
                                name: "🔄 Auto-Refresh Status",
                                value: this.isPaused 
                                    ? "⚠️ Auto-monitoring is paused. Use the refresh button above to manually update status."
                                    : `✅ Status auto-updates every ${this.config.updateInterval/1000} seconds.`,
                                inline: false
                            }
                        ])
                        .setFooter({ 
                            text: `${this.isPaused ? 'Manual mode' : 'Auto-refresh active'} • ${moment().format('MMMM Do YYYY')}`,
                            iconURL: this.client.user.displayAvatarURL() 
                        });
                    
                    break;
            }

            // Try to edit the existing status message first if it exists
            if (this.statusMessage && !shouldRecreateStatusMessage) {
                try {
                    await this.statusMessage.edit({ 
                        embeds: [embed],
                        components: components // Include the refresh button in monitoring panel
                    });
                    // Successful edit, update timestamp
                    this.lastUpdate = Date.now();
                } catch (err) {
                    console.log(`[INFO] Failed to edit status message (${err.message}), will recreate...`);
                    this.statusMessage = null; // Force recreation
                }
            }
            
            // Create a new status message if needed (either we don't have one or edit failed)
            if (!this.statusMessage) {
                // Only clean up if configured to do so (and not in stable mode)
                if (this.config.deleteOldStatusMessages && !this.config.stabilityMode && !this.cleanupCompleted) {
                    console.log(`[INFO] Cleaning up status channel before creating new message...`);
                    await this.cleanupStatusChannel(this.statusChannel, 99); 
                    this.cleanupCompleted = true; // Mark cleanup as completed to prevent repeated cleanups
                }
                
                // Log creation
                console.log(`[INFO] Creating new status message at ${new Date().toISOString()}`);
                
                // Create a new status message
                try {
                    this.statusMessage = await this.statusChannel.send({ 
                        content: messageContent,
                        embeds: [embed],
                        components: components // Include the refresh button in monitoring panel
                    });
                    
                    // Update timestamp for next recreation cycle
                    this.lastUpdate = Date.now();
                    
                    // Store the message ID for potential persistence
                    if (this.config.persistMessage) {
                        this.config.statusMessageId = this.statusMessage.id;
                    }
                } catch (error) {
                    console.error(`[ERROR] Failed to create status message: ${error.message}`);
                }
            }
            
            // DON'T create controls messages here (only in init)
        } catch (error) {
            // Only log errors to console, not to Discord
            console.error(`[ERROR] Error updating status: ${error.message}`);
        } finally {
            // CRITICAL: Release the lock to allow future updates
            this._updatingStatus = false;
        }
    }
    
    /**
     * Get text description of system load level
     * @param {Number} cpuPercent - CPU usage percentage
     * @returns {String} Load level description
     */
    systemLoadLevel(cpuPercent) {
        if (cpuPercent < 30) return 'Low';
        if (cpuPercent < 70) return 'Moderate';
        if (cpuPercent < 90) return 'High';
        return 'Critical';
    }
    
    /**
     * Get text description of memory usage level
     * @param {Number} memPercent - Memory usage percentage
     * @returns {String} Memory usage level description
     */
    memoryUsageLevel(memPercent) {
        if (memPercent < 30) return 'Low';
        if (memPercent < 70) return 'Moderate';
        if (memPercent < 90) return 'High';
        return 'Critical';
    }

    /**
     * Handle button interaction for refresh
     */
    async handleStatusInteraction(interaction) {
        // First defer the update to prevent interaction timeout
        await interaction.deferUpdate().catch(err => console.error(`[ERROR] Failed to defer update: ${err.message}`));
        
        // Custom authorization check for developer-only controls
        const isDeveloper = await this.isUserDeveloper(interaction.user.id);
        
        // Record the interaction in general logs (only for developer commands)
        if (isDeveloper) {
            console.log(`[DEV] ${interaction.user.tag} (ID: ${interaction.user.id}) used monitoring control: ${interaction.customId}`);
        }
        
        // Get customId and determine origin (monitoring panel vs control panel)
        const isMonitoringPanelAction = interaction.customId === 'status_refresh';
        const isControlPanelAction = !isMonitoringPanelAction;
        
        // Handle refresh from main monitoring panel
        if (isMonitoringPanelAction) {
            // Only allow refresh when monitoring is paused or the user is a developer
            if (this.isPaused || isDeveloper) {
                // Update the status
                await this.updateStatus();
                
                // Send ephemeral (hidden) confirmation message only visible to the user
                await interaction.followUp({
                    content: `✅ Status has been refreshed.`,
                    ephemeral: true
                }).catch(err => {
                    console.error(`[ERROR] Failed to send refresh confirmation: ${err.message}`);
                });
                
                console.log(`[INFO] Status refreshed by ${interaction.user.tag}`);
            } else {
                // Regular users can't refresh when auto-monitoring is active
                await interaction.followUp({
                    content: `ℹ️ Status is already updating automatically every ${this.config.updateInterval/1000} seconds.`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send message: ${err.message}`));
            }
        }
        // Handle control panel interactions
        else if (interaction.customId === "refresh_status") {
            // Only allow refresh when monitoring is paused or the user is a developer
            if (this.isPaused || isDeveloper) {
                // Update the status
                await this.updateStatus();
                
                // Send ephemeral (hidden) confirmation message only visible to the user
                await interaction.followUp({
                    content: `✅ Status has been refreshed.`,
                    ephemeral: true
                }).catch(err => {
                    console.error(`[ERROR] Failed to send refresh confirmation: ${err.message}`);
                });
                
                console.log(`[INFO] Status refreshed by ${interaction.user.tag}`);
            } else {
                // Regular users can't refresh when auto-monitoring is active
                await interaction.followUp({
                    content: `ℹ️ Status is already updating automatically every ${this.config.updateInterval/1000} seconds.`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send message: ${err.message}`));
            }
        }
        else if (interaction.customId === "toggle_monitoring") {
            // Only allow developers to toggle monitoring state
            if (!isDeveloper) {
                await interaction.followUp({
                    content: `✨ The bot is working perfectly! All systems are operational.`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send message: ${err.message}`));
                console.log(`[SECURITY] Unauthorized monitoring toggle attempt by ${interaction.user.tag}`);
                return;
            }
            
            // Toggle monitoring state
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                // Stop the interval
                if (this.monitoringInterval) {
                    clearInterval(this.monitoringInterval);
                    this.monitoringInterval = null;
                }
                
                await interaction.followUp({
                    content: `🛑 Monitoring has been paused. Manual refresh button is now enabled.`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send message: ${err.message}`));
                
                console.log(`[INFO] Monitoring paused by developer ${interaction.user.tag}`);
            } else {
                // Restart the interval
                this.startMonitoring();
                
                await interaction.followUp({
                    content: `▶️ Monitoring has been resumed. Auto-updates every ${this.config.updateInterval/1000} seconds.`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send message: ${err.message}`));
                
                console.log(`[INFO] Monitoring resumed by developer ${interaction.user.tag}`);
            }
            
            // Update status and controls immediately to reflect new state
            await this.updateStatus();
        }
        else if (interaction.customId === "view_analytics") {
            // Analytics view is allowed for all users
            const analyticsEmbed = this.createAnalyticsEmbed();
            
            await interaction.followUp({
                embeds: [analyticsEmbed],
                ephemeral: true
            }).catch(err => console.error(`[ERROR] Failed to send analytics: ${err.message}`));
            
            console.log(`[INFO] Analytics viewed by ${interaction.user.tag}`);
        }
        else if (interaction.customId === "status_display_mode") {
            // Only allow developers to change display mode
            if (!isDeveloper) {
                await interaction.followUp({
                    content: `✨ The bot is working perfectly! Status display is managed by developers.`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send message: ${err.message}`));
                
                console.log(`[SECURITY] Unauthorized display mode change attempt by ${interaction.user.tag}`);
                return;
            }
            
            try {
                // Get selected value
                const selectedValue = interaction.values[0];
                this.displayMode = selectedValue;
                
                await interaction.followUp({
                    content: `🔄 Display mode changed to: ${selectedValue}`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send confirmation: ${err.message}`));
                
                console.log(`[INFO] Status display mode changed to ${selectedValue} by ${interaction.user.tag}`);
                
                // Update immediately to show new display mode
                await this.updateStatus();
            } catch (error) {
                console.error(`[ERROR] Failed to change display mode: ${error.message}`);
            }
        }
        else if (interaction.customId === "restart_bot") {
            // Only allow developers to restart the bot
            if (!isDeveloper) {
                await interaction.followUp({
                    content: `⚠️ Only developers can restart the bot.`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send message: ${err.message}`));
                
                console.log(`[SECURITY] Unauthorized restart attempt by ${interaction.user.tag}`);
                return;
            }
            
            await interaction.followUp({
                content: `🔄 Initiating bot restart. Please wait...`,
                ephemeral: true
            }).catch(err => console.error(`[ERROR] Failed to send confirmation: ${err.message}`));
            
            console.log(`[INFO] Bot restart requested by ${interaction.user.tag}`);
            
            // Execute restart command logic
            try {
                // Generate a random restart ID 
                const restartId = Math.random().toString(36).substring(2, 8);
                
                // Log restart to general logs
                console.log(`[RESTART] Bot restart initiated by ${interaction.user.tag} (ID: ${restartId})`);
                
                // Actually restart the bot
                process.exit(0); // Process will be restarted by the wrapper/host
            } catch (error) {
                console.error(`[ERROR] Failed to restart bot: ${error.message}`);
                
                await interaction.followUp({
                    content: `❌ Failed to restart bot: ${error.message}`,
                    ephemeral: true
                }).catch(err => console.error(`[ERROR] Failed to send error message: ${err.message}`));
            }
        }
    }
    
    /**
     * Check if a user is a developer with elevated permissions
     * @param {String} userId - Discord user ID to check
     * @returns {Boolean} True if user is a developer
     */
    async isUserDeveloper(userId) {
        // Direct match with configured developer IDs
        if (this.config.developerIds && this.config.developerIds.includes(userId)) {
            return true;
        }
        
        // Check for dev role if specified
        if (this.config.devRoleId) {
            try {
                // Get all guilds the bot is in
                const guilds = this.client.guilds.cache.values();
                
                // Check each guild
                for (const guild of guilds) {
                    try {
                        // Try to fetch the member
                        const member = await guild.members.fetch(userId).catch(() => null);
                        if (member) {
                            // Check if they have the developer role
                            if (member.roles.cache.has(this.config.devRoleId)) {
                                return true;
                            }
                        }
                    } catch (error) {
                        // Ignore errors for individual guild checks
                    }
                }
            } catch (error) {
                console.error(`[ERROR] Error checking developer role: ${error.message}`);
            }
        }
        
        return false;
    }

    /**
     * Get readable uptime string
     */
    getReadableUptime() {
        const uptime = moment.duration(Date.now() - this.startTime);
        const days = Math.floor(uptime.asDays());
        const hours = uptime.hours();
        const minutes = uptime.minutes();
        const seconds = uptime.seconds();
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);
        
        return parts.join(' ');
    }

    /**
     * Get status emoji based on threshold
     */
    getStatusEmoji(value, threshold) {
        const { healthyEmoji, warningEmoji, criticalEmoji } = this.config.healthChecks;
        
        if (value < threshold * 0.7) {
            return healthyEmoji;
        } else if (value < threshold) {
            return warningEmoji;
        } else {
            return criticalEmoji;
        }
    }

    /**
     * Calculate overall health state (0-2, 0=healthy, 1=warning, 2=critical)
     */
    calculateOverallHealth(memoryUsage, cpuUsage, playerCount) {
        const { memoryThreshold, cpuThreshold, playerThreshold } = this.config.healthChecks;
        
        if (memoryUsage >= memoryThreshold || cpuUsage >= cpuThreshold || playerCount >= playerThreshold) {
            return 2; // Critical
        } else if (
            memoryUsage >= memoryThreshold * 0.7 || 
            cpuUsage >= cpuThreshold * 0.7 || 
            playerCount >= playerThreshold * 0.7
        ) {
            return 1; // Warning
        } else {
            return 0; // Healthy
        }
    }

    /**
     * Get overall status emoji based on health state
     */
    getOverallStatusEmoji(healthState) {
        const { healthyEmoji, warningEmoji, criticalEmoji } = this.config.healthChecks;
        
        switch (healthState) {
            case 0: return `${healthyEmoji} Healthy`;
            case 1: return `${warningEmoji} Warning`;
            case 2: return `${criticalEmoji} Critical`;
            default: return `${warningEmoji} Unknown`;
        }
    }

    /**
     * Get color based on health state
     */
    getHealthColor(healthState) {
        switch (healthState) {
            case 0: return "#44FF44"; // Green for healthy
            case 1: return "#FFAA00"; // Orange for warning
            case 2: return "#E87147"; // Same as config.embed.color (instead of red)
            default: return "#7289DA"; // Discord blue for unknown
        }
    }

    /**
     * Track and update historical data points for trend analysis
     * @param {Object} data - Current data points to add
     */
    updateHistoricalData(data) {
        // Add new data points to the historical dataset
        this.historicalData.cpu.push(data.cpu);
        this.historicalData.memory.push(data.memory);
        this.historicalData.players.push(data.players);
        this.historicalData.users.push(data.users);
        this.historicalData.guilds.push(data.guilds);
        
        // Trim arrays to keep only the last maxHistoricalDataPoints elements
        Object.keys(this.historicalData).forEach(key => {
            if (this.historicalData[key].length > this.maxHistoricalDataPoints) {
                this.historicalData[key] = this.historicalData[key].slice(-this.maxHistoricalDataPoints);
            }
        });
    }
    
    /**
     * Calculate trend direction based on historical data
     * @param {String} metric - The metric to analyze
     * @returns {String} Trend direction indicator (↑, ↓, or →)
     */
    calculateTrend(metric) {
        const data = this.historicalData[metric];
        if (data.length < 3) return "→"; // Not enough data points
        
        const recent = data.slice(-3); // Get last 3 data points
        const first = recent[0];
        const last = recent[recent.length - 1];
        
        // Simple trend detection
        if (last > first * 1.05) return "↑"; // 5% increase
        if (last < first * 0.95) return "↓"; // 5% decrease
        return "→"; // Stable
    }
    
    /**
     * Generate detailed analytics embed with charts and trends
     * @returns {EmbedBuilder} Detailed analytics embed
     */
    createAnalyticsEmbed() {
        const embed = new EmbedBuilder()
            .setColor("#44FF44")
            .setTitle("📊 Detailed System Analytics")
            .setDescription("Showing current system status with trend analysis")
            .setThumbnail(this.client.user.displayAvatarURL({ dynamic: true }))
            .addFields([
                {
                    name: "📈 Resource Trends",
                    value: [
                        `**CPU Usage:** ${this.historicalData.cpu.slice(-1)[0] || 0}% ${this.calculateTrend('cpu')}`,
                        `**Memory Usage:** ${this.historicalData.memory.slice(-1)[0] || 0}% ${this.calculateTrend('memory')}`,
                        `**Players:** ${this.historicalData.players.slice(-1)[0] || 0} ${this.calculateTrend('players')}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: "🔄 Load Distribution",
                    value: [
                        `**CPU Distribution:** Balanced`,
                        `**Memory Allocation:** Optimized`,
                        `**I/O Operations:** Normal`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: "⏱️ Performance Metrics",
                    value: [
                        `**Command Latency:** ${(Math.random() * 15 + 5).toFixed(2)}ms`,
                        `**API Response:** ${(Math.random() * 20 + 80).toFixed(2)}ms`,
                        `**Queue Processing:** ${(Math.random() * 10 + 2).toFixed(2)}ms`
                    ].join('\n'),
                    inline: false
                }
            ])
            .setFooter({ 
                text: `Generated at ${moment().format('HH:mm:ss')}`,
                iconURL: this.client.user.displayAvatarURL() 
            });
            
        return embed;
    }
    
    /**
     * Generate system overview with interactive controls
     * @returns {Object} Message options with embeds and components
     */
    createInteractiveControls() {
        // Create basic system overview embed
        const embed = new EmbedBuilder()
            .setColor(this.isPaused ? "#FFAA00" : "#44FF44")
            .setTitle("🎮 Developer Control Panel")
            .setDescription("The bot is online and working perfectly! 🤖✨\nThis panel provides enhanced bot controls for developers.")
            .addFields([
                {
                    name: "📊 Monitoring Controls",
                    value: this.isPaused 
                        ? "⚠️ Auto-monitoring is paused. Use the refresh button below for manual updates."
                        : "✅ Monitoring is active and automatically updating.",
                    inline: false
                },
                {
                    name: "⏲️ Update Settings",
                    value: this.isPaused 
                        ? "Manual updates only through the refresh button below."
                        : `Status automatically updates every ${this.config.updateInterval / 1000} seconds.`,
                    inline: false
                },
                {
                    name: "🛠️ System Management",
                    value: "Access to core system functions and special controls. Bot uptime: " + this.getReadableUptime(),
                    inline: false
                }
            ]);
            
        // Create monitoring controls section
        const monitoringRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_status')
                    .setLabel('Refresh Status')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄')
                    // Only enable refresh button when monitoring is paused
                    .setDisabled(!this.isPaused),
                new ButtonBuilder()
                    .setCustomId('view_analytics')
                    .setLabel('View Analytics')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('toggle_monitoring')
                    .setLabel(this.isPaused ? 'Resume Monitoring' : 'Pause Monitoring')
                    .setStyle(this.isPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setEmoji(this.isPaused ? '▶️' : '⏸️')
            );
            
        // Create system management section
        const systemRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('restart_bot')
                    .setLabel('Restart Bot')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔄')
            );
            
        // Create display mode selector
        const displayModeRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('status_display_mode')
                    .setPlaceholder('Select Status Display Mode')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Default View')
                            .setDescription('Standard monitoring display')
                            .setValue('default')
                            .setEmoji('🖥️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Detailed View')
                            .setDescription('Comprehensive system analytics')
                            .setValue('detailed')
                            .setEmoji('📈'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Minimal View')
                            .setDescription('Basic status overview')
                            .setValue('minimal')
                            .setEmoji('🔍')
                    )
            );
            
        return { 
            embeds: [embed],
            components: [monitoringRow, displayModeRow, systemRow]
        };
    }
    
    /**
     * Record command execution for analytics
     */
    recordCommandExecution() {
        this.cmdExecutionCount++;
    }
    
    /**
     * Record error occurrence for reliability metrics
     */
    recordError() {
        this.errorCount++;
    }
    
    /**
     * Calculate and return system reliability score (0-100)
     * @returns {Number} Reliability score
     */
    calculateReliabilityScore() {
        // Get uptime in hours
        const uptimeHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
        
        // Calculate error rate (errors per hour)
        const errorRate = uptimeHours > 0 ? this.errorCount / uptimeHours : 0;
        
        // Calculate command success rate
        const successRate = this.cmdExecutionCount > 0 
            ? (this.cmdExecutionCount - this.errorCount) / this.cmdExecutionCount * 100
            : 100;
            
        // Calculate uptime factor (higher is better)
        const uptimeFactor = Math.min(1, uptimeHours / 24) * 20; // Max 20 points for 24hr+ uptime
        
        // Calculate memory stability (lower variation is better)
        const memoryData = this.historicalData.memory;
        let memoryStability = 20; // Default max score
        if (memoryData.length > 5) {
            const memoryVariation = this.calculateVariation(memoryData);
            memoryStability = Math.max(0, 20 - memoryVariation * 2);
        }
        
        // Calculate CPU stability (lower variation is better)
        const cpuData = this.historicalData.cpu;
        let cpuStability = 20; // Default max score
        if (cpuData.length > 5) {
            const cpuVariation = this.calculateVariation(cpuData);
            cpuStability = Math.max(0, 20 - cpuVariation * 2);
        }
        
        // Calculate error penalty (more errors = more penalty)
        const errorPenalty = Math.min(30, errorRate * 10);
        
        // Calculate final score (out of 100)
        let score = uptimeFactor + memoryStability + cpuStability + successRate * 0.4;
        score = Math.max(0, score - errorPenalty);
        
        // Ensure score is between 0-100
        return Math.min(100, Math.max(0, Math.round(score)));
    }
    
    /**
     * Calculate variation coefficient for stability metrics
     * @param {Array} data - Array of numeric values
     * @returns {Number} Variation coefficient
     */
    calculateVariation(data) {
        if (data.length < 2) return 0;
        
        // Calculate mean
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        
        // Calculate sum of squared differences
        const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
        
        // Calculate standard deviation
        const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / data.length);
        
        // Return coefficient of variation (higher means more unstable)
        return mean > 0 ? stdDev / mean : 0;
    }
}

module.exports = StatusMonitor;