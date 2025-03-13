const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "noprefix",
  category: "Dev",
  description: "Manage users who can use commands without prefix",
  aliases: ["nop", "prefix-exempt", "prefix-bypass"],
  args: false,
  usage: "<add/remove/list> [user]",
  permission: [],
  owner: true,
  execute: async (message, args, client, prefix) => {
    // Developer IDs with permission to manage no-prefix users
    const authorizedDevs = ["1212719184870383621", "1045714939676999752"];
    
    if (!authorizedDevs.includes(message.author.id)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ | You don't have permission to use this command.\n*Only authorized developers can manage no-prefix access.*")
        ]
      });
    }
    
    // Show help menu if no arguments provided
    if (!args[0]) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setTitle("No-Prefix Management")
            .setDescription("Grant or revoke the ability for users to use commands without prefix")
            .addFields([
              { 
                name: "Available Options", 
                value: `\`${prefix}noprefix add <user>\` - Add a user to no-prefix list
\`${prefix}noprefix remove <user>\` - Remove a user from no-prefix list
\`${prefix}noprefix list\` - View all users with no-prefix access`
              }
            ])
        ]
      });
    }
    
    const option = args[0].toLowerCase();
    
    // Handle list option - show all users with no-prefix access
    if (option === "list") {
      // Fetch all no-prefix users from database
      const allKeys = await client.db.list("noprefix_");
      if (!allKeys || allKeys.length === 0) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Yellow")
              .setDescription("📝 | No users have been granted no-prefix access yet.")
          ]
        });
      }
      
      // Filter and fetch only users with no-prefix enabled
      const noPrefixUsers = [];
      for (const key of allKeys) {
        const userId = key.replace("noprefix_", "");
        const hasAccess = await client.db.get(key);
        
        if (hasAccess === "true") {
          // Try to get user information
          try {
            const user = await client.users.fetch(userId);
            noPrefixUsers.push({
              id: userId,
              tag: user.tag,
              mention: `<@${userId}>`
            });
          } catch (err) {
            // If user cannot be fetched (left the server, etc.)
            noPrefixUsers.push({
              id: userId,
              tag: "Unknown User",
              mention: `<@${userId}> (ID: ${userId})`
            });
          }
        }
      }
      
      if (noPrefixUsers.length === 0) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Yellow")
              .setDescription("📝 | No users have been granted no-prefix access yet.")
          ]
        });
      }
      
      // Create the embed with user list
      const userListEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setTitle("🔑 No-Prefix Access List")
        .setDescription(`The following users can use commands without prefix:`)
        .addFields([
          { 
            name: `Users with No-Prefix Access (${noPrefixUsers.length})`, 
            value: noPrefixUsers.map((u, index) => `${index + 1}. ${u.mention} - \`${u.tag}\``).join('\n')
          }
        ])
        .setFooter({ text: `Total: ${noPrefixUsers.length} users` })
        .setTimestamp();
        
      return message.channel.send({ embeds: [userListEmbed] });
    }
    
    // Add or remove options require a user mention
    if (option === "add" || option === "remove") {
      // Extract user from mention or ID
      const userArg = args[1];
      if (!userArg) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(`❌ | Please provide a user mention or ID.\nUsage: \`${prefix}noprefix ${option} <user>\``)
          ]
        });
      }
      
      // Try to get user from mention or ID
      const userId = userArg.replace(/[<@!>]/g, "");
      let targetUser;
      
      try {
        targetUser = await client.users.fetch(userId);
      } catch (error) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("❌ | Invalid user. Please provide a valid user mention or ID.")
          ]
        });
      }
      
      // Check if user is a bot
      if (targetUser.bot) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("❌ | Bots cannot be added to the no-prefix list.")
          ]
        });
      }
      
      // Get current no-prefix status
      let currentStatus = await client.db.get(`noprefix_${targetUser.id}`);
      if (!currentStatus) {
        await client.db.set(`noprefix_${targetUser.id}`, "false");
        currentStatus = "false";
      }
      
      // Add user to no-prefix list
      if (option === "add") {
        if (currentStatus === "true") {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`ℹ️ | ${targetUser.tag} already has no-prefix access.`)
            ]
          });
        }
        
        await client.db.set(`noprefix_${targetUser.id}`, "true");
        
        // Create confirmation message with buttons
        const confirmEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ No-Prefix Access Granted")
          .setDescription(`Successfully added **${targetUser.tag}** to the no-prefix list.`)
          .addFields([
            { name: "User", value: `${targetUser} (ID: ${targetUser.id})`, inline: true },
            { name: "Added By", value: `${message.author} (${message.author.tag})`, inline: true },
          ])
          .setFooter({ text: "This user can now use commands without prefix" })
          .setTimestamp();
          
        const notifyBtn = new ButtonBuilder()
          .setCustomId("noprefix_notify")
          .setLabel("Notify User")
          .setStyle(ButtonStyle.Primary);
          
        const revokeBtn = new ButtonBuilder()
          .setCustomId("noprefix_revoke")
          .setLabel("Revoke Access")
          .setStyle(ButtonStyle.Danger);
          
        const row = new ActionRowBuilder().addComponents(notifyBtn, revokeBtn);
        
        const confirmMsg = await message.channel.send({
          embeds: [confirmEmbed],
          components: [row]
        });
        
        // Create collector for button interactions
        const collector = confirmMsg.createMessageComponentCollector({ 
          filter: i => i.user.id === message.author.id,
          time: 60000 // 1 minute timeout
        });
        
        collector.on("collect", async (interaction) => {
          await interaction.deferUpdate();
          
          if (interaction.customId === "noprefix_notify") {
            try {
              await targetUser.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setTitle("🔑 No-Prefix Access Granted")
                    .setDescription(`You have been granted **no-prefix access** by ${message.author.tag}.\n\nYou can now use commands without adding a prefix before them.`)
                    .setFooter({ text: `Granted by: ${message.author.tag}` })
                    .setTimestamp()
                ]
              });
              
              message.channel.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`✅ | Successfully notified ${targetUser.tag} about their no-prefix access.`)
                ]
              });
            } catch (error) {
              message.channel.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`❌ | Could not DM ${targetUser.tag}. They may have DMs disabled.`)
                ]
              });
            }
            
            collector.stop();
          } else if (interaction.customId === "noprefix_revoke") {
            await client.db.set(`noprefix_${targetUser.id}`, "false");
            
            message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor("Red")
                  .setDescription(`✅ | No-prefix access for ${targetUser.tag} has been revoked.`)
              ]
            });
            
            collector.stop();
          }
        });
        
        collector.on("end", () => {
          confirmMsg.edit({ components: [] }).catch(() => {});
        });
        
        return;
      }
      
      // Remove user from no-prefix list
      if (option === "remove") {
        if (currentStatus === "false") {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Yellow")
                .setDescription(`ℹ️ | ${targetUser.tag} doesn't have no-prefix access.`)
            ]
          });
        }
        
        await client.db.set(`noprefix_${targetUser.id}`, "false");
        
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setTitle("✅ No-Prefix Access Revoked")
              .setDescription(`Successfully removed **${targetUser.tag}** from the no-prefix list.`)
              .addFields([
                { name: "User", value: `${targetUser} (ID: ${targetUser.id})`, inline: true },
                { name: "Removed By", value: `${message.author} (${message.author.tag})`, inline: true },
              ])
              .setFooter({ text: "This user will now need to use the prefix for commands" })
              .setTimestamp()
          ]
        });
      }
    }
    
    // If command doesn't match any option
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setDescription(`❌ | Invalid option. Use \`${prefix}noprefix\` to see available options.`)
      ]
    });
  }
};