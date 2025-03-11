const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.resume.name"),
  aliases: ["rs", "unpause", "notpause", "removepause"],
  category: "Music",
  description: i18n.__("cmd.resume.des"),
  args: false,
  usage: "",
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
            .setDescription("<a:Cross_mark:1340583476762646609> | **Currently no music is playing.**"),
        ],
      });
    }

    if (!player.paused) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFFF00")
            .setDescription("<a:Chec_kmark:1340583433298251846> | **The player is already resumed.**"),
        ],
      });
    }

    // **Server Mute Check**
    if (message.guild.members.me.voice.serverMute) {
      if (message.guild.members.me.permissions.has("Administrator")) {
        // **Unmute Button**
        const unmuteButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("unmute_bot")
            .setLabel(`Unmute ${message.guild.members.me.displayName}`)
            .setStyle(ButtonStyle.Danger)
            .setEmoji("1342003041301168160") // ✅ Fix: Custom emoji ko sahi format mein diya
        );

        const muteEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setDescription("<a:Mic_blocked_gif:1342003041301168160> | **I am muted! Please unmute me before resuming the music.**");

        const msg = await message.reply({ embeds: [muteEmbed], components: [unmuteButton] });

        // **Button Interaction Listener**
        const filter = (interaction) => interaction.customId === "unmute_bot" && interaction.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

        collector.on("collect", async (interaction) => {
          try {
            await interaction.deferUpdate(); // ✅ Fix: "This interaction failed" issue resolve

            // **Bot Unmute**
            await message.guild.members.me.voice.setMute(false);

            // **Wait for 2 seconds to ensure unmute**
            await new Promise(resolve => setTimeout(resolve, 2000));

            // **Check if bot is still muted**
            if (message.guild.members.me.voice.serverMute) {
              throw new Error("Failed to unmute the bot.");
            }

            // **Resume Music**
            player.pause(false);

            // **Success Embed**
            const successEmbed = new EmbedBuilder()
              .setColor("#00FF00")
              .setDescription("<a:Chec_kmark:1340583433298251846> | **Successfully Unmuted & Resumed the Music!**");

            // **Disable Button after Unmuting**
            const updatedButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("unmute_bot_disabled")
                .setLabel("Unmuted")
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
            );

            await msg.edit({ embeds: [successEmbed], components: [updatedButton] });
          } catch (error) {
            console.error("❌ Unmute Error:", error.message);

            await interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setColor("#FF0000")
                  .setDescription("<a:Cross_mark:1340583476762646609> | **I couldn't unmute myself. Please unmute manually.**"),
              ],
              ephemeral: true,
            });
          }
        });

        collector.on("end", async () => {
          try {
            await msg.edit({ components: [] });
          } catch (err) {}
        });

        return;
      } else {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription("<a:Mic_blocked_gif:1342003041301168160> | **I am muted! Please ask a moderator to unmute me before resuming the music.**"),
          ],
        });
      }
    }

    // **Normal Resume**
    player.pause(false);
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#00FF00")
          .setDescription("<a:Chec_kmark:1340583433298251846> | **Successfully Resumed The Current Playing Song.**"),
      ],
    });
  },
};