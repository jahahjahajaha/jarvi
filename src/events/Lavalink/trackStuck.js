const { EmbedBuilder } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = async (client, player, track, payload) => {
    
    const channel = client.channels.cache.get(player.textChannel);
    const embed = new EmbedBuilder()
        .setColor("#303037")
        .setDescription(i18n.__("player.track.error"));
    channel.send({embeds: [embed]});
    client.logger.log(`Error when loading song! Track is stuck in [${player.guild}]`, "error");
    if (!player.voiceChannel) player.destroy();

                        }