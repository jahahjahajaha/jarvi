const { EmbedBuilder } = require("discord.js");
const { convertTime } = require('../../utils/convert.js');
const i18n = require("../../utils/i18n");

module.exports = async (client, player, track, payload) => {
    // Send a notification to the text channel when a track starts playing
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    // Check if track.requester exists and is a valid user
    const requester = client.users.cache.get(track.requester?.id) || client.user;
    
    const embed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({ 
            name: "Now Playing...",
            iconURL: "https://cdn.discordapp.com/attachments/1288526364286255124/1342190103824437261/uEwUiCNmNP6ATa1c7P.gif"
        })
        .setDescription(`[${track.title}](${track.uri})`)
        .setThumbnail(track.thumbnail)
        .setFooter({ 
            text: `Requested by: ${requester.tag} | Duration: ${convertTime(track.duration)}`,
            iconURL: requester.displayAvatarURL({ dynamic: true })
        });

    await channel.send({ embeds: [embed] }).catch(error => {
        console.error("Error sending track start notification:", error);
    });
};