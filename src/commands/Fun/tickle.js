const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Get a tickle GIF URL from multiple APIs
 * Uses multiple sources for better reliability
 * @returns {Promise<string|null>} - GIF URL or null if all APIs fail
 */
async function getTickleGif() {
    const apis = [
        // Primary API - Waifu.pics
        {
            url: 'https://api.waifu.pics/sfw/tickle',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Waifu.pics'
        },
        // Backup API - Nekos.life
        {
            url: 'https://nekos.life/api/v2/img/tickle',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'Nekos.life'
        },
        // Another backup API - anime-api
        {
            url: 'https://anime-api.hisoka17.repl.co/img/tickle',
            handler: async (response) => {
                const data = await response.json();
                return data.url;
            },
            name: 'anime-api'
        },
        // Another backup - purrbot api
        {
            url: 'https://purrbot.site/api/img/sfw/tickle/gif',
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
                    console.log(`Successfully fetched tickle GIF from ${api.name}`);
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
    name: "tickle",
    category: "Fun",
    description: "Tickle someone to make them laugh 😆",
    args: true,
    aliases: ["tickles", "tickling", "coochiecoochie", "kitchikitchi"],
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
                        .setDescription('❌ | Please mention someone to tickle!')
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | You cannot tickle yourself!')
                ]
            });
        }

        try {
            // Get a GIF from one of our API sources
            const gifUrl = await getTickleGif();
            
            // If no GIF URL found, throw error
            if (!gifUrl) {
                throw new Error('Failed to fetch GIF from all sources');
            }
            
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(`😆 | ${message.author} tickles ${target}`)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Tickle Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch tickle GIF!')
                ]
            });
        }
    }
};