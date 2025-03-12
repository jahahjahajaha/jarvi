const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),
    async execute(interaction, client) {
        // Get user's language preference - Hindi or English (default to English)
        const useHindi = interaction.locale === "hi" || false;
        
        // Define bilingual messages
        const messages = {
            noMusic: useHindi 
                ? `❌ कोई संगीत नहीं बज रहा है!` 
                : `❌ No music is playing!`,
                
            needVoiceChannel: useHindi
                ? `❌ आपको इस कमांड का उपयोग करने के लिए वॉइस चैनल में होना चाहिए!`
                : `❌ You need to be in a voice channel to use this command!`,
                
            needSameChannel: useHindi
                ? `❌ आपको इस कमांड का उपयोग करने के लिए मेरे साथ एक ही वॉइस चैनल में होना चाहिए!`
                : `❌ You need to be in the same voice channel as me to use this command!`,
                
            notPaused: useHindi
                ? `❌ संगीत रुका हुआ नहीं है!`
                : `❌ The music is not paused!`
        };
        
        const player = client.manager.get(interaction.guild.id);
        
        if (!player) {
            return await interaction.reply({ 
                content: messages.noMusic, 
                ephemeral: true 
            });
        }

        if (!interaction.member.voice.channel) {
            return await interaction.reply({ 
                content: messages.needVoiceChannel, 
                ephemeral: true 
            });
        }

        // Check if user is in the same voice channel as the bot
        if (interaction.guild.members.me.voice.channel && 
            interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) {
            return await interaction.reply({
                content: messages.needSameChannel,
                ephemeral: true
            });
        }

        if (!player.paused) {
            return await interaction.reply({ 
                content: messages.notPaused, 
                ephemeral: true 
            });
        }

        // Resume the player
        player.pause(false);
        
        // Get current song information
        const song = player.queue.current;
        
        // Create enhanced bilingual messages
        const resumeTitle = useHindi 
            ? "⏯️ संगीत पुनः आरंभ किया गया" 
            : "⏯️ Music Resumed";
            
        const thumbnailUrl = song.thumbnail || 
                         `https://img.youtube.com/vi/${song.identifier}/maxresdefault.jpg`;
                           
        const resumedDescription = useHindi 
            ? `▶️ गाना फिर से शुरू किया गया है\n\n**गाना**: [${song.title}](${song.uri})\n**कलाकार**: ${song.author || 'अज्ञात'}\n\n⏸️ गाना फिर से रोकने के लिए \`/pause\` कमांड का उपयोग करें` 
            : `▶️ Song has been resumed\n\n**Title**: [${song.title}](${song.uri})\n**Artist**: ${song.author || 'Unknown'}\n\n⏸️ Use \`/pause\` command to pause playback again`;
            
        const footerText = useHindi
            ? `${interaction.user.tag} द्वारा अनुरोधित • फैमिली-फ्रेंडली म्यूज़िक बॉट`
            : `Requested by ${interaction.user.tag} • Family-Friendly Music Bot`;
        
        // Create an enhanced rich embed response with bilingual support
        const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ 
                name: resumeTitle,
                iconURL: client.user.displayAvatarURL() 
            })
            .setThumbnail(thumbnailUrl)
            .setDescription(resumedDescription)
            .setFooter({ 
                text: footerText, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
