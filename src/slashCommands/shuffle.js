const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current queue'),
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guild.id);
        
        if (!player) {
            return await interaction.reply({
                content: `${client.emoji.error} There is no music playing!`,
                ephemeral: true
            });
        }

        if (!interaction.member.voice.channel) {
            return await interaction.reply({
                content: `${client.emoji.error} You need to be in a voice channel!`,
                ephemeral: true
            });
        }

        if (!player.queue || !player.queue.length) {
            return await interaction.reply({
                content: `${client.emoji.error} Not enough songs in the queue to shuffle!`,
                ephemeral: true
            });
        }

        player.queue.shuffle();
        await interaction.reply({
            content: `${client.emoji.shuffle} Shuffled \`${player.queue.length}\` songs in the queue!`
        });
    },
};
