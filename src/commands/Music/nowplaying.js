require("dotenv").config();
const { EmbedBuilder } = require("discord.js");
const { convertTime } = require("../../utils/convert.js");

module.exports = {
  name: "nowplaying",
  aliases: ["np"],
  category: "Music",
  description: "🎵 Show details about the currently playing song.",
  args: false,
  usage: "",
  permission: [],
  owner: false,
  player: true,
  inVoiceChannel: false,
  sameVoiceChannel: false,

  execute: async (message, args, client, prefix) => {
    const player = message.client.manager.get(message.guild.id);

    if (!player || !player.queue.current) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:cross:1342050022954373121> | **No music is currently playing!**"),
        ],
      });
    }

    const song = player.queue.current;
    const songURL = song.uri || `https://www.youtube.com/watch?v=${song.identifier}`;
    const songThumbnail = song.thumbnail || `https://img.youtube.com/vi/${song.identifier}/maxresdefault.jpg`;
    
    // Safely get the requester
    const requesterID = song.requester?.id;
    const requester = requesterID ? client.users.cache.get(requesterID) : client.user;
    const requesterAvatar = requester.displayAvatarURL({ dynamic: true, size: 1024 });
    const current = player.position;
    const total = song.duration;
    const progress = `\`${convertTime(current)} / ${convertTime(total)}\``;

    const embed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setAuthor({ 
          name: "Now Playing...", 
          iconURL: "https://cdn.discordapp.com/attachments/1288526364286255124/1342190103824437261/uEwUiCNmNP6ATa1c7P.gif?ex=67c14d31&is=67bffbb1&hm=83ffb7827de7b7628598d700bdc090e9d5f1ec94af984d3788320dc63f91eb5f&"
      })
      .setTitle(song.title)
      .setURL(songURL)
      .setThumbnail(requesterAvatar)
      .setImage(songThumbnail)
      .addFields(
        { name: "<a:Progress_gif:1341843608327950411> **Progress**", value: progress, inline: true },
        { name: "🎤 **Artist**", value: song.author || "Unknown", inline: true },
        { name: "⏰ **Requested by**", value: `${requester} | ${requester.globalName || requester.username}`, inline: true },
        { name: "<a:Link:1341469206478061589> **Song Link**", value: `[Click here to listen](${songURL})`, inline: false }
      )
      .setFooter({
        text: `Requested by: ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });

    return message.reply({ embeds: [embed] });
  },
};