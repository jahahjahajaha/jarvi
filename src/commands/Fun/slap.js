const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Get a slap GIF URL from multiple APIs
 * Uses multiple sources for better reliability
 * @returns {Promise<string|null>} - GIF URL or null if all APIs fail
 */
async function getSlapGif() {
    const apis = [
        // Primary API - Waifu.pics
        {
            url: 'https://api.waifu.pics/sfw/slap',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Waifu.pics'
        },
        // Backup API - Nekos.life
        {
            url: 'https://nekos.life/api/v2/img/slap',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Nekos.life'
        },
        // Another backup API - Some-Random-API
        {
            url: 'https://some-random-api.ml/animu/slap',
            handler: async (response) => {
                const data = await response.json();
                return data.link;
            },
            name: 'Some-Random-API'
        },
        // Another backup API - anime-api
        {
            url: 'https://anime-api.hisoka17.repl.co/img/slap',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'anime-api'
        },
        // Another backup - purrbot api
        {
            url: 'https://purrbot.site/api/img/sfw/slap/gif',
            handler: async (response) => {
                const data = await response.json();
                return data.link;
            },
            name: 'Purrbot API'
        }
    ];
    
    // Try each API until we get a valid URL
    for (const api of apis) {
        try {
            const response = await fetch(api.url);
            if (response.ok) {
                const url = await api.handler(response);
                if (url) {
                    console.log(`Successfully fetched slap GIF from ${api.name}`);
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
    name: "slap",
    category: "Fun",
    description: "Slap someone who deserves it 👋",
    args: true,
    aliases: ["smack", "hit", "whack", "spank"],
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
                        .setDescription('❌ | Please mention someone to slap!')
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | You cannot slap yourself!')
                ]
            });
        }

        try {
            // Get a GIF from one of our API sources
            const gifUrl = await getSlapGif();
            
            // If no GIF URL found, throw error
            if (!gifUrl) {
                throw new Error('Failed to fetch GIF from all sources');
            }
            
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(`👋 | ${message.author} slapped ${target}`)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Slap Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch slap GIF!')
                ]
            });
        }
    }
};