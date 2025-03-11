const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: "sex",
    category: "Fun",
    description: "Intimate interaction with someone 💘 (SFW/NSFW based on channel)",
    args: true,
    usage: "<@user>",
    permission: [],
    owner: false,
    execute: async (message, args, client) => {
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Please mention someone!')
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | You cannot use this command on yourself!')
                ]
            });
        }

        try {
            // Check if channel is NSFW to determine content type
            const isNsfw = message.channel.nsfw;
            let gifUrl = null;
            
            if (isNsfw) {
                // NSFW content for NSFW channels
                
                // Try primary API (Waifu.pics) for NSFW content
                try {
                    const apiEndpoint = 'https://api.waifu.pics/nsfw/waifu'; // NSFW endpoint
                    const response = await fetch(apiEndpoint);
                    const data = await response.json();
                    
                    if (data.url) {
                        gifUrl = data.url;
                        console.log("Successfully fetched NSFW content from primary API (Waifu.pics)");
                    }
                } catch (primaryError) {
                    console.error("Primary API (Waifu.pics) NSFW error:", primaryError.message);
                }
                
                // If primary API failed, try backup API
                if (!gifUrl) {
                    try {
                        const backupEndpoint = 'https://nekos.life/api/v2/img/lewd'; // NSFW content from Nekos.life
                        const backupResponse = await fetch(backupEndpoint);
                        const backupData = await backupResponse.json();
                        
                        if (backupData.url) {
                            gifUrl = backupData.url;
                            console.log("Successfully fetched NSFW content from backup API (Nekos.life)");
                        }
                    } catch (backupError) {
                        console.error("Backup API (Nekos.life) NSFW error:", backupError.message);
                    }
                }
            } else {
                // SFW content for regular channels
                
                // Try primary API for SFW content
                try {
                    const apiEndpoint = 'https://api.waifu.pics/sfw/hug'; // SFW alternative (hug)
                    const response = await fetch(apiEndpoint);
                    const data = await response.json();
                    
                    if (data.url) {
                        gifUrl = data.url;
                        console.log("Successfully fetched SFW content from primary API (Waifu.pics)");
                    }
                } catch (primaryError) {
                    console.error("Primary API (Waifu.pics) SFW error:", primaryError.message);
                }
                
                // If primary API failed, try backup API
                if (!gifUrl) {
                    try {
                        const backupEndpoint = 'https://nekos.life/api/v2/img/cuddle'; // SFW content from Nekos.life
                        const backupResponse = await fetch(backupEndpoint);
                        const backupData = await backupResponse.json();
                        
                        if (backupData.url) {
                            gifUrl = backupData.url;
                            console.log("Successfully fetched SFW content from backup API (Nekos.life)");
                        }
                    } catch (backupError) {
                        console.error("Backup API (Nekos.life) SFW error:", backupError.message);
                    }
                }
            }
            
            // If both APIs failed, throw error
            if (!gifUrl) {
                throw new Error('Failed to fetch content from all sources');
            }
            
            // Create appropriate message based on channel type
            let description;
            
            if (isNsfw) {
                description = `🔞 | ${message.author} and ${target} are having a good time...`;
            } else {
                description = `💘 | ${message.author} and ${target} are cuddling...`;
            }
            
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(description)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Sex Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch content!')
                ]
            });
        }
    }
};