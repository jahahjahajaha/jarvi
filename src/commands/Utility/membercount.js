const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "membercount",
    category: "Utility",
    description: "📊 Displays the total number of members in the server along with detailed stats.",
    aliases: ["mc", "members"],
    args: false,
    usage: "",
    permission: [],
    voteonly: false,
    owner: false,

    execute: async (message, args, client, prefix) => {
        try {
            const customEmojis = {
                members: "<a:Black_silhouette_gif:1342798494028660776>",
                bots: "<a:To_flirt_bot_face_gif:1342798972913455154>",
                boosters: "<a:Boost_gif:1342820038465552476>",
            };

            const members = await message.guild.members.fetch();
            const totalMembers = message.guild.memberCount;
            const humanCount = members.filter(m => !m.user.bot).size;
            const botCount = members.filter(m => m.user.bot).size;
            const boosters = message.guild.premiumSubscriptionCount || 0;

            const embed = new EmbedBuilder()
                .setTitle(`${customEmojis.members} **Server Members**`)
                .setColor(client.embedColor)
                .setThumbnail(message.guild.iconURL({ dynamic: true, size: 1024 }))
                .setDescription(
                    `> **Total Members:** ${customEmojis.members} \`${totalMembers}\`\n` +
                    `> **Humans:** 👤 \`${humanCount}\`\n` +
                    `> **Bots:** ${customEmojis.bots} \`${botCount}\`\n` +
                    `> **Boosters:** ${customEmojis.boosters} \`${boosters}\``
                )
                .setFooter({
                    text: `Requested by: ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Member Count Command Error:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setDescription("❌ | **An error occurred while fetching member count!**"),
                ],
            });
        }
    },
};