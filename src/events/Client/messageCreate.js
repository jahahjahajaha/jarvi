const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const db = require("../../schema/prefix.js");
const i18n = require("../../utils/i18n");
const { checkDevRole } = require("../../utils/roleCheck");

module.exports = {
    name: "messageCreate",
    run: async (client, message) => {
        if (message.author.bot) return;
        if (!message.guild) return;

        let prefix = client.prefix;
        const channel = message?.channel;
        const ress = await db.findOne({Guild: message.guildId})
        if(ress && ress.Prefix) prefix = ress.Prefix;

        // Handle mention as prefix
        const mentionRegex = new RegExp(`^<@!?${client.user.id}>( |)$`);
        const mentionPrefixRegex = new RegExp(`^<@!?${client.user.id}> `);

        let usedPrefix = null;

        // Check which prefix was used
        if (message.content.match(mentionRegex)) {
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("Invite")
                        .setStyle(ButtonStyle.Link)
                        .setURL(client.config.bot.inviteURL),
                    new ButtonBuilder()
                        .setLabel("Support")
                        .setStyle(ButtonStyle.Link)
                        .setURL(process.env.SUPPORT_SERVER),
                    new ButtonBuilder()
                        .setLabel("Made by KnarliX")
                        .setStyle(ButtonStyle.Link)
                        .setURL("https://discord.gg/tBNezcRHMe")
                );

            const embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setTitle(`Settings For ${message.guild.name}`)
                .setFooter({ text: client.embed.footertext, iconURL: client.embed.footericon })
                .setDescription(`**My prefix here is \`${prefix}\`\nServer Id: \`${message.guild.id}\`\n\nType ${prefix}help or mention me with a command to see all commands**`);

            return message.channel.send({ embeds: [embed], components: [actionRow] });
        }

        if (message.content.startsWith(prefix)) {
            usedPrefix = prefix;
        } else if (message.content.match(mentionPrefixRegex)) {
            usedPrefix = message.content.match(mentionPrefixRegex)[0];
        }

        if (!usedPrefix) return;

        const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName) ||
            client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;

        // Skip bot-only commands
        if (command.botonly) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setDescription(`${client.emoji.info} This feature is currently disabled.`)
                ]
            });
        }

        // Permission checks using PermissionsBitField
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.SendMessages)) {
            return await message.author.dmChannel?.send({
                content: `I don't have permission to send messages in <#${message.channel.id}>`
            }).catch(() => {});
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ViewChannel)) return;

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
            return await message.channel.send({
                content: `I need the \`EMBED_LINKS\` permission to work properly!`
            }).catch(() => {});
        }

        const embed = new EmbedBuilder().setColor(client.embedColor);

        // Command argument check
        if (command.args && !args.length) {
            let reply = `You didn't provide any arguments!`;
            if (command.usage) {
                reply += `\nProper usage: \`${usedPrefix}${command.name} ${command.usage}\``;
            }
            embed.setDescription(reply);
            return message.channel.send({ embeds: [embed] });
        }

        // Permission and role checks
        if (command.permission && !message.member.permissions.has(command.permission)) {
            embed.setDescription("You don't have permission to use this command!");
            return message.channel.send({ embeds: [embed] });
        }

        if (command.devOnly && !checkDevRole(message.member)) {
            embed.setDescription("❌ | Only developers can use this command!");
            return message.channel.send({ embeds: [embed] });
        }

        // Music player checks
        const player = message.client.manager.get(message.guild.id);

        if (command.player && !player) {
            embed.setDescription("There is no music playing!");
            return message.channel.send({ embeds: [embed] });
        }

        if (command.inVoiceChannel && !message.member.voice.channelId) {
            embed.setDescription("You need to be in a voice channel!");
            return message.channel.send({ embeds: [embed] });
        }

        if (command.sameVoiceChannel && message.guild.members.me.voice.channel) {
            if (message.guild.members.me.voice.channelId !== message.member.voice.channelId) {
                embed.setDescription(`You must be in the same channel as ${message.client.user}!`);
                return message.channel.send({ embeds: [embed] });
            }
        }

        try {
            await command.execute(message, args, client, usedPrefix);
        } catch (error) {
            console.error("Command execution error:", error);
            embed.setDescription("There was an error executing that command!");
            return message.channel.send({ embeds: [embed] });
        }
    }
};