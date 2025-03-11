const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const load = require("lodash");

module.exports = {
    name: "serverlist",
    category: "Owner",
    description: "Listing Of Servers",
    aliases: ["sl"],
    args: false,
    usage: "<string>",
    permission: [],
    owner: true,
    execute: async (message, args, client, prefix) => {
        const serverlist = client.guilds.cache.map((guild, i) => `\`\`\`Server Name: "${guild.name}"\nGuild ID: "${guild.id}"\nMember Count: "${guild.memberCount}"\`\`\``);
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
            
            return await message.channel.send({
                embeds: [embed]
            });
        } else {
            const embed2 = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(pages[page])
                .setFooter({
                    text: `Page ${page + 1}/${pages.length}`
                })
                .setTitle(`${message.client.user.username}'s Server List`);

            const prevBtn = new ButtonBuilder()
                .setCustomId("server_list_previous")
                .setEmoji("⏪")
                .setStyle(ButtonStyle.Primary);
                
            const stopBtn = new ButtonBuilder()
                .setCustomId("server_list_stop")
                .setEmoji("⏹️")
                .setStyle(ButtonStyle.Danger);
                
            const nextBtn = new ButtonBuilder()
                .setCustomId("server_list_next")
                .setEmoji("⏩")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(prevBtn, stopBtn, nextBtn);

            const msg = await message.channel.send({
                embeds: [embed2],
                components: [row],
            });

            const collector = message.channel.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === message.author.id) return true;
                    else {
                        b.reply({
                            ephemeral: true,
                            content: `❌ | Only owners can use these buttons.`,
                        });
                        return false;
                    }
                },
                time: 60000 * 5,
                idle: 60000 * 2
            });

            collector.on("collect", async (button) => {
                await button.deferUpdate().catch(() => {});
                
                if (button.customId === "server_list_next") {
                    page = page + 1 < pages.length ? ++page : 0;
                } else if (button.customId === "server_list_previous") {
                    page = page > 0 ? --page : pages.length - 1;
                } else if (button.customId === "server_list_stop") {
                    collector.stop();
                    return;
                }
                
                const newEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setDescription(pages[page])
                    .setFooter({
                        text: `Page ${page + 1}/${pages.length}`
                    })
                    .setTitle(`${message.client.user.username}'s Server List`);

                await msg.edit({
                    embeds: [newEmbed],
                    components: [new ActionRowBuilder().addComponents(
                        prevBtn.setDisabled(page === 0),
                        stopBtn,
                        nextBtn.setDisabled(page === pages.length - 1)
                    )]
                }).catch(() => {});
            });

            collector.on("end", async () => {
                const disabledRow = new ActionRowBuilder().addComponents(
                    prevBtn.setDisabled(true),
                    stopBtn.setDisabled(true),
                    nextBtn.setDisabled(true)
                );
                
                await msg.edit({ components: [disabledRow] }).catch(() => {});
            });
        }
    },
};
