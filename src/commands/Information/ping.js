const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping",
    category: "Information",
    description: "Check bot's latency and response time",
    args: false,
    usage: "",
    permission: [],
    botonly: false,
    owner: false,

    execute: async (message, args, client, prefix) => {
        const pingMsg = await message.reply("<a:Ping:1341813752282222704> **Pinging...**");

        const botLatency = pingMsg.createdTimestamp - message.createdTimestamp;
        const apiLatency = client.ws.ping;

        const embed = new EmbedBuilder()
            .setAuthor({ name: "📶 Bot Ping Status", iconURL: client.user.displayAvatarURL() })
            .setColor(client.embedColor)
            .setDescription(`
🔹 **Bot Latency:** \`${botLatency}ms\`
🔹 **API Latency:** \`${apiLatency}ms\`
            `)
            .setFooter({ text: `Requested by: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        pingMsg.edit({ content: "<a:Pong:1341814258685444240> Pong!", embeds: [embed] });
    }
};