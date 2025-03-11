const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "invite",
    category: "Information",
    aliases: ["addme", "i", "inv"],
    description: "Get the invite link for the bot",
    args: false,
    usage: "",
    permission: [],
    owner: false,

    execute: async (message, args, client, prefix) => {
        // 🔹 Fetching Bot Stats (Servers & Users)
        const totalServers = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        // 🔹 Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Invite Me")
                .setStyle(ButtonStyle.Link)
                .setEmoji("<a:Plus_gif:1341798987388289144>")
                .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`),
            new ButtonBuilder()
                .setLabel("Support Server")
                .setStyle(ButtonStyle.Link)
                .setEmoji("<a:Information_gif:1341473866551394416>")
                .setURL("https://discord.gg/tBNezcRHMe")
        );

        // 🔹 Embed Message
        const embed = new EmbedBuilder()
            .setAuthor({ name: `🔗 Invite ${client.user.username}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setColor(client.embedColor)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`
### <a:Plus_gif:1341798987388289144> **Invite This Bot**
Use the buttons below to invite this bot to your server or join the support server.

### <a:Statistics:1341471915893723146> **Bot Stats:**  
> <a:Electric_Stovetop:1341471291454001252> **Servers:** \`${totalServers}\`  
> <a:A_girl_Listening_music_Vibegif:1341799217898983454> **Users:** \`${totalUsers}\`
            `)
            .setFooter({
                text: `Requested by: ${message.author.username}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            });

        message.reply({ embeds: [embed], components: [row] });
    },
};