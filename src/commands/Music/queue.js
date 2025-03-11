const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const load = require("lodash");
const { convertTime } = require("../../utils/convert.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.queue.name"),
  category: "Music",
  aliases: ["q", "qu", "que"],
  description: "View the current music queue.",
  args: false,
  usage: i18n.__("cmd.queue.use"),
  permission: [],
  owner: false,
  player: true,
  inVoiceChannel: false,
  sameVoiceChannel: false,

  execute: async (message, args, client, prefix) => {
    const player = client.manager.get(message.guild.id);
    if (!player || !player.queue.current) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("<:Stop_1:1342000640767037461> | **There is no song currently playing!**"),
        ],
      });
    }

    const song = player.queue.current;
    const queuedSongs = player.queue.map((t, i) =>
      `\`${i + 1}\` • **[${t.title}](${t.uri})** • \`${convertTime(t.duration)}\` - [${t.requester}]`
    );

    const mapping = load.chunk(queuedSongs, 10);
    const pages = mapping.map((s) => s.join("\n"));
    let page = 0;

    const embed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setTitle(`${message.guild.name} - j<:List_1:1342011384409358378> Music Queue`)
      .setThumbnail(song.thumbnail)
      .setDescription(
        `<a:CD_playing:1342194315404902411> **Now Playing:**\n[${song.title}](${song.uri}) - \`${convertTime(song.duration)}\`\n\n<:List_1:1342011384409358378> **Queue:**\n${pages[page] || "**No upcoming songs.**"}`
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    if (pages.length < 2) {
      return message.reply({ embeds: [embed] });
    } else {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("queue_prev").setEmoji("<:Previous_1:1342745127260655646>").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("queue_page").setLabel(`${page + 1}/${pages.length}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId("queue_next").setEmoji("<:Next_1:1342745137817583717>").setStyle(ButtonStyle.Primary)
      );

      const msg = await message.reply({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on("collect", async (button) => {
        await button.deferUpdate();
        page = button.customId === "queue_next" ? (page + 1) % pages.length : page > 0 ? page - 1 : pages.length - 1;
        embed.setDescription(`<a:CD_playing:1342194315404902411> **Now Playing:**\n[${song.title}](${song.uri})\n\n<:List_1:1342011384409358378> **Queue:**\n${pages[page] || "**No upcoming songs.**"}`);
        await msg.edit({ embeds: [embed], components: [row] });
      });

      collector.on("end", async () => {
        await msg.edit({ components: [] });
      });
    }
  },
};