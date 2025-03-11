const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "profile",
  category: "Information",
  description: "Shows your or mentioned user's profile",
  execute: async (message, args, client, prefix) => {
    const user = message.mentions.users.first() || message.author;
    
    const embed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setTitle(`${user.username}'s Profile`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Username", value: user.username, inline: true },
        { name: "User ID", value: user.id, inline: true },
        { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Server Join Date", value: `<t:${Math.floor(message.guild.members.cache.get(user.id).joinedTimestamp / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }
};