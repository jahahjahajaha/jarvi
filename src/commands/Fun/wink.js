const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: "wink",
    category: "Fun",
    description: "Wink at someone 😉",
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
                        .setDescription('❌ | Please mention someone to wink at!')
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | You cannot wink at yourself!')
                ]
            });
        }

        try {
            let gifUrl = null;
            
            // Try Waifu.pics API first
            try {
                const apiEndpoint = 'https://api.waifu.pics/sfw/wink';
                const response = await fetch(apiEndpoint);
                const data = await response.json();
                
                if (data.url) {
                    gifUrl = data.url;
                    console.log("Successfully fetched wink GIF from Waifu.pics API");
                }
            } catch (primaryError) {
                console.error("Waifu.pics API error:", primaryError.message);
            }
            
            // If first API failed, try another API
            if (!gifUrl) {
                try {
                    // Note: Nekos.life doesn't have a wink endpoint, so using a public API that provides anime wink GIFs
                    const backupEndpoint = 'https://nekos.life/api/v2/img/smug'; // Using smug as fallback since wink isn't available
                    const backupResponse = await fetch(backupEndpoint);
                    const backupData = await backupResponse.json();
                    
                    if (backupData.url) {
                        gifUrl = backupData.url;
                        console.log("Successfully fetched alternative GIF from backup API");
                    }
                } catch (backupError) {
                    console.error("Backup API error:", backupError.message);
                }
            }
            
            // If both APIs failed, throw error
            if (!gifUrl) {
                throw new Error('Failed to fetch GIF from all sources');
            }
            
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(`😉 | ${message.author} winks at ${target}`)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Wink Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch wink GIF!')
                ]
            });
        }
    }
};