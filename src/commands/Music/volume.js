const { EmbedBuilder } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.vol.name"),
  aliases: i18n.__("cmd.vol.aliases"),
  category: "Music",
  description: i18n.__("cmd.vol.des"),
  args: false,
  usage: i18n.__("cmd.vol.use"),
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

      const currentVolume = player.volume;
      const volume = Number(args[0]);

      if (!args.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.embedColor)
              .setDescription(`<:Speaker:1342222399780687894> | **Current volume is ${currentVolume}%**`),
          ],
        });
      }

      if (isNaN(volume) || volume < 0 || volume > 100) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription(`<a:No_no_no:1341819205187797044> | **Please provide a valid volume between 0 and 100.**`),
          ],
        });
      }

      player.setVolume(volume);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `${volume > currentVolume ? "<:Up_arrow:1342213440420450476>" : "<:Down_arrow:1342213432484827197>"} | **Volume set to ${volume}%**`
            ),
        ],
      });
    } catch (error) {
      console.error("Volume Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:cross_gif:1342050022954373121> | **An error occurred while changing the volume.**"),
        ],
      });
    }
  },
};