const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const _ = require("lodash");
const { checkDevRole } = require("../../utils/roleCheck");

module.exports = {
    name: "servermanage",
    category: "Dev",
    description: "Server List Management",
    aliases: ["sm"],
    args: false,
    usage: "",
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

        // Initial panel embed
        const initialEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setTitle("Server Management Panel")
            .setDescription(
                "**Choose an option:**\n\n" +
                "**Server List:** View a paginated list of all servers the bot is in.\n" +
                "**Remove Bot:** Remove the bot from a server with an optional custom message to the server owner."
            )
            .setFooter({ text: "Select an option using the buttons below." })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("server_list")
                .setLabel("Server List")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("remove_bot")
                .setLabel("Remove Bot")
                .setStyle(ButtonStyle.Danger)
        );

        const initMsg = await message.reply({ embeds: [initialEmbed], components: [row] });

        const collector = message.channel.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 300000 // 5 minutes
        });

        collector.on("collect", async interaction => {
            await interaction.deferUpdate();
            if (interaction.customId === "server_list") {
                collector.stop();
                await handleServerListFlow(message, client);
            } else if (interaction.customId === "remove_bot") {
                collector.stop();
                await handleRemoveBotFlow(message, client);
            }
        });

        collector.on("end", async () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                row.components.map(button => 
                    ButtonBuilder.from(button).setDisabled(true)
                )
            );
            await initMsg.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};

async function handleServerListFlow(message, client) {
  try {
    const serverData = client.guilds.cache.map(guild => ({
      name: guild.name,
      id: guild.id,
      members: guild.memberCount
    }));

    if (!serverData.length) {
      return message.reply("❌ | No servers found.");
    }

    // Chunk into pages (10 servers per page)
    const pages = _.chunk(serverData, 10).map(chunk =>
      chunk.map(sv => `**${sv.name}**\nID: \`${sv.id}\`\nMembers: \`${sv.members}\``).join("\n\n")
    );
    let currentPage = 0;

    const embed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setTitle(`${client.user.username} Server List`)
      .setDescription(pages[currentPage])
      .setFooter({ text: `Page ${currentPage + 1} of ${pages.length}` })
      .setTimestamp();

    const prevButton = new ButtonBuilder()
      .setCustomId("list_prev")
      .setLabel("⏪")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    const nextButton = new ButtonBuilder()
      .setCustomId("list_next")
      .setLabel("⏩")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pages.length <= 1);
    const stopButton = new ButtonBuilder()
      .setCustomId("list_stop")
      .setLabel("⏹️")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(prevButton, stopButton, nextButton);
    const listMsg = await message.reply({ embeds: [embed], components: [row] });

    const listCollector = message.channel.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000,
      idle: 120000
    });

    listCollector.on("collect", async (intr) => {
      await intr.deferUpdate();
      if (intr.customId === "list_next") {
        currentPage = (currentPage + 1 < pages.length) ? currentPage + 1 : 0;
      } else if (intr.customId === "list_prev") {
        currentPage = currentPage > 0 ? currentPage - 1 : pages.length - 1;
      } else if (intr.customId === "list_stop") {
        listCollector.stop();
        return;
      }
      const newEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setTitle(`${client.user.username} Server List`)
        .setDescription(pages[currentPage])
        .setFooter({ text: `Page ${currentPage + 1} of ${pages.length}` })
        .setTimestamp();
      await listMsg.edit({ embeds: [newEmbed], components: [new ActionRowBuilder().addComponents(
        prevButton.setDisabled(currentPage === 0),
        stopButton,
        nextButton.setDisabled(currentPage === pages.length - 1)
      )] });
    });

    listCollector.on("end", async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        prevButton.setDisabled(true),
        stopButton.setDisabled(true),
        nextButton.setDisabled(true)
      );
      await listMsg.edit({ components: [disabledRow] }).catch(() => {});
    });
  } catch (error) {
    console.error("Error in server list flow:", error);
    message.reply("❌ | An error occurred while listing servers.");
  }
}

async function handleRemoveBotFlow(message, client) {
  try {
    await message.reply("Enter the **Server ID** from which you want to remove the bot:");
    const serverCollector = message.channel.createMessageCollector({
      filter: m => m.author.id === message.author.id,
      max: 1,
      time: 60000
    });
    serverCollector.on("collect", async (sMsg) => {
      const targetGuild = client.guilds.cache.get(sMsg.content.trim());
      if (!targetGuild) {
        return promptResend(message, "❌ | Invalid Server ID. Please try again.", () => handleRemoveBotFlow(message, client));
      }
      // Ask if a custom message should be sent
      await message.reply("Do you want to send a final message to the server owner before removing the bot? (yes/no)");
      const confirmCollector = message.channel.createMessageCollector({
        filter: m => m.author.id === message.author.id,
        max: 1,
        time: 60000
      });
      confirmCollector.on("collect", async (confirmMsg) => {
        if (confirmMsg.content.toLowerCase() === "yes") {
          await message.reply("Enter the **final message** to send to the server owner:");
          const msgCollector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 120000
          });
          msgCollector.on("collect", async (finalMsg) => {
            const targetOwner = await targetGuild.fetchOwner().catch(() => null);
            let channelToSend = targetGuild.systemChannel;
            if (!channelToSend) {
              const textChannels = targetGuild.channels.cache.filter(
                ch => ch.type === 0 && ch.permissionsFor(targetGuild.members.me).has(PermissionsBitField.Flags.SendMessages)
              );
              channelToSend = textChannels.random();
            }
            if (channelToSend) {
              const ownerTag = targetOwner ? `<@${targetOwner.id}> ` : "";
              await channelToSend.send({
                content: ownerTag,
                embeds: [new EmbedBuilder().setColor(client.embedColor).setDescription(finalMsg.content)]
              }).catch(() => {});
            }
            await targetGuild.leave();
            message.reply(`✅ | Successfully removed the bot from **${targetGuild.name}**.`);
          });
          msgCollector.on("end", collected => {
            if (collected.size === 0) {
              message.reply("❌ | No message provided. Operation timed out.");
            }
          });
        } else if (confirmMsg.content.toLowerCase() === "no") {
          await targetGuild.leave();
          message.reply(`✅ | Successfully removed the bot from **${targetGuild.name}**.`);
        } else {
          message.reply("❌ | Invalid response. Operation cancelled.");
        }
      });
      confirmCollector.on("end", collected => {
        if (collected.size === 0) {
          message.reply("❌ | No confirmation received. Operation timed out.");
        }
      });
    });
    serverCollector.on("end", collected => {
      if (collected.size === 0) {
        message.reply("❌ | No Server ID provided. Operation timed out.");
      }
    });
  } catch (error) {
    console.error("Error in remove bot flow:", error);
    message.reply("❌ | An error occurred during the removal process.");
  }
}

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
      // Disable buttons
      const disRow = new ActionRowBuilder().addComponents(
        row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
      );
      await promptMsg.edit({ components: [disRow] }).catch(() => {});
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
