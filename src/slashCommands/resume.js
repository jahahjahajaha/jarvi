const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),
    async execute(interaction, client) {
        const player = client.manager.get(interaction.guild.id);
        
        if (!player) {
            return await interaction.reply({ content: 'No music is playing!', ephemeral: true });
        }

        if (!interaction.member.voice.channel) {
            return await interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
        }

        if (!player.paused) {
            return await interaction.reply({ content: 'The music is not paused!', ephemeral: true });
        }

        player.pause(false);
        await interaction.reply({ content: '▶ Resumed the music!' });
    },
};
