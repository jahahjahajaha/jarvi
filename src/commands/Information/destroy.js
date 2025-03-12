const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "destroy",
  aliases: ["ds", "reset", "dt"],
  category: "Music",
  description: "🛠️ Fixes the music player by destroying it.",
  args: false,
  usage: "",
  permission: [],
  owner: false,
  voteonly: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    const player = message.client.manager.get(message.guild.id);
    const { channel } = message.member.voice;

    // If there is no active player
    if (!player) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(
              "❌ | **No active music session found!**\nThere's nothing to destroy."
            ),
        ],
      });
    }

    // Destroy the player and provide feedback
    player.destroy();

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.embedColor)
          .setAuthor({
            name: "| Music Player Destroyed",
            iconURL:
              "https://cdn.discordapp.com/emojis/1340218134497464392.png",
          })
          .setDescription(
            `<a:Chec_kmark:1340583433298251846> | **Successfully reset the player in** <#${channel.id}>.\nYou can start playing music again! 🎶`
          ),
      ],
    });
  },
};