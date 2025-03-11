const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "node",
  category: "Information",
  description: "Shows Lavalink node status",
  args: false,
  usage: "",
  permission: [],
  owner: true, // 🔥 Only bot owner can use this command

  execute: async (message, args, client, prefix) => {
    if (!client.manager || !client.manager.nodes.size) {
      return message.reply("❌ **Lavalink node is not connected or not set up properly!**");
    }

    const allNodes = client.manager.nodes.map((node, index) => {
      const uptime = new Date(node.stats.uptime).toISOString().slice(11, 19);
      const memoryUsage = Math.round(node.stats.memory.reservable / 1024 / 1024);
      const state = node.connected ? "🟢 CONNECTED" : "🔴 DISCONNECTED";

      return `NODE ID    ::  NODE-${index + 1}
NODE STATE ::  ${state}
PLAYERS    ::  ${node.stats.players}
UPTIME     ::  ${uptime}
MEMORY     ::  ${memoryUsage} MB
CPU CORES  ::  ${node.stats.cpu.cores}`;
    }).join("\n━━━━━━━━━━━━━━━\n");

    const embed = new MessageEmbed()
      .setAuthor({ name: "⚙️ Lavalink Node Status", iconURL: client.user.displayAvatarURL() })
      .setDescription(allNodes.length ? `\`\`\`${allNodes}\`\`\`` : "❌ No Lavalink nodes found!")
      .setColor(client.embedColor)
      .setFooter({ text: `Requested by: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    message.reply({ embeds: [embed] });
  },
};