const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: "hug",
    category: "Fun",
    description: "Give someone a hug 💕",
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
                        .setDescription('❌ | You cannot hug yourself! Mention someone else.')
                ]
            });
        }

        try {
            let gifUrl = null;
            
            // Try primary API for SFW content
            try {
                const apiEndpoint = 'https://api.waifu.pics/sfw/hug';
                const response = await fetch(apiEndpoint);
                const data = await response.json();
                
                if (data.url) {
                    gifUrl = data.url;
                    console.log("Successfully fetched hug content from primary API (Waifu.pics)");
                }
            } catch (primaryError) {
                console.error("Primary API (Waifu.pics) error:", primaryError.message);
            }
            
            // If primary API failed, try backup API
            if (!gifUrl) {
                try {
                    const backupEndpoint = 'https://nekos.life/api/v2/img/hug';
                    const backupResponse = await fetch(backupEndpoint);
                    const backupData = await backupResponse.json();
                    
                    if (backupData.url) {
                        gifUrl = backupData.url;
                        console.log("Successfully fetched hug content from backup API (Nekos.life)");
                    }
                } catch (backupError) {
                    console.error("Backup API (Nekos.life) error:", backupError.message);
                }
            }
            
            // If both APIs failed, throw error
            if (!gifUrl) {
                throw new Error('Failed to fetch content from all sources');
            }
            
            const description = `💕 | ${message.author} gives ${target} a warm hug!`;
            
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(description)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Hug Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch hug content!')
                ]
            });
        }
    }
};