const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const os = require('os');
const systeminformation = require('systeminformation');
const moment = require('moment');
const config = require('../config');

/**
 * Status Monitor for Bot Health
 * Provides real-time monitoring and updates in a Discord channel
 */
class StatusMonitor {
    constructor(client) {
        this.client = client;
        this.statusMessage = null;
        this.monitoringInterval = null;
        this.statusChannel = null;
        this.lastUpdate = Date.now();
        this.startTime = Date.now();
        this.cleanupCompleted = false;
    }

    /**
     * Initialize the status monitor
     */
    async init() {
        if (!config.monitoring.enabled) {
            console.log("[STATUS] Status monitoring is disabled in config");
            return;
        }

        try {
            // Fetch status channel
            this.statusChannel = await this.client.channels.fetch(config.monitoring.statusChannelId).catch(() => null);
            if (!this.statusChannel) {
                console.log("[ERROR] Status channel not found! Monitoring disabled.");
                return;
            }
            
            // Always clean up all messages in the status channel on startup
            await this.cleanupStatusChannel(100);
            
            // Reset the cleanup status to ensure we always clean up
            this.cleanupCompleted = false;
            
            // Force creation of a new status message
            this.statusMessage = null;
            config.monitoring.statusMessageId = null;
            
            // Create new status message
            await this.updateStatus();

            // Start periodic updates
            this.startMonitoring();

            console.log("[READY] Bot status monitoring system initialized");
        } catch (error) {
            console.error(`[ERROR] Failed to initialize status monitoring: ${error.message}`);
        }
    }
    
    /**
     * Clean up the status channel by deleting all messages
     * @param {Number} limit - Maximum number of messages to delete
     */
    async cleanupStatusChannel(limit = 100) {
        try {
            if (!this.statusChannel) return;
            
            // We want to clean up every time the bot restarts, so removed the cleanupCompleted check
            // to ensure messages are always deleted
            
            console.log(`[INFO] Cleaning up status channel - deleting old messages...`);
            
            // Fetch messages (up to the limit)
            const messages = await this.statusChannel.messages.fetch({ limit });
            
            // If we have messages to delete
            if (messages.size > 0) {
                // Use bulkDelete for messages less than 14 days old
                try {
                    await this.statusChannel.bulkDelete(messages);
                    console.log(`[INFO] Bulk deleted ${messages.size} messages from status channel`);
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
                        console.log(`[INFO] Deleted ${deleteCount} old messages one by one from status channel`);
                    }
                }
            }
            
            // We've removed the cleanupCompleted flag to ensure messages are always cleaned up
        } catch (error) {
            console.error(`[ERROR] Failed to clean up status channel: ${error.message}`);
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
        const interval = config.monitoring.updateInterval || 3000;
        
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
     * Update the status message
     */
    async updateStatus() {
        if (!this.statusChannel) return;

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
            
            // Check if we need to recreate the message (every 10 minutes)
            // Also reset cleanupCompleted flag to make sure we're always cleaning up
            const shouldRecreateMessage = 
                !this.statusMessage || 
                Date.now() - this.lastUpdate > 600000; // 10 minutes in milliseconds
                
            // If it's time for recreation, reset cleanup flag to ensure we delete old messages
            if (shouldRecreateMessage) {
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
            
            // Create the status embed with conditional colors based on health
            const embed = new EmbedBuilder()
                .setColor(this.getHealthColor(overallHealth)) // Use appropriate color based on health
                .setAuthor({
                    name: `${this.client.user.username} Status Monitor`,
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setDescription(`**Status**: ${this.getOverallStatusEmoji(overallHealth)}\nLast Updated: <t:${Math.floor(Date.now() / 1000)}:R>`)
                .addFields([
                    {
                        name: "🤖 Bot Information",
                        value: [
                            `**Version:** v1.0.0`,
                            `**Uptime:** ${uptime}`,
                            `**Servers:** ${this.client.guilds.cache.size}`,
                            `**Users:** ${this.client.users.cache.size}`,
                            `**Active Players:** ${playerCount > 0 ? `${config.monitoring.healthChecks.healthyEmoji} ${playerCount}` : '0'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: "💻 System Health",
                        value: [
                            `**Memory:** ${this.getStatusEmoji(memoryUsagePercent, config.monitoring.healthChecks.memoryThreshold)} ${memoryUsagePercent}% (${Math.round(actualMemoryUsed / 1024 / 1024)}/${Math.round(memLoad.total / 1024 / 1024)} MB)`,
                            `**CPU:** ${this.getStatusEmoji(cpuUsagePercent, config.monitoring.healthChecks.cpuThreshold)} ${cpuUsagePercent}%`,
                            `**Disk:** ${this.getStatusEmoji(diskUsagePercent, 90)} ${diskUsagePercent}%`,
                            `**Platform:** Linux ${os.release()}`,
                            `**Node.js:** ${process.version}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: "🎵 Music Service",
                        value: [
                            `**Lavalink Nodes:** ${this.client.manager?.nodes?.size || 0}`,
                            `**Active Nodes:** ${this.client.manager?.nodes?.filter(n => n.connected).size || 0}`,
                            `**Connected Voice:** ${this.client.voice?.adapters?.size || 0} channels`
                        ].join('\n'),
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `${this.client.user.username} Status Monitor | Auto-updates every ${Math.floor(config.monitoring.updateInterval/1000)} seconds | Today at ${moment().format('h:mm A')}`,
                    iconURL: this.client.user.displayAvatarURL() 
                });

            // If we need to recreate the message or don't have one
            if (shouldRecreateMessage) {
                // Delete all previous status messages
                try {
                    // Fetch more messages to ensure we get all status messages
                    const messages = await this.statusChannel.messages.fetch({ limit: 10 });
                    
                    // Filter for bot messages only
                    const botMessages = messages.filter(msg => 
                        msg.author.id === this.client.user.id && 
                        (msg.content?.includes("Status Monitor") || 
                         (msg.embeds.length > 0 && 
                          (msg.embeds[0].title?.includes("Status Monitor") || 
                           msg.embeds[0].author?.name?.includes("Status Monitor"))))
                    );
                    
                    if (botMessages.size > 0) {
                        // Delete old messages one by one (more reliable than bulkDelete)
                        for (const [_, message] of botMessages) {
                            await message.delete().catch(() => {});
                        }
                        
                        // Log deletion for debugging but only to console
                        console.log(`[INFO] Deleted ${botMessages.size} old status messages`);
                    }
                } catch (err) {
                    console.error(`[ERROR] Failed to delete old status messages: ${err.message}`);
                }
                
                // Create a completely new status message with no initial content
                this.statusMessage = await this.statusChannel.send({ 
                    embeds: [embed]
                });
                
                // Update timestamp for next recreation cycle
                this.lastUpdate = Date.now();
            } else {
                // Just edit the existing message
                try {
                    await this.statusMessage.edit({ 
                        embeds: [embed]
                    });
                } catch (err) {
                    console.warn(`[WARN] Failed to edit status message: ${err.message}`);
                    // Message may have been deleted, recreate next cycle
                    this.statusMessage = null;
                }
            }
        } catch (error) {
            // Only log errors to console, not to Discord
            console.error(`[ERROR] Error updating status: ${error.message}`);
        }
    }

    /**
     * Handle button interaction for refresh
     */
    async handleStatusInteraction(interaction) {
        if (interaction.customId === "refresh_status") {
            // First defer the update to prevent interaction timeout
            await interaction.deferUpdate();
            
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
        }
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
        const { healthyEmoji, warningEmoji, criticalEmoji } = config.monitoring.healthChecks;
        
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
        const { memoryThreshold, cpuThreshold, playerThreshold } = config.monitoring.healthChecks;
        
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
        const { healthyEmoji, warningEmoji, criticalEmoji } = config.monitoring.healthChecks;
        
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
}

module.exports = StatusMonitor;