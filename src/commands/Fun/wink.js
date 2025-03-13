const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Get a wink GIF URL from multiple APIs
 * Uses multiple sources for better reliability
 * @returns {Promise<string|null>} - GIF URL or null if all APIs fail
 */
async function getWinkGif() {
    const apis = [
        // Primary API - Waifu.pics
        {
            url: 'https://api.waifu.pics/sfw/wink',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Waifu.pics'
        },
        // Another API - Some-Random-API
        {
            url: 'https://some-random-api.ml/animu/wink',
            handler: async (response) => {
                const data = await response.json();
                return data.link;
            },
            name: 'Some-Random-API'
        },
        // Note: Nekos.life doesn't have a wink endpoint so we use smug as a backup
        {
            url: 'https://nekos.life/api/v2/img/smug',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Nekos.life (smug fallback)'
        },
        // Another backup API - anime-api
        {
            url: 'https://anime-api.hisoka17.repl.co/img/wink',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'anime-api'
        }
    ];
    
    // Try each API until we get a valid URL
    for (const api of apis) {
        try {
            const response = await fetch(api.url);
            if (response.ok) {
                const url = await api.handler(response);
                if (url) {
                    console.log(`Successfully fetched wink GIF from ${api.name}`);
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
    name: "wink",
    category: "Fun",
    description: "Wink at someone 😉",
    args: true,
    aliases: ["blink", "eyewink", "flirt", "winkwink"],
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
            // Get a GIF from one of our API sources
            const gifUrl = await getWinkGif();
            
            // If no GIF URL found, throw error
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