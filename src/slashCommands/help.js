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
        
        // Create family-friendly description with additional info
        const enhancedGreeting = useHindi ?
            `नमस्ते! 👋 मैं Discord के लिए एक परिवार के अनुकूल संगीत बॉट हूँ। मैं आपके सर्वर पर सुरक्षित और आनंददायक संगीत अनुभव प्रदान करता हूँ।\n\n**हिंदी और अंग्रेज़ी दोनों** भाषाओं का समर्थन है! 🇮🇳 🇬🇧` :
            `Greetings! 👋 I am a family-friendly music bot for Discord. I provide a safe and enjoyable music experience on your server.\n\n**Both Hindi and English** languages are supported! 🇮🇳 🇬🇧`;
            
        // Create enhanced fields
        const musicCommandsEnhanced = useHindi ?
            '`/play` - गाने का नाम या URL से गाना बजाएं 🎵\n`/pause` - वर्तमान गाने को रोकें ⏸️\n`/resume` - रुका हुआ गाना फिर से शुरू करें ▶️' :
            '`/play` - Play a song by name or URL 🎵\n`/pause` - Pause current playback ⏸️\n`/resume` - Resume paused playback ▶️';
            
        const usageInfoTitle = useHindi ?
            "🎮 उपयोग उदाहरण" :
            "🎮 Usage Examples";
            
        const usageInfoValue = useHindi ?
            '`/play मेरा फेवरेट गाना` - गाने का नाम से खोजें\n`/play https://...` - YouTube या SoundCloud URL से बजाएं' :
            '`/play my favorite song` - Search by song name\n`/play https://...` - Play from YouTube or SoundCloud URL';
            
        const featuresTitle = useHindi ?
            "✨ विशेषताएँ" :
            "✨ Features";
            
        const featuresValue = useHindi ?
            '• परिवार के अनुकूल सामग्री\n• हिंदी और अंग्रेज़ी भाषा समर्थन\n• YouTube, SoundCloud और अन्य स्रोतों से संगीत' :
            '• Family-friendly content\n• Hindi and English language support\n• Music from YouTube, SoundCloud and more';
            
        const supportTitle = useHindi ?
            "🤝 सहायता" :
            "🤝 Support";
            
        const supportValue = useHindi ?
            'किसी भी समस्या के लिए सर्वर एडमिन से संपर्क करें।' :
            'Contact the server admin for any issues.';
        
        // Enhanced footer text
        const enhancedFooter = useHindi ?
            `${client.user.username} • संगीत बॉट • ${client.guilds.cache.size} सर्वर` :
            `${client.user.username} • Music Bot • ${client.guilds.cache.size} servers`;
        
        const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ 
                name: title, 
                iconURL: client.user.displayAvatarURL() 
            })
            .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
            .setDescription(enhancedGreeting)
            .addFields([
                { 
                    name: musicCommandsTitle,
                    value: musicCommandsEnhanced
                },
                {
                    name: usageInfoTitle,
                    value: usageInfoValue
                },
                {
                    name: featuresTitle,
                    value: featuresValue
                },
                {
                    name: supportTitle,
                    value: supportValue
                }
            ])
            .setFooter({ 
                text: enhancedFooter,
                iconURL: interaction.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};