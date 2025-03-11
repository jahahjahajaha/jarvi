const { CommandInteraction, Client, EmbedBuilder } = require("discord.js");
const pre = require("../../schema/prefix.js");
const i18n = require("../../utils/i18n");

module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        // Process only if it's a command or context menu interaction
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            const slashCommand = client.slashCommands.get(interaction.commandName);
            if (!slashCommand) return;

            // Check voice channel requirements
            if (slashCommand.inVoiceChannel && !interaction.member.voice.channel) {
                return await interaction.reply({
                    content: `${client.emoji.error} You need to be in a voice channel!`,
                    ephemeral: true
                });
            }

            // Check same voice channel requirement
            if (slashCommand.sameVoiceChannel && interaction.guild.members.me.voice.channel) {
                if (interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
                    return await interaction.reply({
                        content: `${client.emoji.error} You must be in the same channel as ${interaction.client.user}!`,
                        ephemeral: true
                    });
                }
            }

            try {
                // Execute the command handler
                await slashCommand.execute(interaction, client);
            } catch (error) {
                console.error("Interaction Command Error:", error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: `${client.emoji.error} An error occurred while executing this command!` }).catch(() => {});
                } else {
                    await interaction.followUp({ content: `${client.emoji.error} An error occurred while executing this command!`, ephemeral: true }).catch(() => {});
                }
            }
        }
    }
};