const { EmbedBuilder } = require("discord.js");
const i18n = require("../../utils/i18n");

module.exports = async (client, player, track, payload) => {
    console.error(payload.error);

    const channel = client.channels.cache.get(player.textChannel);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(i18n.__("player.track.error"));
        
        channel.send({embeds: [embed]}).catch(error => {
            console.error("Error sending track error notification:", error);
        });
    }
    
    if (client.logger) {
        client.logger.log(`Error when loading song! Track is error in [${player.guild}]`, "error");
    } else {
        console.error(`Error when loading song! Track is error in [${player.guild}]`);
    }
    
    if (!player.voiceChannel) player.destroy();

}