const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const lodash = require("lodash");

module.exports = {
    name: "serverlist",
    category: "Dev",
    description: "Enhanced listing of all servers with advanced analytics",
    aliases: ["sl", "servers", "guilds"],
    args: false,
    usage: "[sort:members/name/id/age] [search:term]",
    permission: [],
    owner: true,
    execute: async (message, args, client, prefix) => {
        // Parse arguments for sorting and filtering
        let sortMethod = "default";
        let searchTerm = "";
        
        if (args.length > 0) {
            if (args[0].startsWith("sort:")) {
                sortMethod = args[0].substring(5).toLowerCase();
                args.shift();
            }
            
            if (args.length > 0 && args[0].startsWith("search:")) {
                searchTerm = args[0].substring(7).toLowerCase();
                args.shift();
            } else if (args.length > 0) {
                searchTerm = args.join(" ").toLowerCase();
            }
        }
        
        // Get all servers and apply filters
        let serverList = client.guilds.cache;
        
        // Apply search filter if provided
        if (searchTerm) {
            serverList = serverList.filter(guild => 
                guild.name.toLowerCase().includes(searchTerm) || 
                guild.id.includes(searchTerm)
            );
            
            if (serverList.size === 0) {
                return message.reply({
                    embeds: [new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`❌ No servers found matching search term: "${searchTerm}"`)
                    ]
                });
            }
        }
        
        // Sort the servers based on selected method
        let sortedServers = [...serverList.values()];
        
        switch (sortMethod) {
            case "members":
                sortedServers.sort((a, b) => b.memberCount - a.memberCount);
                break;
            case "name":
                sortedServers.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "id":
                sortedServers.sort((a, b) => a.id.localeCompare(b.id));
                break;
            case "age":
                sortedServers.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                break;
            default:
                // Default sort is by member count
                sortedServers.sort((a, b) => b.memberCount - a.memberCount);
                break;
        }
        
        // Format server data with more details
        const formattedServers = sortedServers.map((guild, i) => {
            // Calculate join date info
            const joinDate = guild.joinedAt ? new Date(guild.joinedAt).toISOString().split('T')[0] : 'Unknown';
            const boostLevel = guild.premiumTier ? `Level ${guild.premiumTier}` : 'None';
            const boostCount = guild.premiumSubscriptionCount || 0;
            
            return `\`\`\`md
# ${i + 1}. ${guild.name}
ID: ${guild.id}
Owner: ${guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown'}
Members: ${guild.memberCount} 
Channels: ${guild.channels.cache.size}
Roles: ${guild.roles.cache.size}
Boost: ${boostLevel} (${boostCount} boosts)
Joined: ${joinDate}
\`\`\``;
        });
        
        // Calculate server statistics
        const totalMembers = sortedServers.reduce((acc, guild) => acc + guild.memberCount, 0);
        const avgMembers = Math.round(totalMembers / sortedServers.length);
        const largestServer = sortedServers.reduce((prev, curr) => 
            prev.memberCount > curr.memberCount ? prev : curr
        );
        
        // Create pages with server chunks
        const serverChunks = lodash.chunk(formattedServers, 5);
        const pages = serverChunks.map(chunk => chunk.join("\n"));
        let page = 0;
        
        // Create the initial embed
        const createEmbed = (pageNum) => {
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(pages[pageNum])
                .setAuthor({
                    name: `${client.user.username}'s Server List`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true })
                })
                .setFooter({
                    text: `Page ${pageNum + 1}/${pages.length} • ${sortedServers.length} servers • ${totalMembers.toLocaleString()} members`
                })
                .addFields([
                    { 
                        name: "📊 Server Statistics", 
                        value: `Total Servers: **${sortedServers.length}**\nTotal Members: **${totalMembers.toLocaleString()}**\nAverage Members: **${avgMembers}**\nLargest Server: **${largestServer.name}** (${largestServer.memberCount.toLocaleString()} members)`,
                        inline: false
                    }
                ]);
                
            if (searchTerm) {
                embed.addFields([
                    { name: "🔍 Search Filter", value: `Showing results for: "${searchTerm}"`, inline: false }
                ]);
            }
            
            return embed;
        };
        
        // If only a few servers, don't need pagination
        if (pages.length <= 1) {
            return await message.channel.send({
                embeds: [createEmbed(0)]
            });
        }
        
        // Create navigation buttons
        const prevBtn = new ButtonBuilder()
            .setCustomId("server_list_prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true); // Initially disabled as we start at page 0
            
        const stopBtn = new ButtonBuilder()
            .setCustomId("server_list_stop")
            .setEmoji("✖️")
            .setStyle(ButtonStyle.Danger);
            
        const nextBtn = new ButtonBuilder()
            .setCustomId("server_list_next")
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pages.length <= 1); // Disabled if only one page
        
        const refreshBtn = new ButtonBuilder()
            .setCustomId("server_list_refresh")
            .setEmoji("🔄")
            .setStyle(ButtonStyle.Success);
            
        // Create sort dropdown
        const sortSelect = new StringSelectMenuBuilder()
            .setCustomId('server_list_sort')
            .setPlaceholder('Sort servers by...')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('Members (Default)')
                    .setDescription('Sort servers by member count')
                    .setValue('members')
                    .setDefault(sortMethod === 'members' || sortMethod === 'default'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Name')
                    .setDescription('Sort servers alphabetically')
                    .setValue('name')
                    .setDefault(sortMethod === 'name'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Server ID')
                    .setDescription('Sort servers by ID')
                    .setValue('id')
                    .setDefault(sortMethod === 'id'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Age')
                    .setDescription('Sort servers by creation date')
                    .setValue('age')
                    .setDefault(sortMethod === 'age'),
            ]);
            
        // Create action rows
        const buttonRow = new ActionRowBuilder().addComponents(prevBtn, stopBtn, nextBtn, refreshBtn);
        const selectRow = new ActionRowBuilder().addComponents(sortSelect);
        
        // Send the initial message
        const msg = await message.channel.send({
            embeds: [createEmbed(page)],
            components: [buttonRow, selectRow],
        });

        // Create collector for interactions
        const collector = message.channel.createMessageComponentCollector({
            filter: (interaction) => {
                if (interaction.user.id === message.author.id) return true;
                
                interaction.reply({
                    content: `❌ | Only developers can use these controls.`,
                    ephemeral: true
                });
                return false;
            },
            time: 300000, // 5 minutes
        });

        collector.on("collect", async (interaction) => {
            await interaction.deferUpdate().catch(() => {});
            
            if (interaction.customId === "server_list_next") {
                page = page + 1 < pages.length ? ++page : page;
            } 
            else if (interaction.customId === "server_list_prev") {
                page = page > 0 ? --page : page;
            } 
            else if (interaction.customId === "server_list_stop") {
                collector.stop("user_stopped");
                return;
            }
            else if (interaction.customId === "server_list_refresh") {
                // Re-run the command with same args
                await msg.delete().catch(() => {});
                return this.execute(message, args, client, prefix);
            }
            else if (interaction.customId === "server_list_sort") {
                const newSortMethod = interaction.values[0];
                await msg.delete().catch(() => {});
                
                // Re-run the command with the new sort method
                const newArgs = [`sort:${newSortMethod}`];
                if (searchTerm) newArgs.push(`search:${searchTerm}`);
                
                return this.execute(message, newArgs, client, prefix);
            }
            
            // Update buttons state
            const updatedButtons = new ActionRowBuilder().addComponents(
                prevBtn.setDisabled(page === 0),
                stopBtn,
                nextBtn.setDisabled(page === pages.length - 1),
                refreshBtn
            );
            
            // Update the message
            await msg.edit({
                embeds: [createEmbed(page)],
                components: [updatedButtons, selectRow]
            }).catch(() => {});
        });

        collector.on("end", async (_, reason) => {
            if (reason === "time" || reason === "user_stopped") {
                const disabledButtons = buttonRow.components.map(button => 
                    ButtonBuilder.from(button).setDisabled(true)
                );
                
                const disabledSelect = new StringSelectMenuBuilder()
                    .setCustomId('server_list_sort_disabled')
                    .setPlaceholder('Interaction timeout')
                    .setDisabled(true)
                    .addOptions([
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Session Expired')
                            .setValue('expired')
                    ]);
                
                await msg.edit({
                    components: [
                        new ActionRowBuilder().addComponents(disabledButtons),
                        new ActionRowBuilder().addComponents(disabledSelect)
                    ]
                }).catch(() => {});
            }
        });
    },
};