const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply audio filters to the music')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter type to apply')
                .setRequired(true)
                .addChoices(
                    { name: 'Nightcore', value: 'nightcore' },
                    { name: 'Bassboost', value: 'bassboost' },
                    { name: '8D', value: '8d' },
                    { name: 'Vaporwave', value: 'vaporwave' },
                    { name: 'Speed', value: 'speed' },
                    { name: 'Distortion', value: 'distortion' },
                    { name: 'Clear', value: 'clear' }
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

        const filter = interaction.options.getString('type');

        await interaction.deferReply();

        try {
            switch (filter) {
                case 'nightcore':
                    player.setNightcore(!player.nightcore);
                    await interaction.editReply({
                        content: `${client.emoji.filter} ${player.nightcore ? 'Enabled' : 'Disabled'} \`Nightcore\` filter!`
                    });
                    break;
                case 'bassboost':
                    player.setBassboost(!player.bassboost);
                    await interaction.editReply({
                        content: `${client.emoji.filter} ${player.bassboost ? 'Enabled' : 'Disabled'} \`Bassboost\` filter!`
                    });
                    break;
                case '8d':
                    player.set8D(!player._8d);
                    await interaction.editReply({
                        content: `${client.emoji.filter} ${player._8d ? 'Enabled' : 'Disabled'} \`8D\` filter!`
                    });
                    break;
                case 'vaporwave':
                    player.setVaporwave(!player.vaporwave);
                    await interaction.editReply({
                        content: `${client.emoji.filter} ${player.vaporwave ? 'Enabled' : 'Disabled'} \`Vaporwave\` filter!`
                    });
                    break;
                case 'speed':
                    if (player.speed === 1) player.setSpeed(1.5);
                    else player.setSpeed(1);
                    await interaction.editReply({
                        content: `${client.emoji.filter} ${player.speed !== 1 ? 'Enabled' : 'Disabled'} \`Speed\` filter!`
                    });
                    break;
                case 'distortion':
                    player.setDistortion(!player.distortion);
                    await interaction.editReply({
                        content: `${client.emoji.filter} ${player.distortion ? 'Enabled' : 'Disabled'} \`Distortion\` filter!`
                    });
                    break;
                case 'clear':
                    player.clearEffects();
                    await interaction.editReply({
                        content: `${client.emoji.success} Cleared all filters!`
                    });
                    break;
            }
        } catch (error) {
            console.error("Filter Command Error:", error);
            await interaction.editReply({
                content: `${client.emoji.error} An error occurred while applying the filter!`,
                ephemeral: true
            });
        }
    },
};