module.exports = async (client, player, track, playload) => {
    if (!player) return;

    // Check if autoplay is enabled
    const autoplay = player.get("autoplay");
    
    // If current queue is empty and autoplay is enabled, add a related track
    if (autoplay === true && player.queue.size === 0) {
        try {
            // Get the original requester information
            const requester = player.get("requester");
            const requesterObj = requester?.id ? client.users.cache.get(requester.id) : client.user;
            
            // Get the identifier from the track that just ended
            const identifier = track?.identifier || player.get("identifier");
            
            if (!identifier) {
                client.logger.log("No track identifier found for autoplay", "warn");
                return;
            }
            
            // Search for related tracks using YouTube mix/RD playlist
            const search = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
            const res = await player.search(search, requesterObj);

            // Check if search returned tracks
            if (res.tracks && res.tracks.length > 0) {
                // Choose a random track from the first few results (avoiding the first one which might be the same)
                const randomIndex = Math.floor(Math.random() * Math.min(5, res.tracks.length));
                const nextTrack = res.tracks[randomIndex];
                
                // Add track to queue
                player.queue.add(nextTrack);

                // Send notification to the command channel
                const channel = client.channels.cache.get(player.textChannel);
                if (channel) {
                    try {
                        const embed = client.createEmbed(
                            "Autoplay",
                            `<:Song_add_in_queue:1341967211790860331> | **Added to queue** - [${nextTrack.title}](${nextTrack.uri})\n**Autoplay by:** ${requesterObj.tag || requesterObj.username || "System"}`
                        );
                        await channel.send({ embeds: [embed] });
                    } catch (error) {
                        client.logger.log(`Failed to send autoplay notification: ${error.message}`, "error");
                    }
                }
            } else {
                client.logger.log("No related tracks found for autoplay", "warn");
            }
        } catch (error) {
            client.logger.log(`Autoplay error: ${error.message}`, "error");
        }
    }
};