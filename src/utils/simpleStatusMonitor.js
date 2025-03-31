/**
 * SIMPLIFIED STATUS MONITOR
 * 
 * Provides a single, lightweight status panel without controls or buttons
 * Changes channel name to indicate bot status (🔴 -> 🟢)
 * Designed for minimalism and reliability
 */

const { EmbedBuilder } = require('discord.js');
const systeminformation = require('systeminformation');
const moment = require('moment');
require('moment-duration-format');
require('dotenv').config();

// Global singleton instance
let _instance = null;

class SimpleStatusMonitor {
    /**
     * Get singleton instance - prevents duplicate monitors
     * @param {Client} client - Discord.js client
     * @returns {SimpleStatusMonitor} Singleton instance
     */
    static getInstance(client) {
        if (!_instance) {
            _instance = new SimpleStatusMonitor(client);
            console.log("[STATUS] Created NEW SimpleStatusMonitor instance");
        } else if (client && !_instance.client) {
            _instance.client = client;
            console.log("[STATUS] Updated existing SimpleStatusMonitor with client");
        }
        return _instance;
    }
    
    /**
     * Private constructor - use getInstance() instead
     */
    constructor(client) {
        // Enforce singleton pattern
        if (_instance) return _instance;
        
        // Basic properties
        this.client = client;
        this.startTime = Date.now();
        this.statusChannel = null;
        this.statusMessage = null;
        this.monitoringInterval = null;
        this.lastUpdate = 0;
        
        // Lock flags to prevent concurrent operations
        this._isInitializing = false;
        this._updatingStatus = false;
        this.isInitialized = false;
        
        // Simple stats tracking
        this.historicalData = {
            cpu: [], memory: [], players: [], users: [], guilds: []
        };
        
        // Configuration
        this.config = {
            enabled: true,
            statusChannelId: process.env.BOT_STATUS_CHANNEL,
            updateInterval: 3000,
            maxMessagesToDelete: 10,
            maxHistoricalDataPoints: 15
        };
    }
    
    /**
     * Initialize the status monitor
     */
    async init() {
        // Skip if disabled or already running
        if (!this.config.enabled) return;
        if (this.isInitialized) return;
        if (this._isInitializing) return;
        
        try {
            this._isInitializing = true;
            console.log("[STATUS] Beginning status monitor initialization...");
            
            // Get status channel
            this.statusChannel = await this.client.channels.fetch(this.config.statusChannelId)
                .catch(err => {
                    console.error(`[ERROR] Status channel not found: ${err.message}`);
                    return null;
                });
                
            if (!this.statusChannel) {
                console.error("[ERROR] Status channel not found! Monitoring disabled.");
                return;
            }
            
            // Log channel info
            console.log(`[STATUS] Found status channel: ${this.statusChannel.name} (${this.statusChannel.id})`);
            console.log(`[STATUS] Channel is manageable: ${this.statusChannel.manageable}`);
            
            // Clean up channel and update status
            await this.cleanupStatusChannel(this.statusChannel);
            await this.updateChannelStatusIndicator(this.statusChannel);
            
            // Create initial status message and start monitoring
            this.statusMessage = null;
            await this.updateStatus();
            this.startMonitoring();
            
            this.isInitialized = true;
            console.log("[READY] Status monitoring system initialized");
        } catch (error) {
            console.error(`[ERROR] Failed to initialize status monitor: ${error.message}`);
        } finally {
            this._isInitializing = false;
        }
    }
    
    /**
     * Update channel name to show bot is online (🔴 -> 🟢)
     */
    async updateChannelStatusIndicator(channel) {
        if (!channel || !channel.manageable) return;
        
        try {
            const currentName = channel.name;
            console.log(`[STATUS] Current channel name: "${currentName}"`);
            
            // If already has online indicator, do nothing
            if (currentName.includes('🟢')) {
                console.log("[STATUS] Channel already has online indicator 🟢");
                return;
            }
            
            // Replace offline with online or add indicator
            let newName = currentName.includes('🔴') 
                ? currentName.replace('🔴', '🟢') 
                : currentName + ' 🟢';
            
            // Update channel name
            await channel.setName(newName);
        } catch (error) {
            console.error(`[ERROR] Failed to update channel status indicator: ${error.message}`);
        }
    }
    
    /**
     * Clean up channel by deleting old messages
     */
    async cleanupStatusChannel(channel) {
        if (!channel) return;
        
        try {
            console.log(`[INFO] Cleaning up channel ${channel.name}...`);
            
            // Fetch last few messages
            const messages = await channel.messages.fetch({ 
                limit: this.config.maxMessagesToDelete
            });
            
            if (messages.size > 0) {
                try {
                    await channel.bulkDelete(messages);
                    console.log(`[INFO] Bulk deleted ${messages.size} messages`);
                } catch (bulkError) {
                    // If bulk delete fails (messages too old), delete one by one
                    let deleteCount = 0;
                    for (const [_, message] of messages) {
                        try {
                            await message.delete();
                            deleteCount++;
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (err) { /* Ignore errors */ }
                    }
                    
                    if (deleteCount > 0) {
                        console.log(`[INFO] Deleted ${deleteCount} messages individually`);
                    }
                }
            }
        } catch (error) {
            console.error(`[ERROR] Failed to clean up channel: ${error.message}`);
        }
    }
    
    /**
     * Start periodic monitoring updates
     */
    startMonitoring() {
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        
        const interval = this.config.updateInterval || 3000;
        console.log(`[INFO] Status monitor set to update every ${interval/1000} seconds`);
        
        this.monitoringInterval = setInterval(() => {
            this.updateStatus().catch(error => {
                console.error(`[ERROR] Status update error: ${error.message}`);
            });
        }, interval);
    }
    
    /**
     * Stop monitoring updates
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    
    /**
     * Update the status message with latest information
     */
    async updateStatus() {
        // Skip if channel not found or update already in progress
        if (!this.statusChannel || this._updatingStatus) return;
        
        this._updatingStatus = true;
        
        try {
            // Get system information in parallel
            const [cpuLoad, memLoad, diskLoad] = await Promise.all([
                systeminformation.currentLoad(),
                systeminformation.mem(),
                systeminformation.fsSize()
            ]);
            
            // Calculate metrics
            const actualMemoryUsed = memLoad.used - memLoad.buffcache;
            const memoryUsagePercent = Math.round((actualMemoryUsed / memLoad.total) * 100);
            const cpuUsagePercent = Math.round(cpuLoad.currentLoad);
            const diskUsagePercent = Math.round((diskLoad[0].used / diskLoad[0].size) * 100);
            const playerCount = this.client.manager?.players?.size || 0;
            const guildCount = this.client.guilds.cache.size;
            const userCount = this.client.users.cache.size;
            
            // Track historical data
            this.updateHistoricalData({
                cpu: cpuUsagePercent,
                memory: memoryUsagePercent,
                players: playerCount,
                users: userCount,
                guilds: guildCount
            });
            
            // Format data for display
            const uptime = this.getReadableUptime();
            const memoryFormatted = `${Math.round(actualMemoryUsed / 1024 / 1024).toLocaleString()}/${Math.round(memLoad.total / 1024 / 1024).toLocaleString()} MB`;
            
            // Create embed for status message
            const embed = new EmbedBuilder()
                .setColor('#44b37f')
                .setAuthor({
                    name: `${this.client.user.username} Status Monitor`,
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setThumbnail('https://cdn.discordapp.com/attachments/1310269100752371732/1349286890490171402/Online1.gif')
                .setDescription('<a:Boost_gif:1342820038465552476> **All Systems Operational** <a:Rocket_boost_gif:1342804400132849664>')
                .addFields(
                    { 
                        name: '<a:Save_the_date_gif:1342818099610517534> Last Updated:', 
                        value: `<t:${Math.floor(Date.now() / 1000)}:R>\n<a:Running_time:1341816641700499537> Uptime: ${uptime}`,
                        inline: false
                    },
                    {
                        name: '<:Jarvi_Logo:1340405392307388468> Bot Status',
                        value: `<a:Discord_rocket:1342842402167324806> Version: ${this.client.config.version}\n<a:Link_1_gif:1342811880967634985> Servers: ${guildCount}\n<a:Yellow_members_icon_gif:1342819050446782537> Users: ${userCount}\n<a:Yello_announcement_gif:1342819760563425332> Active Players: ${playerCount}`,
                        inline: false
                    },
                    {
                        name: '<:Id_card:1342864306441556121> System Resources',
                        value: `<a:Animation_Characters:1342851447078781031> Memory: ${memoryFormatted}\n<a:silhouette_gif:1342787822674903104> CPU: ${cpuUsagePercent}%\n<a:Black_silhouette_gif:1342798494028660776> Disk: ${diskUsagePercent}%\n<:Satellite_Signal:1342849229277888614> Node: Node.js ${process.version}`,
                        inline: false
                    },
                    {
                        name: '<a:Cutebaby_playing_musicinstrument:1342820648572944396> Music Service Status',
                        value: `<a:Boosts_gif:1342838252159107102> Lavalink: 1/1 nodes\n<a:CD_playing_gif:1342194315404902411> Voice: 0 connections\n<a:Let_gpt_do_it_gif:1343568693212348448> Players: ${playerCount} active`,
                        inline: false
                    },
                    {
                        name: '<a:infinite_gif:1341844261003460618> Auto-Refresh Status',
                        value: `<a:Refreshing_black_gif:1342795383931277355> Status auto-updates every 3 seconds.`,
                        inline: false
                    }
                )
                .setFooter({
                    text: `Auto-refresh active • ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();
            
            // Send/update status message
            if (!this.statusMessage) {
                console.log(`[INFO] Creating new status message at ${new Date().toISOString()}`);
                this.statusMessage = await this.statusChannel.send({ embeds: [embed] });
            } else {
                try {
                    await this.statusMessage.edit({ embeds: [embed] });
                } catch (error) {
                    console.log(`[INFO] Failed to edit status message, creating new one`);
                    this.statusMessage = await this.statusChannel.send({ embeds: [embed] });
                }
            }
            this.lastUpdate = Date.now();
        } catch (error) {
            console.error(`[ERROR] Status update failed: ${error.message}`);
        } finally {
            this._updatingStatus = false;
        }
    }
    
    /**
     * Get human-readable uptime string
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
        
        return parts.join(' ') || '0s';
    }
    
    /**
     * Update historical data for trends
     */
    updateHistoricalData(data) {
        // Add new data points and trim to max size in one operation for each array
        const maxPoints = this.config.maxHistoricalDataPoints;
        
        for (const key in this.historicalData) {
            this.historicalData[key].push(data[key]);
            if (this.historicalData[key].length > maxPoints) {
                this.historicalData[key] = this.historicalData[key].slice(-maxPoints);
            }
        }
    }
}

module.exports = SimpleStatusMonitor;