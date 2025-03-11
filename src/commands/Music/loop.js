const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "loop",
  aliases: ["l", "lp"],
  category: "Music",
  description: "🎶 Toggle looping for the current track or entire queue.",
  args: false,
  usage: "[track | queue | off]",
  permission: [],
  owner: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    const player = client.manager.get(message.guild.id);

    if (!player.queue.current) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("❌ | **There is no music playing right now!**"),
        ],
      });
    }

    // Loop Emojis
    const loopEmoji = "<a:infinite_gif:1341844261003460618>"; 
    const stopEmoji = "<:Stop:1341845529109463091>";

    // Handle loop modes
    if (args.length) {
      if (/queue/i.test(args[0])) {
        player.setQueueRepeat(!player.queueRepeat);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.embedColor)
              .setDescription(
                `${loopEmoji} | **Queue loop is now** \`${player.queueRepeat ? "enabled" : "disabled"}\``
              ),
          ],
        });
      } else if (/off/i.test(args[0])) {
        player.setTrackRepeat(false);
        player.setQueueRepeat(false);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.embedColor)
              .setDescription(
                `${stopEmoji} | **Looping has been disabled for both track & queue!**`
              ),
          ],
        });
      } else {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription(
                "❌ | **Invalid option!**\nUse: `" +
                  prefix +
                  "loop [track | queue | off]`"
              ),
          ],
        });
      }
    }

    // Default: Toggle track loop
    player.setTrackRepeat(!player.trackRepeat);
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.embedColor)
          .setDescription(
            `${loopEmoji} | **Track loop is now** \`${player.trackRepeat ? "enabled" : "disabled"}\``
          ),
      ],
    });
  },
};