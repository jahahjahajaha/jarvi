const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands'),
    async execute(interaction, client) {
        // Get user's language preference - Hindi or English (default to English)
        const useHindi = interaction.locale === "hi" || false;
        
        const title = useHindi ? 
            `${client.user.username} सहायता मेन्यू` : 
            `${client.user.username} Help Menu`;
            
        const greeting = useHindi ?
            `नमस्ते! मैं Discord के लिए एक म्यूजिक बॉट हूँ। यहां मेरे कमांड्स हैं:` :
            `Greetings! I am a music bot for Discord. Here are my commands:`;
            
        const musicCommandsTitle = useHindi ? 
            "🎵 आवश्यक संगीत कमांड्स" : 
            "🎵 Essential Music Commands";
            
        const musicCommandsValue = useHindi ?
            '`/play` - नाम या URL से गाना बजाएं\n`/pause` - वर्तमान प्लेबैक रोकें\n`/resume` - रुका हुआ प्लेबैक फिर से शुरू करें' :
            '`/play` - Play a song by name or URL\n`/pause` - Pause current playback\n`/resume` - Resume paused playback';
            
        const additionalInfoTitle = useHindi ?
            "ℹ️ अतिरिक्त जानकारी" :
            "ℹ️ Additional Information";
            
        const additionalInfoValue = useHindi ?
            '`/help` - यह सहायता मेन्यू दिखाता है' :
            '`/help` - Shows this help menu';
            
        const footerText = useHindi ?
            `टेक्स्ट कमांड्स के लिए बॉट प्रीफिक्स: ${client.prefix}` :
            `Bot Prefix for text commands: ${client.prefix}`;
        
        const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ name: title, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(greeting)
            .addFields([
                { 
                    name: musicCommandsTitle,
                    value: musicCommandsValue
                },
                {
                    name: additionalInfoTitle,
                    value: additionalInfoValue
                }
            ])
            .setFooter({ 
                text: footerText
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};