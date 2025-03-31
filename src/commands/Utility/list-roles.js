const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "list-roles",
  category: "Utility",
  description: "📜 **Displays a list of server roles with custom emojis!**",
  aliases: ["listroles", "roles", "rl"],
  args: false,
  usage: "",
  permission: [],
  botonly: false,
  owner: false,

  execute: async (message, args, client, prefix) => {
    try {
      const customEmojis = {
        arrowNext: "<:Next_1:1342745137817583717>",
        arrowBack: "<:Previous_1:1342745127260655646>",
        list: "<:List:1340948013627080735>",
        roleIcon: "<:Modules:1340943031221878784>",
        serverIcon: "<a:Config_gif:1340947266772533360>",
        check: "<a:Chec_kmark:1340583433298251846>",
        cross: "<a:cross_gif:1342050022954373121>",
        next: "<:Next:1342215896931762197>",
        back: "<:Back:1342215910563254357>",
      };

      const roles = message.guild.roles.cache
        .filter((role) => role.id !== message.guild.id) // Remove @everyone
        .sort((a, b) => b.position - a.position)
        .map((role) => `${customEmojis.roleIcon} <@&${role.id}>`)
        .join("\n");

      const totalRoles = message.guild.roles.cache.size - 1;
      if (totalRoles <= 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription(`${customEmojis.cross} | **No roles found in this server!**`),
          ],
        });
      }

      const embeds = [];
      const roleChunks = chunkArray(roles.split("\n"), 10); // Max 10 roles per embed

      roleChunks.forEach((chunk, index) => {
        const embed = new EmbedBuilder()
          .setColor(client.embedColor)
          .setTitle(`${customEmojis.serverIcon} **Server Roles (${totalRoles})**`)
          .setDescription(chunk.join("\n"))
          .setFooter({
            text: `Page ${index + 1} of ${roleChunks.length}`
          })
          .setThumbnail(message.guild.iconURL({ dynamic: true, size: 1024 }))
          .setTimestamp();
        embeds.push(embed);
      });

      let currentPage = 0;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_page")
          .setEmoji(customEmojis.back) // ✅ Emoji Added
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next_page")
          .setEmoji(customEmojis.next) // ✅ Emoji Fixed
          .setStyle(ButtonStyle.Primary)
          .setDisabled(roleChunks.length === 1)
      );

      const sentMessage = await message.reply({
        embeds: [embeds[currentPage]],
        components: [row],
      });

      const filter = (i) =>
        i.user.id === message.author.id &&
        ["prev_page", "next_page"].includes(i.customId);

      const collector = sentMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "prev_page") currentPage--;
        if (interaction.customId === "next_page") currentPage++;

        await interaction.update({
          embeds: [embeds[currentPage]],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("prev_page")
                .setEmoji(customEmojis.back) // ✅ Corrected Emoji
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
              new ButtonBuilder()
                .setCustomId("next_page")
                .setEmoji(customEmojis.next) // ✅ Corrected Emoji
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === roleChunks.length - 1)
            ),
          ],
        });
      });

      collector.on("end", () => {
        sentMessage.edit({ components: [] }).catch(() => {});
      });
    } catch (error) {
      console.error("Role List Command Error:", error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(`${customEmojis.cross} | **An error occurred while fetching roles.**`),
        ],
      });
    }
  },
};

// Function to split array into chunks
function chunkArray(array, size) {
  return array.length
    ? [array.slice(0, size)].concat(chunkArray(array.slice(size), size))
    : [];
}