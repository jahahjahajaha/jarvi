const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const moment = require('moment');

module.exports = {
  name: "guildDelete",
  run: async (client, guild) => {
    try {
      // Fetch the logging channel for guild leaves
      const logChannel = client.channels.cache.get(client.config.logs.leave);
      if (!logChannel) return console.log("[ERROR] Leave log channel not found!");

      // Fetch guild owner
      const owner = await guild.fetchOwner().catch(() => null);

      // Format the creation date
      const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`;

      // Build the description with detailed info
      const description = `
<:Jarvi_Logo:1340405392307388468> **Server Name:** \`${guild.name}\`
<:Reset:1340406899451101194> **Server ID:** \`${guild.id}\`
${owner ? `<a:King_mukut_gif:1342818101816856577> **Owner:** [${owner.user.tag}](https://discord.com/users/${owner.id})\n<:Id_card:1342864306441556121> **Owner ID:** \`${owner.id}\`` : "Owner information unavailable"}
<a:Save_the_date_gif:1342818099610517534> **Created On:** ${createdAt}
<a:Yellow_members_icon_gif:1342819050446782537> **Members:** \`${guild.memberCount.toLocaleString()}\`
      `;

      // Server Stats Field (channels, roles, boosts)
      const channelsCount = guild.channels.cache.size;
      const rolesCount = guild.roles.cache.size;
      const boostsCount = guild.premiumSubscriptionCount || 0;

      const statsField = [
        `<:Chat_Bubble:1342850239886790696> **Channels:** \`${channelsCount}\``,
        `<:Theatre_Mask:1342851810313900095> **Roles:** \`${rolesCount}\``,
        `<a:Discord_rocket:1342842402167324806> **Boosts:** \`${boostsCount}\``
      ].join("\n");

      // Create the embed
      const embed = new MessageEmbed()
        .setColor("#ff4444")
        .setAuthor({ 
          name: `<:Reset:1340406899451101194> Left a Server`, 
          iconURL: guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL() 
        })
        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }) || client.user.displayAvatarURL())
        .setDescription(description)
        .addField("<:List_1:1342011384409358378> Server Stats", statsField, true)
        .setFooter({ 
          text: `${client.user.username} now in ${client.guilds.cache.size} servers`, 
          iconURL: client.user.displayAvatarURL() 
        })
        .setTimestamp();

      // Create action buttons: Owner Profile and View Server
      const buttons = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Owner Profile")
          .setStyle("LINK")
          .setURL(owner ? `https://discord.com/users/${owner.id}` : `${client.bot.supportServer}`),
        new MessageButton()
          .setLabel("View Server (if you are already in that server)")
          .setStyle("LINK")
          .setURL(`https://discord.com/channels/${guild.id}`)
        
      );

      // Send the embed log
      await logChannel.send({ embeds: [embed], components: [buttons] });

    } catch (error) {
      console.error("[ERROR] Guild Delete Event Error:", error);
    }
  }
};