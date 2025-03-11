const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "join",
  aliases: ["j"],
  category: "Music",
  description: "🎶 Makes the bot join your voice channel.",
  args: false,
  usage: "",
  permission: [],
  owner: false,
  player: false,
  inVoiceChannel: true,
  sameVoiceChannel: false,

  execute: async (message, args, client, prefix) => {
    const { channel } = message.member.voice;
    const botMember = message.guild.members.me;
    const botChannel = botMember.voice.channel;

    // Check bot's permission to join and speak
    if (!botMember.permissions.has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              "🚫 | **I don't have permission to join or speak in voice channels.**\nPlease grant me `CONNECT` & `SPEAK` permissions."
            ),
        ],
      });
    }

    if (!channel.permissionsFor(botMember).has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `🚫 | **I lack the permissions to join your voice channel.**\nEnsure I have \`CONNECT\` & \`SPEAK\` permissions in <#${channel.id}>.`
            ),
        ],
      });
    }

    // If bot is already in a different channel
    if (botChannel && botChannel.id !== channel.id) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(
              `❌ | **You must be in the same voice channel as ${client.user}.**\n\n🔹 I am currently in: **<#${botChannel.id}>**\n👉 Please join that voice channel **(<#${botChannel.id}>)** to control me!`
            ),
        ],
      });
    }

    // Create a player and connect
    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: channel.id,
      textChannel: message.channel.id,
      volume: 80,
      selfDeafen: true,
    });

    player.connect();

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.embedColor)
          .setDescription(
            `<a:Chec_kmark:1340583433298251846> | **Successfully joined <#${channel.id}>!**`
          ),
      ],
    });
  },
};