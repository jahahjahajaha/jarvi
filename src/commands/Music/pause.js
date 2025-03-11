const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "pause",
    category: "Music",
    aliases: ["ps"],
    description: "⏸️ Pause the currently playing music.",
    args: false,
    usage: "",
    permission: [],
    owner: false,
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,

    execute: async (message, args, client, prefix) => {
        const player = client.manager.get(message.guild.id);

        if (!player || !player.queue.current) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setDescription("❌ | There is no music playing to pause."),
                ],
            });
        }

        if (player.paused) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setDescription(`<a:Chec_kmark:1340583433298251846> | The music is already paused.`),
                ],
            });
        }

        player.pause(true);

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setDescription(`<a:Chec_kmark:1340583433298251846> | Successfully paused the current song.`)
                    .setFooter({ text: `Use the ${prefix}rs command to resume!` })
                    .setTimestamp(),
            ],
        });
    },
};