const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "avatar",
  category: "Utility",
  description: "Get the avatar of a user.",
  aliases: ["av", "pfp"],
  args: false,
  usage: "[user]",
  permission: [],
  voteonly: false,
  owner: false,

  execute: async (message, args, client, prefix) => {
    try {
      const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.guild.members.cache.find(
          (x) =>
            x.user.username.toLowerCase() === args.join(" ").toLowerCase() ||
            x.user.username === args[0]
        ) ||
        message.member;

      if (!member) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription("❌ | **User not found! Please mention a valid user.**"),
          ],
        });
      }

      const avatarURL = member.user.displayAvatarURL({ dynamic: true, size: 4096 });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(avatarURL)
          .setLabel("Download Avatar")
          .setStyle(ButtonStyle.Link)
      );

      const embed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setTitle(`${member.user.username}'s Avatar`)
        .setImage(avatarURL)
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("Avatar Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("❌ | **An error occurred while fetching the avatar.**"),
        ],
      });
    }
  },
};