const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the player volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level between 0-100')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),
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

        const volume = interaction.options.getInteger('level');
        player.setVolume(volume);

        let volumeEmoji;
        if (volume === 0) volumeEmoji = client.emoji.mute;
        else if (volume < 40) volumeEmoji = client.emoji.volumelow;
        else if (volume < 70) volumeEmoji = client.emoji.volumemiddle;
        else volumeEmoji = client.emoji.volumehigh;

        await interaction.reply({
            content: `${volumeEmoji} Volume set to \`${volume}%\`!`
        });
    },
};
