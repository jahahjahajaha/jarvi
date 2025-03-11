const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),
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

        player.destroy();
        await interaction.reply({
            content: `${client.emoji.stop} Stopped the music and cleared the queue!`
        });
    },
};
