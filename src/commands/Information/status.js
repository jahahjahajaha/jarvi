const { EmbedBuilder, version } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");
const os = require("os");
const si = require("systeminformation");

module.exports = {
    name: "status",
    category: "Information",
    aliases: ["stats", "st"],
    description: "Show the bot's current status and system information.",
    args: false,
    usage: "",
    permission: [],
    owner: false,

    execute: async (message, args, client, prefix) => {
        const ownerID = process.env.OWNERID || "1212719184870383621";
        const botOwner = await client.users.fetch(ownerID).catch(() => null);

        const uptimeFormatted = moment.duration(client.uptime).format("D [days], H [hrs], m [mins], s [secs]");
        const cpuInfo = await si.cpu();

        const totalServers = client.guilds.cache.size;
        const totalChannels = client.channels.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const botPing = client.ws.ping;
        const botPFP = client.user.displayAvatarURL({ dynamic: true, size: 1024 });
        const ownerPFP = botOwner ? botOwner.displayAvatarURL({ dynamic: true, size: 1024 }) : botPFP;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Bot Information`, iconURL: botPFP })
            .setColor(client.embedColor)
            .setDescription(`🚀 **A next-generation Discord bot with advanced features, customization, and high performance.**`)
            .setThumbnail(botPFP)
            .addFields(
                { name: "🌍 **Servers**", value: `\`${totalServers}\``, inline: true },
                { name: "📢 **Channels**", value: `\`${totalChannels}\``, inline: true },
                { name: "👥 **Users**", value: `\`${totalUsers}\``, inline: true },
                { name: "⚡ **Bot Latency**", value: `\`${botPing}ms\``, inline: true },
                { name: "🛠️ **Node.js Version**", value: `\`${process.version}\``, inline: true },
                { name: "📦 **Discord.js Version**", value: `\`${version}\``, inline: true },
                { name: "🖥️ **Platform**", value: `\`${os.type()}\``, inline: true },
                { name: "⏳ **Uptime**", value: `\`${uptimeFormatted}\``, inline: true },
                { name: "💾 **CPU Cores**", value: `\`${cpuInfo.cores}\``, inline: true },
                { name: "🔧 **CPU Model**", value: `\`${os.cpus()[0].model}\``, inline: false },
                { name: "⚙️ **CPU Speed**", value: `\`${os.cpus()[0].speed}MHz\``, inline: false }
            )
            .setFooter({ text: `Requested by: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        message.reply({ embeds: [embed] });
    },
};