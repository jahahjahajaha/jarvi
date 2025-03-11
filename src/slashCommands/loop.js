const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set loop mode for the current song or queue')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Loop mode to set')
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Song', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )),
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

        const mode = interaction.options.getString('mode');

        switch (mode) {
            case 'off':
                player.setTrackRepeat(false);
                player.setQueueRepeat(false);
                await interaction.reply({
                    content: `${client.emoji.success} Loop mode is now \`Off\`!`
                });
                break;
            case 'track':
                player.setTrackRepeat(true);
                player.setQueueRepeat(false);
                await interaction.reply({
                    content: `${client.emoji.loop} Now looping the current \`Track\`!`
                });
                break;
            case 'queue':
                player.setTrackRepeat(false);
                player.setQueueRepeat(true);
                await interaction.reply({
                    content: `${client.emoji.loop} Now looping the entire \`Queue\`!`
                });
                break;
        }
    },
};