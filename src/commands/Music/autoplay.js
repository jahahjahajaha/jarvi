const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "autoplay",
  aliases: ["ap", "aplay", "apl", "apls"],
  category: "Music",
  description: "🎶 Toggle autoplay for music playback.",
  args: false,
  usage: "",
  userPerms: [],
  owner: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (message, args, client, prefix) => {
    const player = client.manager.get(message.guild.id);

    if (!player || !player.queue.current) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              "<a:Sorry_uwu:1341819679227908237> | **No active music queue!** Please play a song first."
            ),
        ],
      });
    }

    // Toggle Autoplay
    const autoplay = player.get("autoplay");
    player.set("autoplay", !autoplay);

    const embed = new EmbedBuilder()
      .setColor(client.embedColor)
      .setDescription(
        autoplay
          ? "<a:No_no_no:1341819205187797044> | **Autoplay Disabled!** The bot will stop after the queue ends."
          : "<a:Chec_kmark:1340583433298251846> | **Autoplay Enabled!** The bot will automatically queue similar songs."
      )

    // If enabling autoplay, store data for future use and add a related track
    if (!autoplay) {
      // Store the current track's identifier for future autoplay
      const currentTrack = player.queue.current;
      if (currentTrack && currentTrack.identifier) {
        player.set("identifier", currentTrack.identifier);
        
        // Store the requester info for attribution in autoplay
        player.set("requester", message.author);
        
        // If we're enabling autoplay and the queue is otherwise empty, immediately queue a related track
        if (player.queue.size === 0) {
          try {
            const search = `https://www.youtube.com/watch?v=${currentTrack.identifier}&list=RD${currentTrack.identifier}`;
            const res = await player.search(search, message.author);
            
            if (res.tracks && res.tracks.length > 0) {
              // Choose a random track from the first few (avoiding index 0 which might be the same song)
              const randomIndex = Math.floor(Math.random() * Math.min(5, res.tracks.length - 1)) + 1;
              player.queue.add(res.tracks[randomIndex]);
              
              embed.setDescription(
                "<a:Chec_kmark:1340583433298251846> | **Autoplay Enabled!** Added a similar track to the queue."
              );
            }
          } catch (error) {
            console.error("Autoplay initialization error:", error);
          }
        }
      }
    }

    return message.reply({ embeds: [embed] });
  },
};