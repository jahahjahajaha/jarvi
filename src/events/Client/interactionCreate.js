const { CommandInteraction, Client, EmbedBuilder } = require("discord.js");
const pre = require("../../schema/prefix.js");
const i18n = require("../../utils/i18n");

module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        // Handle status monitor button interactions for all status-related buttons
        if (interaction.isButton()) {
            if (client.statusMonitor) {
                try {
                    // Handle refresh status button
                    if (interaction.customId === "refresh_status") {
                        await client.statusMonitor.handleStatusInteraction(interaction);
                        return;
                    }
                    
                    // Handle view analytics button
                    if (interaction.customId === "view_analytics") {
                        await interaction.deferReply({ ephemeral: true });
                        const analyticsEmbed = client.statusMonitor.createAnalyticsEmbed();
                        await interaction.followUp({ 
                            embeds: [analyticsEmbed],
                            ephemeral: true
                        });
                        client.logger.log(`Analytics view requested by ${interaction.user.tag}`, "info");
                        return;
                    }
                    
                    // Handle toggle monitoring button
                    if (interaction.customId === "toggle_monitoring") {
                        await interaction.deferUpdate();
                        
                        // Toggle monitoring status
                        if (client.statusMonitor.monitoringInterval) {
                            client.statusMonitor.stopMonitoring();
                            await interaction.followUp({
                                content: "✅ Status monitoring paused. Use 'Refresh Now' to update manually.",
                                ephemeral: true
                            });
                            client.logger.log(`Status monitoring paused by ${interaction.user.tag}`, "info");
                        } else {
                            client.statusMonitor.startMonitoring();
                            await interaction.followUp({
                                content: "✅ Status monitoring resumed with automatic updates.",
                                ephemeral: true
                            });
                            client.logger.log(`Status monitoring resumed by ${interaction.user.tag}`, "info");
                        }
                        return;
                    }
                } catch (error) {
                    client.logger.log(`Status button interaction error: ${error.message}`, "error");
                }
            }
        }
        
        // Handle status display mode selection
        if (interaction.isStringSelectMenu() && interaction.customId === "status_display_mode") {
            if (client.statusMonitor) {
                try {
                    await interaction.deferUpdate();
                    
                    // Get the selected display mode
                    const selectedMode = interaction.values[0];
                    client.statusMonitor.displayMode = selectedMode;
                    
                    // Update the status immediately to show changes
                    await client.statusMonitor.updateStatus();
                    
                    // Confirm the change to the user
                    await interaction.followUp({
                        content: `✅ Display mode changed to: ${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)}`,
                        ephemeral: true
                    });
                    
                    client.logger.log(`Status display mode changed to ${selectedMode} by ${interaction.user.tag}`, "info");
                    return;
                } catch (error) {
                    client.logger.log(`Status display mode selection error: ${error.message}`, "error");
                }
            }
        }
        
        // Process only if it's a command or context menu interaction
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            const slashCommand = client.slashCommands.get(interaction.commandName);
            if (!slashCommand) return;

            // Log command usage in both Hindi and English
            const userTag = interaction.user.tag;
            const userId = interaction.user.id;
            const guildName = interaction.guild ? interaction.guild.name : "DM";
            const guildId = interaction.guild ? interaction.guild.id : "DM";
            const channelName = interaction.channel ? interaction.channel.name : "Unknown";
            const channelId = interaction.channel ? interaction.channel.id : "Unknown";
            const commandName = interaction.commandName;
            const options = interaction.options ? interaction.options.data.map(o => `${o.name}:${o.value}`).join(', ') : "None";
            
            // Use bilingual logger
            client.logger.logBilingual(
                `Command executed: /${commandName} ${options ? `(${options})` : ""} by ${userTag} in ${guildName} (${channelName})`,
                `कमांड निष्पादित: /${commandName} ${options ? `(${options})` : ""} ${userTag} द्वारा ${guildName} (${channelName}) में`,
                "cmd"
            );

            // Check voice channel requirements
            if (slashCommand.inVoiceChannel && !interaction.member.voice.channel) {
                const errorMessage = interaction.locale === "hi" ? 
                    `${client.emoji.error} आपको वॉइस चैनल में होना होगा!` : 
                    `${client.emoji.error} You need to be in a voice channel!`;
                
                client.logger.log(`Command /${commandName} failed: User not in voice channel`, "error");
                return await interaction.reply({
                    content: errorMessage,
                    ephemeral: true
                });
            }

            // Check same voice channel requirement
            if (slashCommand.sameVoiceChannel && interaction.guild.members.me.voice.channel) {
                if (interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
                    const errorMessage = interaction.locale === "hi" ? 
                        `${client.emoji.error} आपको ${interaction.client.user} के साथ समान चैनल में होना चाहिए!` : 
                        `${client.emoji.error} You must be in the same channel as ${interaction.client.user}!`;
                    
                    client.logger.log(`Command /${commandName} failed: User not in same voice channel as bot`, "error");
                    return await interaction.reply({
                        content: errorMessage,
                        ephemeral: true
                    });
                }
            }

            try {
                // Execute the command handler
                await slashCommand.execute(interaction, client);
                
                // Log successful command execution
                client.logger.log(`Command /${commandName} executed successfully by ${userTag}`, "info");
            } catch (error) {
                // Log error with details
                const errorLog = `Command /${commandName} error: ${error.message}\n` +
                                `Stack: ${error.stack || "No stack trace"}\n` +
                                `User: ${userTag} (${userId})\n` +
                                `Server: ${guildName} (${guildId})`;
                client.logger.log(errorLog, "error");
                
                // Get error message in user's language
                const errorMessage = interaction.locale === "hi" ? 
                    `${client.emoji.error} इस कमांड को चलाते समय एक त्रुटि हुई!` : 
                    `${client.emoji.error} An error occurred while executing this command!`;
                    
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: errorMessage }).catch(() => {});
                } else {
                    await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
                }
            }
        }
    }
};