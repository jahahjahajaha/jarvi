const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { convertTime } = require("../../utils/convert.js");

module.exports = {
  name: "play",
  category: "Music",
  aliases: ["p", "music", "m"],
  description: "<a:Play:1342000604242776094> Play a song or playlist in your voice channel.",
  args: true,
  usage: "<song name / URL>",
  permission: [],
  owner: false,
  botonly: false,
  player: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    // Check if user is in a voice channel
    const { channel } = message.member.voice;
    if (!channel) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<:Mic:1342001835510206515> | **You need to be in a voice channel to play music!**"),
        ],
      });
    }

    // Check bot permissions safely
    const botMember = message.guild.members.me;
    const permissions = channel.permissionsFor(botMember);
    if (!permissions) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:Mic_blocked_gif:1342003041301168160> | **I don't have permission to view the voice channel!**"),
        ],
      });
    }

    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:Mic_blocked_gif:1342003041301168160> | **I don't have permission to connect or speak in this voice channel!**"),
        ],
      });
    }

    // Create or get player
    let player = client.manager.get(message.guild.id);
    if (!player) {
      player = client.manager.create({
        guild: message.guild.id,
        voiceChannel: channel.id,
        textChannel: message.channel.id,
        selfDeafen: true,
        volume: 80,
      });
    }

    try {
      if (player.state !== "CONNECTED") await player.connect();

      // Server mute check with proper error handling
      if (botMember?.voice?.serverMute) {
        if (botMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
          await botMember.voice.setMute(false);
        } else {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setDescription("<a:Mic_blocked_gif:1342003041301168160> | **I am server muted! Please ask a moderator to unmute me.**"),
            ],
          });
        }
      }

      const search = args.join(" ");
      const searchMsg = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFFF00")
            .setDescription("<a:Searching_heart_gif:1341964524537778208> | **Searching for:** `" + search + "`"),
        ],
      });

      let res;
      try {
        res = await player.search(search, message.author);
        if (!res || !res.tracks.length) {
          return searchMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setDescription("<:Scrach_result_not_found:1341953767423348746> | **No matches found!**"),
            ],
          });
        }
      } catch (err) {
        console.error("Search Error:", err);
        return searchMsg.edit(`❌ | **Error while searching:** ${err.message}`);
      }

      switch (res.loadType) {
        case "TRACK_LOADED":
          player.queue.add(res.tracks[0]);
          if (!player.playing && !player.paused && !player.queue.size) {
            player.play();
          }
          searchMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("<:Song_add_in_queue:1341967211790860331> Added to Queue")
                .setDescription(`**[${res.tracks[0].title}](${res.tracks[0].uri})** - \`${convertTime(res.tracks[0].duration)}\``)
                .setThumbnail(res.tracks[0].thumbnail)
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            ],
          });
          break;

        case "PLAYLIST_LOADED":
          player.queue.add(res.tracks);
          if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) {
            player.play();
          }
          searchMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("<:Playlist_add:1341976109037649991> Playlist Added")
                .setDescription(`**[${res.playlist.name}](${search})** - \`${convertTime(res.playlist.duration)}\``)
                .setFooter({ text: `Total songs: ${res.tracks.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            ],
          });
          break;

        case "SEARCH_RESULT":
          player.queue.add(res.tracks[0]);
          if (!player.playing && !player.paused && !player.queue.size) {
            player.play();
          }
          searchMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("<:Song_add_in_queue:1341967211790860331> Added to Queue")
                .setDescription(`**[${res.tracks[0].title}](${res.tracks[0].uri})** - \`${convertTime(res.tracks[0].duration)}\``)
                .setThumbnail(res.tracks[0].thumbnail)
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            ],
          });
          break;

        default:
          return searchMsg.edit("❌ | Unexpected error. Please try again.");
      }
    } catch (error) {
      console.error("Play Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<a:cross_gif:1342050022954373121> | **An error occurred while playing the music.**"),
        ],
      });
    }
  },
};