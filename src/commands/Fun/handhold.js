const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: "handhold",
    category: "Fun",
    description: "Hold someone's hand 👫",
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
                        .setDescription('❌ | Please mention someone to hold hands with!')
                ]
            });
        }

        if (target.id === message.author.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | You cannot hold your own hand!')
                ]
            });
        }

        try {
            const isNsfw = message.channel.nsfw;
            let gifUrl = null;
            
            // Try primary API (Waifu.pics)
            try {
                // Waifu.pics has only SFW handhold
                const apiEndpoint = 'https://api.waifu.pics/sfw/handhold';
                const response = await fetch(apiEndpoint);
                const data = await response.json();
                
                if (data.url) {
                    gifUrl = data.url;
                    console.log("Successfully fetched handhold GIF from primary API (Waifu.pics)");
                }
            } catch (primaryError) {
                console.error("Primary API (Waifu.pics) error:", primaryError.message);
            }
            
            // No backup for handhold on Nekos.life, could add other APIs in the future
            
            // If API failed, throw error
            if (!gifUrl) {
                throw new Error('Failed to fetch GIF from all sources');
            }
            
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(`👫 | ${message.author} holds hands with ${target}`)
                .setImage(gifUrl);

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Handhold Command Error:', error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ | Failed to fetch handhold GIF!')
                ]
            });
        }
    }
};