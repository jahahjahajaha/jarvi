const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const { checkDevRole } = require("../../utils/roleCheck");

module.exports = {
  name: "annpanel",
  aliases: ["anp", "announce", "announcement", "announcepanel"],
  category: "Dev",
  description: "Enhanced interactive panel for sending messages or announcements to servers.",
  devOnly: true,
  execute: async (message, args, client, prefix) => {
    // Check for dev role
    if (!checkDevRole(message.member)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('❌ | Only developers can use this command!')
        ]
      });
    }

    // Initial embed
    const initialEmbed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setTitle("Announcement Panel")
      .setDescription(
        "**Choose an option:**\n\n" +
          "**Send Message** – Send a message (normal or embed) to one specific server.\n" +
          "**Broadcast** – Send a message (normal or embed) to all servers.",
      )
      .setFooter({ text: "Select an option below" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("send_one")
        .setLabel("Send Message")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("broadcast")
        .setLabel("Broadcast")
        .setStyle(ButtonStyle.Success),
    );

    const initMsg = await message.reply({
      embeds: [initialEmbed],
      components: [row],
    });

    // Collector for the initial menu
    const collector = message.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 300000, // 5 min
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      if (interaction.customId === "send_one") {
        collector.stop();
        await handleSendOneFlow(message, client);
      } else if (interaction.customId === "broadcast") {
        collector.stop();
        await handleBroadcastFlow(message, client);
      }
    });

    collector.on("end", () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("send_one")
          .setLabel("Send Message")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("broadcast")
          .setLabel("Broadcast")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
      );
      initMsg.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};

/* ------------------------------------------------------------
   Helper 1: handleSendOneFlow - Send normal or embed to 1 server
------------------------------------------------------------ */
async function handleSendOneFlow(message, client) {
  try {
    // Step 1: normal or embed
    await message.reply(
      "Would you like to send a **normal** message or an **embed**? (type `normal` or `embed`)",
    );
    const typeCollector = message.channel.createMessageCollector({
      filter: (m) => m.author.id === message.author.id,
      max: 1,
      time: 60000,
    });
    typeCollector.on("collect", async (typeMsg) => {
      const choice = typeMsg.content.toLowerCase();
      if (choice !== "normal" && choice !== "embed") {
        return promptResend(
          message,
          "❌ | Invalid choice. Please type `normal` or `embed`.",
          () => handleSendOneFlow(message, client),
        );
      }

      // Step 2: mention owner or not
      await message.reply("Do you want to mention the server owner? (yes/no)");
      const mentionCollector = message.channel.createMessageCollector({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: 60000,
      });
      let mentionOwner = false;
      mentionCollector.on("collect", async (mMsg) => {
        if (mMsg.content.toLowerCase() === "yes") {
          mentionOwner = true;
        }
        // Step 3: gather content
        if (choice === "normal") {
          // Normal text
          await message.reply("Enter the **text** you want to send:");
          const textColl = message.channel.createMessageCollector({
            filter: (ms) => ms.author.id === message.author.id,
            max: 1,
            time: 120000,
          });
          textColl.on("collect", async (tMsg) => {
            const finalText = tMsg.content;
            // Now ask for server ID
            await message.reply(
              "Please enter the **Server ID** where you want to send this message:",
            );
            const serverColl = message.channel.createMessageCollector({
              filter: (ms) => ms.author.id === message.author.id,
              max: 1,
              time: 60000,
            });
            serverColl.on("collect", async (sMsg) => {
              const targetGuild = client.guilds.cache.get(sMsg.content.trim());
              if (!targetGuild) {
                return promptResend(
                  message,
                  "❌ | Invalid Server ID. Please retry.",
                  () => handleSendOneFlow(message, client),
                );
              }
              // Channel ID or random
              await message.reply(
                "Enter the **Channel ID** or type `random` for a random text channel:",
              );
              const chColl = message.channel.createMessageCollector({
                filter: (ms) => ms.author.id === message.author.id,
                max: 1,
                time: 60000,
              });
              chColl.on("collect", async (chMsg) => {
                const targetChannel = await getTargetChannel(
                  chMsg.content,
                  targetGuild,
                  client,
                );
                if (!targetChannel) {
                  return promptResend(
                    message,
                    "❌ | Invalid channel or no permission. Please retry.",
                    () => handleSendOneFlow(message, client),
                  );
                }
                const gOwner = await targetGuild.fetchOwner().catch(() => null);
                const mentionString =
                  mentionOwner && gOwner ? `<@${gOwner.id}> ` : "";
                await targetChannel
                  .send(mentionString + finalText)
                  .catch(() => {});
                message.reply("✅ | Message sent successfully!");
              });
            });
          });
        } else {
          // Embeds
          await message.reply(
            "Enter your embed details in format:\n" +
              "`Title | Description | Color(optional) | ImageURL(optional) | FooterText(optional) | FooterIcon(optional)`\n" +
              "Skip any field by leaving it blank between pipes.",
          );
          const embedColl = message.channel.createMessageCollector({
            filter: (ms) => ms.author.id === message.author.id,
            max: 1,
            time: 120000,
          });
          embedColl.on("collect", async (eMsg) => {
            const parts = eMsg.content.split("|").map((p) => p.trim());
            if (parts.length < 2) {
              return promptResend(
                message,
                "❌ | At least Title & Description needed. Please retry.",
                () => handleSendOneFlow(message, client),
              );
            }
            const title = parts[0];
            const description = parts[1];
            const color = parts[2] || client.embedColor;
            const imageURL = parts[3] || null;
            const footText = parts[4] || `Sent by ${message.author.username}`;
            const footIcon =
              parts[5] || message.author.displayAvatarURL({ dynamic: true });

            // Build embed
            const finalEmbed = new EmbedBuilder()
              .setColor(color)
              .setTitle(title)
              .setDescription(description)
              .setFooter({ text: footText, iconURL: footIcon })
              .setTimestamp();
            if (imageURL) finalEmbed.setImage(imageURL);

            // Confirm row
            const confirmRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("confirm_embed_send")
                .setLabel("Send Embed")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("cancel_embed_send")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger),
            );
            const prevMsg = await message.reply({
              embeds: [finalEmbed],
              components: [confirmRow],
            });

            // Confirm collector
            const confirmCollector =
              message.channel.createMessageComponentCollector({
                filter: (i) => i.user.id === message.author.id,
                max: 1,
                time: 60000,
              });
            confirmCollector.on("collect", async (intr) => {
              await intr.deferUpdate();
              if (intr.customId === "confirm_embed_send") {
                // Next: server ID
                await message.reply(
                  "Please enter the **Server ID** where you want to send this embed:",
                );
                const sColl = message.channel.createMessageCollector({
                  filter: (ms) => ms.author.id === message.author.id,
                  max: 1,
                  time: 60000,
                });
                sColl.on("collect", async (sMsg2) => {
                  const targGuild = client.guilds.cache.get(
                    sMsg2.content.trim(),
                  );
                  if (!targGuild) {
                    return promptResend(
                      message,
                      "❌ | Invalid Server ID. Please retry.",
                      () => handleSendOneFlow(message, client),
                    );
                  }
                  // Channel ID or random
                  await message.reply(
                    "Enter the **Channel ID** or type `random` for a random text channel in that server:",
                  );
                  const cColl2 = message.channel.createMessageCollector({
                    filter: (ms) => ms.author.id === message.author.id,
                    max: 1,
                    time: 60000,
                  });
                  cColl2.on("collect", async (chM) => {
                    const ch2 = await getTargetChannel(
                      chM.content,
                      targGuild,
                      client,
                    );
                    if (!ch2) {
                      return promptResend(
                        message,
                        "❌ | Invalid channel or no permission. Please retry.",
                        () => handleSendOneFlow(message, client),
                      );
                    }
                    const gOwn = await targGuild.fetchOwner().catch(() => null);
                    const mentionStr =
                      mentionOwner && gOwn ? `<@${gOwn.id}> ` : "";
                    await ch2
                      .send({ content: mentionStr, embeds: [finalEmbed] })
                      .catch(() => {});
                    message.reply("✅ | Embed sent successfully!");
                  });
                });
              } else {
                message.reply("❌ | Operation cancelled.");
              }
            });
            confirmCollector.on("end", (col) => {
              if (col.size === 0) {
                prevMsg.edit({ components: [] });
                message.reply("❌ | No response. Timed out.");
              } else {
                disableButtons(prevMsg, [
                  "confirm_embed_send",
                  "cancel_embed_send",
                ]);
              }
            });
          });
        }
      });
    });
  } catch (error) {
    console.error("Error in handleSendOneFlow:", error);
    message.reply("❌ | An error occurred in the send message flow.");
  }
}

/* ---------------------------------------------------------------------
   Helper 2: handleBroadcastFlow - normal or embed, mention owners or not
--------------------------------------------------------------------- */
async function handleBroadcastFlow(message, client) {
  try {
    // Step 1: normal or embed
    await message.reply(
      "Would you like to send a **normal** message or an **embed** announcement? (type `normal` or `embed`)",
    );
    const tColl = message.channel.createMessageCollector({
      filter: (m) => m.author.id === message.author.id,
      max: 1,
      time: 60000,
    });
    tColl.on("collect", async (tMsg) => {
      const choice = tMsg.content.toLowerCase();
      if (choice !== "normal" && choice !== "embed") {
        return promptResend(
          message,
          "❌ | Invalid choice. Please type `normal` or `embed`.",
          () => handleBroadcastFlow(message, client),
        );
      }

      // Step 2: mention owners in each server or not
      await message.reply(
        "Do you want to mention each server's owner in the broadcast? (yes/no)",
      );
      const mentionColl = message.channel.createMessageCollector({
        filter: (ms) => ms.author.id === message.author.id,
        max: 1,
        time: 60000,
      });
      let mentionOwner = false;
      mentionColl.on("collect", async (mMsg) => {
        if (mMsg.content.toLowerCase() === "yes") mentionOwner = true;

        if (choice === "normal") {
          // Normal broadcast
          await message.reply("Enter the **text** for your broadcast:");
          const nColl = message.channel.createMessageCollector({
            filter: (ms) => ms.author.id === message.author.id,
            max: 1,
            time: 120000,
          });
          nColl.on("collect", async (nMsg) => {
            const finalContent = nMsg.content;
            // Show preview & confirm
            const prevEmbed = new EmbedBuilder()
              .setColor(client.embedColor)
              .setTitle("Broadcast Preview (Normal Message)")
              .setDescription(finalContent)
              .setFooter({ text: "Click 'Send' to proceed" })
              .setTimestamp();
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("bc_normal_confirm")
                .setLabel("Send")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("bc_normal_cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger),
            );
            const prevMsg = await message.reply({
              embeds: [prevEmbed],
              components: [row],
            });

            const bcCollector = message.channel.createMessageComponentCollector(
              {
                filter: (i) => i.user.id === message.author.id,
                max: 1,
                time: 60000,
              },
            );
            bcCollector.on("collect", async (intr) => {
              await intr.deferUpdate();
              if (intr.customId === "bc_normal_confirm") {
                // Broadcast
                client.guilds.cache.forEach(async (g) => {
                  let tChannel =
                    g.systemChannel ||
                    g.channels.cache
                      .filter(
                        (ch) =>
                          ch.type === 0 && // ChannelType.GuildText is 0 in v14
                          ch
                            .permissionsFor(g.members.me)
                            .has(PermissionsBitField.Flags.SendMessages),
                      )
                      .random();
                  if (tChannel) {
                    const gOwner = await g.fetchOwner().catch(() => null);
                    const mentionString =
                      mentionOwner && gOwner ? `<@${gOwner.id}> ` : "";
                    tChannel.send(mentionString + finalContent).catch(() => {});
                  }
                });
                message.reply("✅ | Broadcast sent successfully!");
              } else {
                message.reply("❌ | Broadcast cancelled.");
              }
            });
            bcCollector.on("end", (col) => {
              if (col.size === 0) {
                prevMsg.edit({ components: [] });
                message.reply("❌ | Timed out. No response.");
              } else {
                disableButtons(prevMsg, [
                  "bc_normal_confirm",
                  "bc_normal_cancel",
                ]);
              }
            });
          });
        } else {
          // Embed broadcast
          await message.reply(
            "Enter embed details in format:\n" +
              "`Title | Description | Color(optional) | ImageURL(optional) | FooterText(optional) | FooterIcon(optional)`\n" +
              "Skip any field by leaving it blank between pipes.",
          );
          const eColl = message.channel.createMessageCollector({
            filter: (ms) => ms.author.id === message.author.id,
            max: 1,
            time: 120000,
          });
          eColl.on("collect", async (eMsg) => {
            const parts = eMsg.content.split("|").map((s) => s.trim());
            if (parts.length < 2) {
              return promptResend(
                message,
                "❌ | At least Title & Description needed. Retry.",
                () => handleBroadcastFlow(message, client),
              );
            }
            const [title, desc] = [parts[0], parts[1]];
            const color = parts[2] || client.embedColor;
            const image = parts[3] || null;
            const fText =
              parts[4] || `Announcement by ${message.author.username}`;
            const fIcon =
              parts[5] || message.author.displayAvatarURL({ dynamic: true });

            const annEmbed = new EmbedBuilder()
              .setColor(color)
              .setTitle(title)
              .setDescription(desc)
              .setFooter({ text: fText, iconURL: fIcon })
              .setTimestamp();
            if (image) annEmbed.setImage(image);

            const row2 = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("bc_embed_confirm")
                .setLabel("Send")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("bc_embed_cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger),
            );
            const pMsg = await message.reply({
              embeds: [annEmbed],
              components: [row2],
            });
            const c2 = message.channel.createMessageComponentCollector({
              filter: (i) => i.user.id === message.author.id,
              max: 1,
              time: 60000,
            });
            c2.on("collect", async (intr2) => {
              await intr2.deferUpdate();
              if (intr2.customId === "bc_embed_confirm") {
                // Broadcast embed
                client.guilds.cache.forEach(async (g) => {
                  let tCh =
                    g.systemChannel ||
                    g.channels.cache
                      .filter(
                        (ch) =>
                          ch.type === 0 && // ChannelType.GuildText is 0 in v14
                          ch
                            .permissionsFor(g.members.me)
                            .has(PermissionsBitField.Flags.SendMessages),
                      )
                      .random();
                  if (tCh) {
                    const gOwner = await g.fetchOwner().catch(() => null);
                    const mentionStr =
                      mentionOwner && gOwner ? `<@${gOwner.id}> ` : "";
                    tCh
                      .send({ content: mentionStr, embeds: [annEmbed] })
                      .catch(() => {});
                  }
                });
                message.reply("✅ | Broadcast sent successfully!");
              } else {
                message.reply("❌ | Broadcast cancelled.");
              }
            });
            c2.on("end", (co) => {
              if (co.size === 0) {
                pMsg.edit({ components: [] });
                message.reply("❌ | Timed out. No response.");
              } else {
                disableButtons(pMsg, ["bc_embed_confirm", "bc_embed_cancel"]);
              }
            });
          });
        }
      });
    });
  } catch (error) {
    console.error("Error in broadcastFlow:", error);
    message.reply("❌ | An error occurred during the broadcast process.");
  }
}

/* ---------------------------------------------------------------------
   Helper 3: handleServerListFlow - Show server name, ID, member count
--------------------------------------------------------------------- */
async function handleServerListFlow(message, client) {
  try {
    const serverData = client.guilds.cache.map((guild) => {
      return {
        name: guild.name,
        id: guild.id,
        members: guild.memberCount,
      };
    });
    if (!serverData.length) {
      return message.reply("❌ | No servers found.");
    }
    // We chunk them into pages of 10
    const chunked = _.chunk(serverData, 10);
    let currentPage = 0;

    function buildPage(index) {
      const pageEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setTitle(`${client.user.username}'s Server List`)
        .setFooter({
          text: `Page ${index + 1} of ${chunked.length}`
        })
        .setTimestamp();
      
      // In Discord.js v14, we use .addFields() instead of .addField()
      const fields = [];
      chunked[index].forEach((sv) => {
        fields.push({
          name: sv.name,
          value: `**ID:** ${sv.id}\n**Members:** ${sv.members}`,
          inline: false
        });
      });
      pageEmbed.addFields(fields);
      
      return pageEmbed;
    }

    let embed = buildPage(currentPage);
    const prevBtn = new ButtonBuilder()
      .setCustomId("prev_serverlist")
      .setLabel("⏪")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    const nextBtn = new ButtonBuilder()
      .setCustomId("next_serverlist")
      .setLabel("⏩")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(chunked.length <= 1);
    const stopBtn = new ButtonBuilder()
      .setCustomId("stop_serverlist")
      .setLabel("⏹️")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(prevBtn, stopBtn, nextBtn);
    const listMsg = await message.reply({ embeds: [embed], components: [row] });

    const listColl = message.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 300000,
      idle: 120000,
    });
    listColl.on("collect", async (intr) => {
      await intr.deferUpdate();
      if (intr.customId === "next_serverlist") {
        currentPage = currentPage + 1 < chunked.length ? currentPage + 1 : 0;
      } else if (intr.customId === "prev_serverlist") {
        currentPage = currentPage > 0 ? currentPage - 1 : chunked.length - 1;
      } else if (intr.customId === "stop_serverlist") {
        listColl.stop();
        return;
      }
      const newEmbed = buildPage(currentPage);
      await listMsg.edit({
        embeds: [newEmbed],
        components: [
          new ActionRowBuilder().addComponents(
            prevBtn.setDisabled(currentPage === 0),
            stopBtn,
            nextBtn.setDisabled(currentPage === chunked.length - 1),
          ),
        ],
      });
    });
    listColl.on("end", () => {
      const disRow = new ActionRowBuilder().addComponents(
        prevBtn.setDisabled(true),
        stopBtn.setDisabled(true),
        nextBtn.setDisabled(true),
      );
      listMsg.edit({ components: [disRow] }).catch(() => {});
    });
  } catch (error) {
    console.error("Error in serverListFlow:", error);
    message.reply("❌ | An error occurred while listing servers.");
  }
}

/* ---------------------------------------------------------------------
   HELPER: promptResend - shows an error embed with 'Resend' & 'Exit' 
--------------------------------------------------------------------- */
async function promptResend(message, errorText, retryFunction) {
  const errorEmbed = new EmbedBuilder()
    .setColor("RED")
    .setDescription(errorText);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("resend")
      .setLabel("Resend")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("exit")
      .setLabel("Exit")
      .setStyle(ButtonStyle.Danger),
  );
  const promptMsg = await message.reply({
    embeds: [errorEmbed],
    components: [row],
  });

  const coll = message.channel.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    max: 1,
    time: 60000,
  });

  coll.on("collect", async (intr) => {
    await intr.deferUpdate();
    if (intr.customId === "resend") {
      coll.stop();
      return retryFunction();
    } else {
      coll.stop();
      // Disable
      disableButtons(promptMsg, ["resend", "exit"]);
      message.reply("❌ | Operation cancelled.");
    }
  });

  coll.on("end", (c) => {
    if (c.size === 0) {
      promptMsg.edit({ components: [] });
      message.reply("❌ | No response received. Operation timed out.");
    }
  });
}

/* ---------------------------------------------------------------------
   HELPER: getTargetChannel - returns channel or random text channel
--------------------------------------------------------------------- */
async function getTargetChannel(input, guild, client) {
  if (input.toLowerCase() === "random") {
    const textChannels = guild.channels.cache.filter(
      (ch) =>
        ch.type === 0 && // ChannelType.GuildText is 0 in v14
        ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages),
    );
    return textChannels.random() || null;
  } else {
    const ch = guild.channels.cache.get(input.trim());
    if (
      !ch ||
      ch.type !== 0 || // ChannelType.GuildText is 0 in v14
      !ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
    ) {
      return null;
    }
    return ch;
  }
}

/* ---------------------------------------------------------------------
   HELPER: disableButtons - disables given customIds in a message
--------------------------------------------------------------------- */
async function disableButtons(msg, customIds) {
  if (!msg.editable) return;
  if (!msg.components?.length) return;
  const newRows = [];
  for (const row of msg.components) {
    const newRow = new ActionRowBuilder();
    for (const comp of row.components) {
      if (customIds.includes(comp.customId)) {
        newRow.addComponents(ButtonBuilder.from(comp).setDisabled(true));
      } else {
        newRow.addComponents(ButtonBuilder.from(comp));
      }
    }
    newRows.push(newRow);
  }
  await msg.edit({ components: newRows }).catch(() => {});
}
