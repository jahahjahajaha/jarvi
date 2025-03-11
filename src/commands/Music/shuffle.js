const { EmbedBuilder } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.shuffle.name"),
  category: "Music",
  description: i18n.__("cmd.shuffle.des"),
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
              .setDescription("<a:Cross_mark:1340583476762646609> | **There is no music playing currently!**"),
          ],
        });
      }

      if (player.queue.length < 2) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFFF00")
              .setDescription("⚠️ | **You need at least 2 songs in the queue to shuffle!**"),
          ],
        });
      }

      player.queue.shuffle();

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription("<a:shuffle_gif:1342003472564109412> | **Successfully shuffled the queue!**"),
        ],
      });
    } catch (error) {
      console.error("Shuffle Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:Cross_mark:1340583476762646609> | **An unexpected error occurred while shuffling.**"),
        ],
      });
    }
  },
};