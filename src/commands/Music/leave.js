const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "leave",
  aliases: ["dc", "disconnect", "lv"],
  category: "Music",
  description: "🎶 Disconnect the bot from the voice channel.",
  args: false,
  usage: "",
  permission: [],
  owner: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    const player = client.manager.get(message.guild.id);
    const { channel } = message.member.voice;
    const botChannel = message.guild.members.me.voice.channel;

    // Check if bot is in a voice channel
    if (!botChannel) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("❌ | **I'm not connected to any voice channel!**"),
        ],
      });
    }

    // Ensure the user is in the same voice channel as the bot
    if (botChannel.id !== channel.id) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(
              `<a:No_no_no:1341819205187797044> | **You must be in the same voice channel as me to use this command!**\n🔹 **I am currently in:** <#${botChannel.id}>`
            ),
        ],
      });
    }

    // Destroy the player and disconnect the bot
    player.destroy();

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.embedColor)
          .setDescription(
            `<a:disappear_with_heart:1341840907615469600> | **Successfully disconnected from <#${channel.id}>!**`
          ),
      ],
    });
  },
};