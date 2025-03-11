const { EmbedBuilder } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.stop.name"),
  category: "Music",
  description: i18n.__("cmd.stop.des"),
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

      if (player.get("autoplay")) {
        player.set("autoplay", false);
      }

      player.stop();
      player.queue.clear();

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription("<:Stop_1:1342000640767037461> | **Music has been stopped and queue has been cleared.**")
        ],
      });
    } catch (error) {
      console.error("Stop Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:cross_gif:1342050022954373121> | **An error occurred while stopping the music.**"),
        ],
      });
    }
  },
};