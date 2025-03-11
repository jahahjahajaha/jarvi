const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const load = require("lodash");
const { checkDevRole } = require("../../utils/roleCheck");

module.exports = {
    name: "serverlist",
    category: "Dev",
    description: "Server List Management",
    aliases: ["sl"],
    args: false,
    usage: "",
    devOnly: true, // Changed from owner to devOnly
    
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

        const serverlist = client.guilds.cache.map((guild, i) => 
            `\`\`\`Server Name: "${guild.name}"\nGuild ID: "${guild.id}"\nMember Count: "${guild.memberCount}"\`\`\``
        );
        
        const mapping = load.chunk(serverlist, 10);
        const pages = mapping.map((s) => s.join("\n"));
        let page = 0;

        if (client.guilds.cache.size <= 10) {
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(pages[page])
                .setFooter({
                    text: `Page ${page + 1}/${pages.length}`
                })
                .setTitle(`${message.client.user.username}'s Server List`);
            
            return await message.channel.send({ embeds: [embed] });
        } else {
            const embed2 = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(pages[page])
                .setFooter({
                    text: `Page ${page + 1}/${pages.length}`
                })
                .setTitle(`${message.client.user.username} Server List`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("server_list_previous")
                    .setEmoji("⏪")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("server_list_stop")
                    .setEmoji("⏹️")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("server_list_next")
                    .setEmoji("⏩")
                    .setStyle(ButtonStyle.Primary)
            );

            const msg = await message.channel.send({
                embeds: [embed2],
                components: [row]
            });

            const collector = message.channel.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === message.author.id) return true;
                    b.reply({
                        ephemeral: true,
                        content: `❌ | Only developers can use these buttons!`
                    });
                    return false;
                },
                time: 60000 * 5,
                idle: 60000 * 2
            });

            collector.on("collect", async (button) => {
                if (button.customId === "server_list_next") {
                    await button.deferUpdate().catch(() => {});
                    page = page + 1 < pages.length ? ++page : 0;
                } else if (button.customId === "server_list_previous") {
                    await button.deferUpdate().catch(() => {});
                    page = page > 0 ? --page : pages.length - 1;
                } else if (button.customId === "server_list_stop") {
                    await button.deferUpdate().catch(() => {});
                    collector.stop();
                    return;
                }

                const embed3 = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setDescription(pages[page])
                    .setFooter({
                        text: `Page ${page + 1}/${pages.length}`
                    })
                    .setTitle(`${message.client.user.username}'s Server List`);

                await msg.edit({
                    embeds: [embed3],
                    components: [row]
                }).catch(() => {});
            });

            collector.on("end", async () => {
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(button => 
                        ButtonBuilder.from(button).setDisabled(true)
                    )
                );

                await msg.edit({ components: [disabledRow] }).catch(() => {});
            });
        }
    }
};
