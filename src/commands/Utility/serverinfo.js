const { EmbedBuilder } = require("discord.js");

const verificationLevels = {
  NONE: "<:Warning_Shield:1342833934169542766> None",
  LOW: "<:Low_verification_shield:1342835652169044030> Low",
  MEDIUM: "<:Medium_verification_shield:1342835661723406336> Medium",
  HIGH: "<:High_verification_shield:1342835672465014804> High",
  VERY_HIGH: "<:Very_High_verification_shield:1342835687430553640> Extreme"
};

const boosterLevels = {
  NONE: "<:No_Entry:1342843260795879444> **Level** 0",
  TIER_1: "<a:Discord_rocket:1342842402167324806> **Level** 1",
  TIER_2: "<a:Discord_rocket:1342842402167324806> **Level** 2",
  TIER_3: "<a:Discord_rocket:1342842402167324806> **Level** 3"
};

const disabled = "<a:cross_gif:1342050022954373121>";
const enabled = "<a:Chec_kmark:1340583433298251846>";

module.exports = {
  name: "serverinfo",
  category: "Utility",
  description: "📊 Shows detailed server information with fancy presentation",
  aliases: ["si", "svinfo", "guildinfo","singo"],
  args: false,
  usage: "",
  permission: [],
  voteonly: false,
  owner: false,

  execute: async (message, args, client, prefix) => {
    try {
      const guild = message.guild;
      const owner = await guild.fetchOwner();
      const roles = guild.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString());
      const channels = guild.channels.cache;
      const emojis = guild.emojis.cache;
      const features = guild.features;

      const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
      const banner = guild.bannerURL({ size: 4096 }) || "<:NA:1340621370631131209> No Banner";
      const icon = guild.iconURL({ dynamic: true, size: 4096 }) || "<:NA:1340621370631131209> No Icon";

      const totalRoles = guild.roles.cache.size;
      const rolesDisplay = roles.slice(0, 15).join(' ') + (totalRoles > 15 ? `\n<:Plus:1340935740825141259> **+${totalRoles - 15} more roles** (Use \`${prefix}rolelist\`)` : "");

      const embed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({ name: `${guild.name} | Server Information`, iconURL: guild.iconURL({ dynamic: true }) })
        .setThumbnail(owner.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setImage(guild.bannerURL({ size: 4096 }))
        .setDescription(
          `## <a:Information_gif:1341473866551394416> **Server Overview**\n` +
          `▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n` +
          `<:Jarvi_Logo:1340405392307388468> **Name:** [${guild.name}](https://discord.com/channels/${guild.id})\n` +
          `<:Dog_tag:1342864951718449152> **ID:** \`${guild.id}\`\n` +
          `<a:King_mukut_gif:1342818101816856577> **Owner:** [${owner.user.tag}](https://discord.com/users/${guild.ownerId})\n` +
          `<:Id_card:1342864306441556121> **Owner ID:** \`${guild.ownerId}\`\n` +
          `<a:Save_the_date_gif:1342818099610517534> **Created:** ${createdAt}\n` +
          `<a:Yellow_members_icon_gif:1342819050446782537> **Members:** \`${guild.memberCount.toLocaleString()}\``
        )
        .addFields(
          {
            name: "<:Tools:1340946262131736626> Server Specifications",
            value: [
              `<:Lock:1342848775823163445> **Verification:** ${verificationLevels[guild.verificationLevel]}`,
              `<:Sleeping_AFK:1342848501071220848> **AFK Channel:** ${guild.afkChannel ? guild.afkChannel.toString() : disabled}`,
              `<a:Progress_gif:1341843608327950411> **AFK Timeout:** \`${guild.afkTimeout / 60} minutes\``,
              `<:Paper_Plane:1342849627522601030> **System Channel:** ${guild.systemChannel || disabled}`,
              `<a:Boost_gif:1342820038465552476> **Boost Bar:** ${guild.premiumProgressBarEnabled ? enabled : disabled}`
            ].join("\n"),
            inline: true
          },
          {
            name: "<:Filter:1340944936241205278> Channel Statistics",
            value: [
              `<:Cmd:1341469332969885736> **Total:** \`${channels.size}\``,
              `<:Chat_Bubble:1342850239886790696> **Text:** \`${channels.filter(c => c.type === 0).size}\``, // 0 is GUILD_TEXT in v14
              `<:Audio:1342850561120276580> **Voice:** \`${channels.filter(c => c.type === 2).size}\``, // 2 is GUILD_VOICE in v14
              `<:Satellite_Signal:1342849229277888614> **Categories:** \`${channels.filter(c => c.type === 4).size}\`` // 4 is GUILD_CATEGORY in v14
            ].join("\n"),
            inline: true
          },
          {
            name: "<:Animation_Characters:1342851447078781031> Emoji Statistics",
            value: [
              `<:Equalizer:1340423721315340401> **Static:** \`${emojis.filter(e => !e.animated).size}\``,
              `<a:infinite_gif:1341844261003460618> **Animated:** \`${emojis.filter(e => e.animated).size}\``,
              `<:Theatre_Mask:1342851810313900095> **Total:** \`${emojis.size}\``
            ].join("\n"),
            inline: true
          },
          {
            name: "<a:Rocket_boost_gif:1342804400132849664> Boost Status",
            value: [
              `${boosterLevels[guild.premiumTier]}`,
              `<a:Boosts_gif:1342838252159107102> **Boosts:** \`${guild.premiumSubscriptionCount || 0}\``,
              `<a:Discord_rocket:1342842402167324806> **Boosters:** \`${guild.members.cache.filter(m => m.premiumSince).size}\``
            ].join("\n"),
            inline: true
          },
          {
            name: `<:List_1:1342011384409358378> Roles (${totalRoles})`,
            value: totalRoles > 0 ? rolesDisplay : "<:NA:1340621370631131209> No Roles",
            inline: false
          },
          {
            name: "<:Modules:1340943031221878784> Server Features",
            value: features.length > 0 
              ? features.map(f => `\`${f.split('_').join(' ')}\``).join(' • ') 
              : "<:NA:1340621370631131209> No Special Features",
            inline: false
          }
        )
        .setFooter({ 
          text: `Requested by ${message.author.tag} • ${guild.name}`, 
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

    } catch (error) {
      console.error("Server Info Command Error:", error);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor("#FF0000")
          .setDescription(`<:Error:1342852856784359535> **An error occurred:** \`${error.message}\``)
        ]
      });
    }
  },
};