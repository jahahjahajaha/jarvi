const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
  name: "guildCreate",
  run: async (client, guild) => {
    try {
      const logChannel = client.channels.cache.get(client.config.logs.join);
      if (!logChannel) return console.log("[ERROR] Join log channel not found!");

      // Fetch Owner
      const owner = await guild.fetchOwner().catch(() => null);

      // Community Enabled Check
      const isCommunity = guild.features.includes("COMMUNITY");
      let inviteLink = "Not Available";

      // Invite Link Creation
      try {
        const channels = guild.channels.cache;
        let inviteChannel = channels.find(c => c.type === "GUILD_TEXT" && (isCommunity 
          ? ["RULES_CHANNEL", "MODERATOR_ONLY"].includes(c.type)
          : true
        ));

        if (!inviteChannel) inviteChannel = channels.find(c => c.type === "GUILD_TEXT");

        if (inviteChannel) {
          const invite = await inviteChannel.createInvite({
            maxAge: 0, // Permanent Invite
            maxUses: 0
          });
          inviteLink = invite.url;
        }
      } catch (err) {
        console.error("[ERROR] Invite Creation Failed:", err);
      }

      // Fetching Inviter (If Available)
      let inviter = "Unknown";
      try {
        const auditLogs = await guild.fetchAuditLogs({ type: "BOT_ADD", limit: 1 });
        const entry = auditLogs.entries.first();
        if (entry) inviter = `${entry.executor.tag} (\`${entry.executor.id}\`)`;
      } catch (err) {
        console.error("[ERROR] Inviter Fetch Failed:", err);
      }

      // Server Info Embed
      const embed = new MessageEmbed()
        .setColor('#44ff44')
        .setAuthor({ name: `📥 Joined a New Server!`, iconURL: guild.iconURL({ dynamic: true }) })
        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }) || client.user.displayAvatarURL())
        .setDescription(`
          <:Jarvi_Logo:1340405392307388468> **Server Name:** \`${guild.name}\`
          <a:Config_gif:1340947266772533360> **Server ID:** \`${guild.id}\`
          ${owner ? `<a:King_mukut_gif:1342818101816856577> **Owner:** [${owner.user.tag}](https://discord.com/users/${owner.id})\n<:Id_card:1342864306441556121> **Owner ID:** \`${owner.id}\`` : ''}
          <a:Save_the_date_gif:1342818099610517534> **Created On:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>
          <a:Yellow_members_icon_gif:1342819050446782537> **Members:** \`${guild.memberCount.toLocaleString()}\`
          🛡 **Community Enabled:** \`${isCommunity ? "Yes ✅" : "No ❌"}\`
        `)
        .addFields(
          { name: "📌 Server Details", value: [
              `<:Chat_Bubble:1342850239886790696> **Channels:** \`${guild.channels.cache.size}\``,
              `<:Theatre_Mask:1342851810313900095> **Roles:** \`${guild.roles.cache.size}\``,
              `<a:Discord_rocket:1342842402167324806> **Boosts:** \`${guild.premiumSubscriptionCount || 0}\``
            ].join("\n"), inline: true
          },
          { name: "🔗 Invite Link", value: `[Click Here](${inviteLink})`, inline: true },
          { name: "🤝 Invited By", value: inviter, inline: false }
        )
        .setFooter({ 
          text: `${client.user.username} now in ${client.guilds.cache.size} servers`,
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();

      // Buttons
      const buttons = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel('Join Server')
          .setStyle('LINK')
          .setURL(inviteLink)
          .setDisabled(inviteLink === "Not Available"),
        new MessageButton()
          .setLabel('Owner Profile')
          .setStyle('LINK')
          .setURL(owner ? `https://discord.com/users/${owner.id}` : `${client.bot.supportServer}`)
          .setDisabled(!owner)
      );

      // Send Log
      await logChannel.send({
        embeds: [embed],
        components: [buttons]
      });

    } catch (error) {
      console.error('[ERROR] Guild Create Event Error:', error);
    }
  }
};