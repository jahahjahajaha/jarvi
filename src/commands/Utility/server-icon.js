const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "server-icon",
    category: "Utility",
    description: "Shows the server's icon with a download button.",
    aliases: ["sicon","sico","icon"],
    args: false,
    usage: "",
    permission: [],
    voteonly: false,
    owner: false,

    execute: async (message, args, client, prefix) => {
        try {
            let icon = message.guild.iconURL({ dynamic: true, size: 2048 });
            if (!icon) return message.reply("❌ | **This server does not have an icon!**");

            let owner = await message.guild.fetchOwner();
            let ownerAvatar = owner.user.displayAvatarURL({ dynamic: true, size: 512 });

            // Custom Emoji
            const linkEmoji = "<a:Link_1_gif:1342811880967634985>";
            const emojia= "<a:silhouette_gif:1342787822674903104>"

            // Download Button - Discord.js v14 style
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setURL(icon)
                    .setLabel("Download Icon")
                    .setEmoji(linkEmoji)
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setURL(ownerAvatar)
                    .setLabel("Owner Avatar")
                    .setEmoji(emojia)
                    .setStyle(ButtonStyle.Link)
            );

            // Embed Message using Discord.js v14 EmbedBuilder
            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({
                    name: `${message.guild.name}`,
                    iconURL: icon
                })
                .setThumbnail(ownerAvatar)
                .setImage(icon)
                .setDescription(`> 📥 **[Click Here](${icon}) or the button below to download the server icon.**`)
                .setFooter({
                    text: `Requested by ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            await message.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error("Server Icon Command Error:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setDescription("❌ | **An error occurred while fetching the server icon!**"),
                ],
            });
        }
    },
};