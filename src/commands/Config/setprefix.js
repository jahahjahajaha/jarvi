const { EmbedBuilder } = require("discord.js");
const db = require("../../schema/prefix.js");
const i18n = require("../../utils/i18n");

module.exports = {
  name: i18n.__("cmd.prefix.name"),
  category: "Config",
  description: i18n.__("cmd.prefix.des"),
  args: false,
  botonly: false,
  usage: "<new_prefix>",
  aliases: i18n.__("cmd.prefix.aliases"),
  permission: ["MANAGE_GUILD"],
  owner: false,

  execute: async (message, args, client, prefix) => {
    // Fetch the prefix from database
    const data = await db.findOne({ Guild: message.guildId });

    // If no arguments are provided, show the current prefix
    if (!args.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `${i18n.__("cmd.prefix.embed")} \n\n**Current Prefix:** \`${prefix}\`\nUse \`${prefix}prefix <new_prefix>\` to change it.`
            ),
        ],
      });
    }

    const newPrefix = args[0];

    // Validation: Prefix length should be between 1 and 3 characters
    if (newPrefix.length > 3 || newPrefix.length < 1) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(
              `❌ | **Invalid prefix!**\nThe prefix must be between \`1-3\` characters long.`
            ),
        ],
      });
    }

    // If a prefix already exists, update it
    if (data) {
      data.oldPrefix = prefix;
      data.Prefix = newPrefix;
      await data.save();

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `<a:Chec_kmark:1340583433298251846> | **Prefix updated successfully!**\n\n🔹 **Old Prefix:** \`${prefix}\`\n🔹 **New Prefix:** \`${newPrefix}\``
            ),
        ],
      });
    } else {
      // Create a new entry in the database
      const newData = new db({
        Guild: message.guildId,
        Prefix: newPrefix,
        oldPrefix: prefix,
      });
      await newData.save();

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `<a:Chec_kmark:1340583433298251846> | **Prefix set successfully!**\n\n🔹 **New Prefix:** \`${newPrefix}\``
            ),
        ],
      });
    }
  },
};