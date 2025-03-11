const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "uptime",
    category: "Information",
    aliases: ["up","ut"],
    description: "Shows bot uptime",
    args: false,
    usage: "",
    permission: [],
    owner: false,

    execute: async (message, args, client, prefix) => {
        if (isNaN(client.uptime)) {
            return message.reply("❌ **Failed to fetch bot uptime!**");
        }

        // Convert milliseconds into readable time format
        let totalSeconds = Math.floor(client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        let hours = Math.floor((totalSeconds % 86400) / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;

        let uptime = `🗓 **${days}** days, ⏳ **${hours}** hours, ⏰ **${minutes}** minutes, ⏲ **${seconds}** seconds`;

        // Embed Message
        const embed = new MessageEmbed()
            .setAuthor({
                name: `${client.user.username}'s Uptime 🟢`,
                iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`### <a:Running_time:1341816641700499537> **Bot Uptime:**
            ${uptime}`)
            .setColor(client.embedColor)
            .setFooter({
                text: `Requested by: ${message.author.username}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            });

        message.reply({ embeds: [embed] });
    },
};