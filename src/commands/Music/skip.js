const { EmbedBuilder } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.skip.name"),
  aliases: ["s", "next", "skp"],
  category: "Music",
  description: i18n.__("cmd.skip.des"),
  args: false,
  usage: "",
  permission: [],
  owner: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    try {
      const player = client.manager.get(message.guild.id);

      if (!player || !player.queue.current) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription("<a:cross_gif:1342050022954373121> | **There is no music playing currently!**"),
          ],
        });
      }

      const currentSong = player.queue.current;
      player.stop();

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(`<:End_or_skip:1342005854777507892> | **Skipped:** [${currentSong.title}](${currentSong.uri})`)
        ],
      }); // Removed auto-delete
    } catch (error) {
      console.error("Skip Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:cross_gif:1342050022954373121> | **An error occurred while skipping.**"),
        ],
      });
    }
  },
};