const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "list-emojis",
  category: "Utility",
  description: "Displays all emojis available in the server.",
  aliases: ["listemojis", "emojilist", "el", "le","emoji","serveremoji", "se"],
  args: false,
  usage: "",
  permission: [],
  botonly: false,
  owner: false,

  execute: async (message, args, client, prefix) => {
    try {
      const emojis = message.guild.emojis.cache;
      if (emojis.size === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription("❌ | **This server has no custom emojis!**"),
          ],
        });
      }

      let staticEmojis = [];
      let animatedEmojis = [];

      emojis.forEach((emoji) => {
        if (emoji.animated) {
          animatedEmojis.push(emoji.toString());
        } else {
          staticEmojis.push(emoji.toString());
        }
      });

      const staticCount = staticEmojis.length;
      const animatedCount = animatedEmojis.length;
      const totalCount = staticCount + animatedCount;
      const serverIcon = message.guild.iconURL({ dynamic: true, size: 1024 });

      const createEmbed = (animated, staticEmojis) => {
        return new EmbedBuilder()
          .setAuthor({ name: `Emoji List for ${message.guild.name}`, iconURL: serverIcon })
          .setColor(client.embedColor)
          .setDescription(`**Total Emojis:** \`${totalCount}\``)
          .addFields(
            { name: `**Animated [${animatedCount}]**`, value: animated, inline: false },
            { name: `**Standard [${staticCount}]**`, value: staticEmojis, inline: false }
          )
          .setTimestamp();
      };

      // Split messages if too long
      const maxLength = 1024; // Discord field limit
      const splitEmojis = (emojiArray) => {
        let chunks = [];
        let chunk = "";
        emojiArray.forEach((emoji) => {
          if (chunk.length + emoji.length > maxLength) {
            chunks.push(chunk);
            chunk = "";
          }
          chunk += emoji + " ";
        });
        if (chunk) chunks.push(chunk);
        return chunks;
      };

      const animatedChunks = splitEmojis(animatedEmojis);
      const staticChunks = splitEmojis(staticEmojis);

      const embeds = [];
      for (let i = 0; i < Math.max(animatedChunks.length, staticChunks.length); i++) {
        embeds.push(createEmbed(animatedChunks[i] || "None", staticChunks[i] || "None"));
      }

      return message.reply({ embeds });
    } catch (error) {
      console.error("Emoji List Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("❌ | **An error occurred while fetching emojis.**"),
        ],
      });
    }
  },
};