const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Get a kiss GIF URL from multiple APIs
 * Supports both SFW and NSFW endpoints (if channel is NSFW)
 * Uses multiple API sources for better reliability
 * @param {boolean} isNsfw - Whether to get NSFW content (if available)
 * @returns {Promise<string|null>} - GIF URL or null if all APIs fail
 */
async function getKissGif(isNsfw = false) {
    const apis = [
        // Primary API - Waifu.pics (has both SFW and NSFW)
        {
            url: isNsfw ? 'https://api.waifu.pics/nsfw/kiss' : 'https://api.waifu.pics/sfw/kiss',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Waifu.pics'
        },
        // Backup API - Nekos.life (SFW only)
        {
            url: 'https://nekos.life/api/v2/img/kiss',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Nekos.life'
        },
        // Another backup API - anime-api (SFW only)
        {
            url: 'https://anime-api.hisoka17.repl.co/img/kiss',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'anime-api'
        },
        // Additional backup - Some-Random-API (SFW only)
        {
            url: 'https://some-random-api.ml/animu/kiss',
            handler: async (response) => {
                const data = await response.json();
                return data.link;
            },
            name: 'Some-Random-API'
        }
    ];
    
    // Try each API until we get a valid URL
    for (const api of apis) {
        try {
            const response = await fetch(api.url);
            if (response.ok) {
                const url = await api.handler(response);
                if (url) {
                    console.log(`Successfully fetched kiss GIF from ${api.name}`);
                    return url;
                }
            }
        } catch (error) {
            console.error(`${api.name} API error:`, error.message);
        }
    }
    
    // If all APIs failed, return null
    return null;
}

module.exports = {
    name: "kiss",
    category: "Fun",
    description: "Kiss someone special 💋",
    args: true,
    aliases: ["smooch", "kissu", "chu", "peck"],
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
            
            // Get a GIF from one of our API sources
            const gifUrl = await getKissGif(isNsfw);
            
            // If no GIF URL found, throw error
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