const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "help",
    category: "Information",
    aliases: ["h", "halp", "support", "commands", "setup"],
    description: "Get Help Menu",
    args: false,
    usage: "",
    permission: [],
    owner: false,
    execute: async (message, args, client, prefix) => {

        // 🎛️ Buttons for Support & Invite
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Add Me")
                    .setStyle(ButtonStyle.Link)
                    .setEmoji("<:Plus:1340935740825141259>")
                    .setURL(client.config.bot.inviteURL), 

                new ButtonBuilder()
                  .setLabel("Support Server")
                  .setStyle(ButtonStyle.Link)
                  .setEmoji("<:Help:1340939355035799603>")
                  .setURL("https://discord.gg/tBNezcRHMe") 
            );

        // 📜 Help Embed
        let helpMenu = new EmbedBuilder()
            .setAuthor({ name: `Welcome to ${client.user.username} Help Menu!`, iconURL: client.user.displayAvatarURL() })
            .setColor(client.embedColor)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(`### **Music companion for your Discord server**


## **<a:Link:1341469206478061589> Quick Links:**
- <:Plus:1340935740825141259> **[Add Bot](${client.config.bot.inviteURL})**  
- <:Help:1340939355035799603> **[Support](https://discord.gg/tBNezcRHMe)**  

### **<a:Information_gif:1341473866551394416> Bot Information:**
> Server Name: **\`${message.guild.name}\`**
> Server ID: **\`${message.guild.id}\`**
> Server Prefix: **\`${prefix}\`**

### **<a:Statistics:1341471915893723146> Bot Statistics:**
> Total Servers: **\`${client.guilds.cache.size}\`**
> Total Users: **\`${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\`**
> Total Commands: **\`${client.commands.size}\`**


### **<:Cmd:1341469332969885736> Basic Commands:**
> **\`${prefix}play\` ___<song name/url>___** - play a song. **[\`${prefix}p\`]**
> **\`${prefix}skip\`** - skip the current song. **[\`${prefix}s\`]**
> **\`${prefix}stop\`** - stop the qeue. **[\`${prefix}stp\`]**
> **\`${prefix}pause\`** - pause the current song. **[\`${prefix}ps\`]**
> **\`${prefix}resume\`** - resume the current song. **[\`${prefix}rs\`]**
> **\`${prefix}loop\`** - loop the current song. **[\`${prefix}lp\`]**

### **🔍 Select a category below to explore commands!**
            `);

        // 📜 Select Menu for Modules
        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('help')
                    .setPlaceholder('🔍 Select a module to view its commands')
                    .addOptions([
                        {
                            label: 'Info',
                            description: 'Show information commands',
                            value: 'first',
                            emoji: '<:Info:1340943602855186522>'
                        },
                        {
                            label: 'Music',
                            description: 'Show music commands',
                            value: 'second',
                            emoji: '<:Music:1340944686340243497>'
                        },
                        {
                            label: 'Filters',
                            description: 'Show music filter commands',
                            value: 'fourth',
                            emoji: '<:Filter:1340944936241205278>'
                        },   
                        {
                            label: 'Utility',
                            description: 'Show utility commands',
                            value: 'sixth',
                            emoji: '<:Tools:1340946262131736626>'
                        },         
                        {
                            label: 'Config',
                            description: 'Show configuration commands',
                            value: 'fifth',
                            emoji: '<:Config:1340947204222750780>'
                        },
                        {
                            label: 'All Commands',
                            description: 'View all available commands',
                            value: 'third',
                            emoji: '<:List:1340948013627080735>'
                        }           
                    ])
            );

        if (!args[0]) return message.reply({ embeds: [helpMenu], components: [selectMenu, buttons] });
    }
}