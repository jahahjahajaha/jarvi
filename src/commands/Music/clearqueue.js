const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "clearqueue",
  aliases: ["cq"],
  category: "Music",
  description: "🎶 Clears the entire music queue.",
  args: false,
  usage: "",
  permission: [],
  owner: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    const player = client.manager.get(message.guild.id);

    if (!player || !player.queue.current) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("RED")
            .setDescription("❌ | **There is no active queue to clear!**"),
        ],
      });
    }

    // Clear the queue
    const queueSize = player.queue.length;
    player.queue.clear();

    const embed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setDescription(
        `<:Song_removed:1341822080836178012> | **Successfully removed \`${queueSize}\` songs from the queue!**`
      )
      

    return message.reply({ embeds: [embed] });
  },
};