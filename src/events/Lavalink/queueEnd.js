const delay = require("delay");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ms = require('ms');
const i18n = require("../../utils/i18n");

module.exports = async (client, player) => {

        const channel = client.channels.cache.get(player.textChannel);
        const emojiwarn = client.emoji.warn;

        const actionRow = new ActionRowBuilder() 
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Vote for Bot")   
                    .setStyle(ButtonStyle.Link)  
                    .setURL(`https://top.gg/bot/${client.user.id}/vote`)
            );
  
        let embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(`➕ | Queue has been ended. Add more songs to keep the party going`)
                .setAuthor({name: `${client.user.username}`, iconURL: client.user.displayAvatarURL()});
        channel.send({embeds: [embed], components: [actionRow]});
}