const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "firstmsg",
  category: "Utility",
  description: "Get the first message of a channel.",
  aliases: ["firstmessage", "first", "fm"],
  args: false,
  usage: "[#channel or ID]",
  permission: [],
  botonly: false,
  owner: false,

  execute: async (message, args, client, prefix) => {
    try {
      const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

      const fetchMessages = await targetChannel.messages.fetch({ after: 1, limit: 1 });
      const firstMessage = fetchMessages.first();

      if (!firstMessage) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription("❌ | **No messages found in this channel!**"),
          ],
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setURL(firstMessage.url)
          .setLabel("View First Message")
          .setStyle(ButtonStyle.Link)
          .setEmoji("<a:Pni_gif:1342786958195425303>")
      );

      const embed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setTitle(`First Message in #${targetChannel.name}`)
        .setDescription(
          `**<a:silhouette_gif:1342787822674903104> Sent by:** ${firstMessage.author}\n\n📝 **Message:**\n${
            firstMessage.content || "*[No Text Content]*"
          }`
        )
        .setFooter({ 
          text: `Requested by: ${message.author.username}`, 
          iconURL: message.author.displayAvatarURL({ dynamic: true }) 
        })
        .setTimestamp()
        .setThumbnail(message.guild.iconURL({ dynamic: true, size: 1024 }));

      return message.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error("First Message Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("❌ | **An error occurred while fetching the first message.**"),
        ],
      });
    }
  },
};