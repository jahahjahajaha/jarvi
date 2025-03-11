const { EmbedBuilder } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.247.name"),
  aliases: [...i18n.__("cmd.247.aliases"), "24"],
  category: "Music",
  description: i18n.__("cmd.247.des"),
  args: false,
  usage: "",
  permission: [],
  owner: false,
  voteonly: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    const player = client.manager.players.get(message.guild.id);

    if (!player) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription("❌ | No active player found in this server!"),
        ],
      });
    }

    // Toggle 24/7 mode
    player.twentyFourSeven = !player.twentyFourSeven;

    const embed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setDescription(
        player.twentyFourSeven
          ? "<a:Check_mark:1340583433298251846> | **24/7 Mode** is now **enabled** in this server."
          : "<a:Check_mark:1340583433298251846> | **24/7 Mode** is now **disabled** in this server."
      )
      

    return message.reply({ embeds: [embed] });
  },
};