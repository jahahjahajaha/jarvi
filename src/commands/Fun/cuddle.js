const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: "cuddle",
    category: "Fun",
    description: "Cuddle with someone special 🤗",
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
                        .setDescription('❌ | Please mention someone to cuddle with!')
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | You cannot cuddle yourself!')
                ]
            });
        }

        try {
            const isNsfw = message.channel.nsfw;
            let gifUrl = null;
            
            // Try primary API (Waifu.pics)
            try {
                const apiEndpoint = 'https://api.waifu.pics/sfw/cuddle';
                const response = await fetch(apiEndpoint);
                const data = await response.json();
                
                if (data.url) {
                    gifUrl = data.url;
                    console.log("Successfully fetched cuddle GIF from primary API (Waifu.pics)");
                }
            } catch (primaryError) {
                console.error("Primary API (Waifu.pics) error:", primaryError.message);
            }
            
            // If primary API failed, try backup API (Nekos.life)
            if (!gifUrl) {
                try {
                    const backupEndpoint = 'https://nekos.life/api/v2/img/cuddle';
                    const backupResponse = await fetch(backupEndpoint);
                    const backupData = await backupResponse.json();
                    
                    if (backupData.url) {
                        gifUrl = backupData.url;
                        console.log("Successfully fetched cuddle GIF from backup API (Nekos.life)");
                    }
                } catch (backupError) {
                    console.error("Backup API (Nekos.life) error:", backupError.message);
                }
            }
            
            // If both APIs failed, throw error
            if (!gifUrl) {
                throw new Error('Failed to fetch GIF from all sources');
            }
            
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(`🤗 | ${message.author} cuddles with ${target}`)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Cuddle Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch cuddle GIF!')
                ]
            });
        }
    }
};