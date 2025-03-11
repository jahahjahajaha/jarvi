const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: "kiss",
    category: "Fun",
    description: "Kiss someone special 💋",
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
                        .setDescription('❌ | Please mention someone to kiss!')
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | You cannot kiss yourself!')
                ]
            });
        }

        try {
            const isNsfw = message.channel.nsfw;
            let gifUrl = null;
            
            // Try primary API (Waifu.pics)
            try {
                // Choose endpoint based on channel type - kiss has both SFW and NSFW versions
                const apiEndpoint = isNsfw ? 'https://api.waifu.pics/nsfw/kiss' : 'https://api.waifu.pics/sfw/kiss';
                const response = await fetch(apiEndpoint);
                const data = await response.json();
                
                if (data.url) {
                    gifUrl = data.url;
                    console.log(`Successfully fetched ${isNsfw ? 'NSFW' : 'SFW'} kiss GIF from primary API (Waifu.pics)`);
                }
            } catch (primaryError) {
                console.error("Primary API (Waifu.pics) error:", primaryError.message);
            }
            
            // If primary API failed, try backup API (Nekos.life)
            if (!gifUrl) {
                try {
                    // Nekos.life has only SFW kiss
                    const backupEndpoint = 'https://nekos.life/api/v2/img/kiss';
                    const backupResponse = await fetch(backupEndpoint);
                    const backupData = await backupResponse.json();
                    
                    if (backupData.url) {
                        gifUrl = backupData.url;
                        console.log("Successfully fetched kiss GIF from backup API (Nekos.life)");
                        
                        // Log a warning if user wanted NSFW but we're serving SFW
                        if (isNsfw) {
                            console.log("Warning: Serving SFW content on NSFW channel because backup API only has SFW content");
                        }
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
                .setDescription(`💋 | ${message.author} kisses ${target}`)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Kiss Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch kiss GIF!')
                ]
            });
        }
    }
};