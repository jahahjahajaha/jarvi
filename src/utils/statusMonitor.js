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
    }

    /**
     * Initialize the status monitor
     */
    async init() {
        if (!config.monitoring.enabled) {
            return this.client.logger.log("Status monitoring is disabled in config", "info");
        }

        try {
            // Fetch status channel
            this.statusChannel = await this.client.channels.fetch(config.monitoring.statusChannelId).catch(() => null);
            if (!this.statusChannel) {
                return this.client.logger.log("Status channel not found! Monitoring disabled.", "error");
            }

            // Check if we already have a status message ID saved
            if (config.monitoring.statusMessageId) {
                try {
                    this.statusMessage = await this.statusChannel.messages.fetch(config.monitoring.statusMessageId).catch(() => null);
                } catch (error) {
                    this.client.logger.log(`Failed to fetch existing status message: ${error.message}`, "warn");
                }
            }

            // Create or update status message
            await this.updateStatus();

            // Start periodic updates
            this.startMonitoring();

            this.client.logger.logBilingual(
                "Bot status monitoring system initialized",
                "Bot status monitoring system initialized",
                "ready"
            );
        } catch (error) {
            this.client.logger.log(`Failed to initialize status monitoring: ${error.stack}`, "error");
        }
    }

    /**
     * Start periodic monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(() => {
            this.updateStatus().catch(error => {
                this.client.logger.log(`Status update error: ${error.message}`, "error");
            });
        }, config.monitoring.updateInterval || 60000); // Use configured interval (60 seconds default)
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
            const memoryUsagePercent = Math.round((memLoad.used / memLoad.total) * 100);
            const cpuUsagePercent = Math.round(cpuLoad.currentLoad);
            const diskUsagePercent = Math.round((diskLoad[0].used / diskLoad[0].size) * 100);
            const playerCount = this.client.manager?.players?.size || 0;
            
            // Determine health status
            const memoryStatus = this.getStatusEmoji(memoryUsagePercent, config.monitoring.healthChecks.memoryThreshold);
            const cpuStatus = this.getStatusEmoji(cpuUsagePercent, config.monitoring.healthChecks.cpuThreshold);
            const playerStatus = this.getStatusEmoji(playerCount, config.monitoring.healthChecks.playerThreshold);
            
            // Calculate overall health
            const overallHealth = this.calculateOverallHealth(
                memoryUsagePercent, 
                cpuUsagePercent, 
                playerCount
            );

            // Get uptime information
            const uptime = this.getReadableUptime();
            
            // Create the status embed
            const embed = new EmbedBuilder()
                .setColor(this.getHealthColor(overallHealth))
                .setTitle(`🖥️ ${this.client.user.username} Status Monitor`)
                .setDescription(`**Overall Status**: ${this.getOverallStatusEmoji(overallHealth)}\n\n` +
                    `Last Updated: <t:${Math.floor(Date.now() / 1000)}:R>`)
                .addFields([
                    {
                        name: "🤖 Bot Information",
                        value: [
                            `**Version:** v1.0.0`,
                            `**Uptime:** ${uptime}`,
                            `**Servers:** ${this.client.guilds.cache.size}`,
                            `**Users:** ${this.client.users.cache.size}`,
                            `**Active Players:** ${playerStatus} ${playerCount}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: "💻 System Health",
                        value: [
                            `**Memory:** ${memoryStatus} ${memoryUsagePercent}% (${Math.round(memLoad.used / 1024 / 1024)} MB)`,
                            `**CPU:** ${cpuStatus} ${cpuUsagePercent}%`,
                            `**Disk:** ${this.getStatusEmoji(diskUsagePercent, 90)} ${diskUsagePercent}%`,
                            `**Platform:** ${os.platform()} ${os.release()}`,
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
                    text: `${this.client.user.username} Status Monitor | Auto-updates every ${Math.floor(config.monitoring.updateInterval/1000)} seconds`,
                    iconURL: this.client.user.displayAvatarURL() 
                })
                .setTimestamp();

            // Create action buttons for refresh and support
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("refresh_status")
                    .setLabel("Refresh")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("🔄"),
                new ButtonBuilder()
                    .setLabel("Support")
                    .setStyle(ButtonStyle.Link)
                    .setURL(config.bot.supportServer)
            );

            // Check if we should edit or create new message
            if (config.monitoring.editMessages && this.statusMessage) {
                // Edit the existing message
                try {
                    await this.statusMessage.edit({ 
                        content: `**${this.client.user.username} Status Monitor**`,
                        embeds: [embed],
                        components: config.monitoring.showRefreshButton ? [actionRow] : []
                    });
                } catch (err) {
                    this.client.logger.log(`Failed to edit status message: ${err.message}`, "warn");
                    this.statusMessage = null; // Reset if edit fails
                }
            }
            
            // Create a new message if we don't have one or edit failed
            if (!this.statusMessage) {
                // If configured to delete old messages, do so before posting new one
                if (config.monitoring.deleteOldStatusMessages) {
                    try {
                        // Delete previous messages (up to the configured limit)
                        const messages = await this.statusChannel.messages.fetch({ 
                            limit: config.monitoring.maxMessagesToDelete || 5 
                        });
                        
                        if (messages.size > 0) {
                            await this.statusChannel.bulkDelete(messages).catch(e => {
                                // If bulk delete fails (e.g. messages > 14 days old), delete one by one
                                messages.forEach(msg => {
                                    msg.delete().catch(() => {});
                                });
                            });
                            
                            this.client.logger.log(`Deleted ${messages.size} old status messages`, "info");
                        }
                    } catch (err) {
                        this.client.logger.log(`Failed to delete old status messages: ${err.message}`, "error");
                    }
                }
                
                // Create a new status message
                this.statusMessage = await this.statusChannel.send({ 
                    content: `**${this.client.user.username} Status Monitor**`,
                    embeds: [embed],
                    components: config.monitoring.showRefreshButton ? [actionRow] : []
                });
                
                // Save message ID for future use
                config.monitoring.statusMessageId = this.statusMessage.id;
            }

            // Update last update timestamp
            this.lastUpdate = Date.now();
            
            // Automatic refresh happens through the main updateInterval setting
            // No need for additional refresh here
        } catch (error) {
            this.client.logger.log(`Error updating status: ${error.stack}`, "error");
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
                this.client.logger.log(`Failed to send refresh confirmation: ${err.message}`, "error");
            });
            
            this.client.logger.log(`Status refreshed by ${interaction.user.tag}`, "info");
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