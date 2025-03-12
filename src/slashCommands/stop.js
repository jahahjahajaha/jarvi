const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music playback and clears the queue'),
    
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guild.id);
        
        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setDescription(`❌ | There is no music playing in this server.`)
                ],
                ephemeral: true
            });
        }
        
        const { channel } = interaction.member.voice;
        
        if (!channel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setDescription(`❌ | You must be in a voice channel to use this command.`)
                ],
                ephemeral: true
            });
        }
        
        if (channel.id !== player.voiceChannel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setDescription(`❌ | You must be in the same voice channel as the bot to use this command.`)
                ],
                ephemeral: true
            });
        }
        
        player.destroy();
        
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setDescription(`🛑 | Stopped the music and cleared the queue.`)
            ]
        });
    }
};