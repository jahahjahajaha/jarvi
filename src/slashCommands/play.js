const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube, Spotify, or other supported platforms')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)),
    async execute(interaction, client) {
        // Get user's language preference - Hindi or English (default to English)
        const useHindi = interaction.locale === "hi" || false;
        
        // Messages for both languages
        const messages = {
            needVoiceChannel: useHindi
                ? `❌ आपको संगीत बजाने के लिए वॉइस चैनल में होना चाहिए!`
                : `❌ You need to be in a voice channel to play music!`,
                
            needSameChannel: useHindi
                ? `❌ आपको इस कमांड का उपयोग करने के लिए मेरे साथ एक ही वॉइस चैनल में होना चाहिए!`
                : `❌ You need to be in the same voice channel as me to use this command!`
        };
        
        // Check if user is in voice channel
        if (!interaction.member.voice.channel) {
            return await interaction.reply({ 
                content: messages.needVoiceChannel,
                ephemeral: true 
            });
        }

        // Check if bot is in a different voice channel
        if (interaction.guild.members.me.voice.channel && 
            interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
            return await interaction.reply({
                content: messages.needSameChannel,
                ephemeral: true
            });
        }

        const query = interaction.options.getString('query');

        // Defer the reply since searching and loading might take time
        await interaction.deferReply();

        try {
            // Search for the song
            const res = await client.manager.search(query, interaction.user);
            
            // Handle if no search results
            if (!res.tracks[0]) {
                const noResultsMsg = useHindi
                    ? `❌ "${query}" के लिए कोई परिणाम नहीं मिला!`
                    : `❌ No results found for "${query}"!`;
                    
                return await interaction.editReply({ 
                    content: noResultsMsg,
                    ephemeral: true 
                });
            }

            // Get or create player
            let player = client.manager.get(interaction.guild.id);
            if (!player) {
                player = client.manager.create({
                    guild: interaction.guild.id,
                    voiceChannel: interaction.member.voice.channel.id,
                    textChannel: interaction.channel.id,
                    selfDeafen: true,
                    volume: 80 // Set default volume to 80%
                });
            }

            // Connect to voice channel if not already connected
            if (player.state !== "CONNECTED") player.connect();

            // Handle playlist
            if (res.playlist) {
                player.queue.add(res.tracks);
                
                // Create playlist embed with thumbnail - bilingual support
                const playlistTitle = useHindi ? "प्लेलिस्ट कतार में जोड़ा गया" : "Playlist Added to Queue";
                const totalTracksLabel = useHindi ? "🎵 कुल ट्रैक" : "🎵 Total Tracks";
                const songsText = useHindi ? "गाने" : "songs";
                const durationLabel = useHindi ? "⏱️ अनुमानित अवधि" : "⏱️ Estimated Duration";
                const requestedByLabel = useHindi ? "🎧 अनुरोध किया गया" : "🎧 Requested By";
                const footerText = useHindi ? 
                    `सभी गानों को देखने के लिए /queue का उपयोग करें` : 
                    `Use /queue to see all songs in the queue`;
                
                // Get the optimal thumbnail image from the playlist
                const thumbnail = res.playlist.thumbnail || res.tracks[0].thumbnail || 
                                 `https://img.youtube.com/vi/${res.tracks[0].identifier}/maxresdefault.jpg`;
                
                // Create a beautiful playlist embed with enhanced visuals
                const playlistEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({ 
                        name: playlistTitle, 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTitle(res.playlist.name)
                    .setURL(res.playlist.uri || res.tracks[0].uri)
                    .setDescription(`${useHindi ? '🎶 प्लेलिस्ट में से पहला गाना जल्द ही बजेगा' : '🎶 First song from the playlist will play soon'}`)
                    .setThumbnail(thumbnail)
                    .addFields([
                        { name: totalTracksLabel, value: `\`${res.tracks.length}\` ${songsText}`, inline: true },
                        { name: durationLabel, value: formatTotalDuration(res.tracks), inline: true },
                        { name: requestedByLabel, value: `${interaction.user}`, inline: true },
                        { 
                            name: useHindi ? '💿 प्लेलिस्ट स्रोत' : '💿 Playlist Source', 
                            value: `\`${res.playlist.source || 'YouTube'}\``, 
                            inline: true 
                        }
                    ])
                    .setFooter({ 
                        text: footerText, 
                        iconURL: interaction.user.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                // Start playing if not already playing
                if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) {
                    player.play();
                }
                
                return await interaction.editReply({ embeds: [playlistEmbed] });
            } 
            // Handle single track
            else {
                const track = res.tracks[0];
                player.queue.add(track);
                
                // Create track embed with bilingual support
                const trackTitle = useHindi ? "कतार में जोड़ा गया" : "Added to Queue";
                const durationLabel = useHindi ? "⏱️ अवधि" : "⏱️ Duration";
                const liveText = useHindi ? '🔴 लाइव' : '🔴 LIVE';
                const artistLabel = useHindi ? "👤 कलाकार" : "👤 Artist";
                const unknownText = useHindi ? "अज्ञात" : "Unknown";
                const requestedByLabel = useHindi ? "🎧 अनुरोध किया गया" : "🎧 Requested By";
                const positionLabel = useHindi ? "📋 स्थिति" : "📋 Position";
                const nowPlayingText = useHindi ? "अभी बज रहा है" : "Now Playing";
                const footerText = useHindi ? 
                    `अधिक नियंत्रण के लिए /nowplaying टाइप करें` : 
                    `Type /nowplaying for more controls`;
                
                // Check if track is family-friendly (basic check)
                const isFriendly = !track.title.toLowerCase().includes("explicit") &&
                                  !track.title.toLowerCase().includes("parental advisory");
                
                // Set thumbnail with fallback options
                const thumbnail = track.thumbnail || 
                                 `https://img.youtube.com/vi/${track.identifier}/maxresdefault.jpg`;
                
                // Create enhanced embed for single track
                const embed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({ 
                        name: trackTitle, 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTitle(track.title)
                    .setURL(track.uri)
                    .setDescription(
                        `${useHindi ? '🎵 **कलाकार**: ' : '🎵 **Artist**: '} ${track.author || unknownText}\n` +
                        `${useHindi ? '🔊 **स्रोत**: ' : '🔊 **Source**: '} \`${track.source || 'YouTube'}\`\n` +
                        `${isFriendly ? '👪 Family-Friendly' : ''}`
                    )
                    .setThumbnail(thumbnail)
                    .addFields([
                        { 
                            name: durationLabel, 
                            value: track.duration > 0 ? formatDuration(track.duration) : liveText, 
                            inline: true 
                        },
                        {
                            name: positionLabel,
                            value: player.queue.size === 0 ? 
                                `\`${nowPlayingText}\`` : 
                                `\`#${player.queue.size}\` ${useHindi ? 'में कतार' : 'in queue'}`,
                            inline: true
                        },
                        {
                            name: requestedByLabel,
                            value: `${interaction.user}`,
                            inline: true
                        }
                    ])
                    .setFooter({ 
                        text: footerText,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                // Start playing if not already playing
                if (!player.playing && !player.paused && !player.queue.size) {
                    player.play();
                }
                
                return await interaction.editReply({ embeds: [embed] });
            }
        } catch (err) {
            console.error("Play Command Error:", err);
            
            // Detailed error message to help with debugging
            await interaction.editReply({ 
                content: `❌ An error occurred while playing the song: ${err.message || "Unknown error"}`,
                ephemeral: true 
            });
            
            // Log error to console with more details
            console.error(`Play command error details:`, {
                user: interaction.user.tag,
                guild: interaction.guild.name,
                query: interaction.options.getString('query'),
                error: err
            });
        }
    },
};

// Helper function to format duration
function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours > 0) {
        return `\`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}\``;
    } else {
        return `\`${minutes}:${seconds.toString().padStart(2, '0')}\``;
    }
}

// Helper function to format total duration of multiple tracks
function formatTotalDuration(tracks) {
    const totalMs = tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
    
    if (totalMs <= 0) return '⏳ Unknown';
    
    const seconds = Math.floor((totalMs / 1000) % 60);
    const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
    const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
        return `\`${days}d ${hours}h ${minutes}m\``;
    } else if (hours > 0) {
        return `\`${hours}h ${minutes}m ${seconds}s\``;
    } else {
        return `\`${minutes}m ${seconds}s\``;
    }
}