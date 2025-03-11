const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
    name: "filter",
    category: "Filters",
    aliases: ["filters", "eq", "f"],
    description: "Sets the bot's sound filter",
    args: false,
    usage: "",
    userPerms: [],
    dj: true,
    owner: false,
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (message, args, client, prefix) => {
        console.log(`[DEBUG] Filter command executed by ${message.author.tag}`);
        const player = message.client.manager.get(message.guild.id);
        if (!player.queue.current) {
            let thing = new EmbedBuilder()
                .setColor(client.embedColor)
                .setDescription(`<a:cross:1342050022954373121> | **There is no music playing!**`);
            return message.reply({ embeds: [thing] });
        }

        const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ name: `| Filters Panel`, iconURL: message.member.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(`<:Reset:1340406899451101194> ➡ Reset Filters\n<:Boost:1340415610034589716> ➡ Bass Booster\n<:8D:1340417340214349975> ➡ 8D\n<:Nightcore:1340421528637931611> ➡ Nightcore\n<:Pitch:1340575300093874187> ➡ Pitch\n<:Distort:1340568710984761448> ➡ Distort\n<:Speed:1340575310705332296> ➡ Speed\n<:Vaporwave_1:1340576360082706543> ➡ Vaporwave`)
            .setFooter({ text: `Requested by: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('disable_h')
                    .setPlaceholder(`⚙️ Select Filters`)
                    .addOptions([
                        {
                            label: 'Reset Filters',
                            value: 'clear_but',
                            emoji: '<:Reset:1340406899451101194>'
                        },
                        {
                            label: 'BassBoost',
                            value: 'bass_but',
                            emoji: '<:Boost:1340415610034589716>'
                        },
                        {
                            label: '8D',
                            value: '8d_but',
                            emoji: '<:8D:1340417340214349975>'
                        },
                        {
                            label: 'NightCore',
                            value: 'night_but',
                            emoji: '<:Nightcore:1340421528637931611>'
                        },
                        {
                            label: 'Pitch',
                            value: 'pitch_but',
                            emoji: '<:Pitch:1340575300093874187>'
                        },
                        {
                            label: 'Distort',
                            value: 'distort_but',
                            emoji: '<:Distort:1340568710984761448>'
                        },
                        {
                            label: 'Speed',
                            value: 'speed_but',
                            emoji: '<:Speed:1340575310705332296>'
                        },
                        {
                            label: 'Vaporwave',
                            value: 'vapo_but',
                            emoji: '<:Vaporwave_1:1340576360082706543>'
                        }
                    ])
            );

        const msg = await message.reply({ embeds: [embed], components: [row] });
        console.log(`[DEBUG] Filter menu sent to ${message.author.tag}`);

        const collector = msg.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === message.author.id) return true;
                b.reply({ content: `Only **${message.author.tag}** can use this button!`, ephemeral: true }); return false;
            },
            time: 60000,
            idle: 60000 / 2
        });

        collector.on("collect", async (i) => {
            if (!i.isSelectMenu()) return;
            await i.deferUpdate();
            console.log(`[DEBUG] Filter selected: ${i.values[0]} by ${i.user.tag}`);

            try {
                switch (i.values[0]) {
                    case "clear_but":
                        await player.clearEffects();
                        console.log(`[DEBUG] Cleared all filters for ${i.user.tag}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> Successfully cleared all **FILTERS**!`, ephemeral: true });
                        break;

                    case "bass_but":
                        await player.setBassboost(!player.bassboost);
                        console.log(`[DEBUG] Toggled bassboost for ${i.user.tag} - Status: ${player.bassboost}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> BassBoost mode **${player.bassboost ? 'ENABLED' : 'DISABLED'}**!`, ephemeral: true });
                        break;

                    case "8d_but":
                        await player.set8D(!player._8d);
                        console.log(`[DEBUG] Toggled 8D for ${i.user.tag} - Status: ${player._8d}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> 8D Mode **${player._8d ? 'ENABLED' : 'DISABLED'}**!`, ephemeral: true });
                        break;

                    case "night_but":
                        await player.setNightcore(!player.nightcore);
                        console.log(`[DEBUG] Toggled nightcore for ${i.user.tag} - Status: ${player.nightcore}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> NightCore Mode **${player.nightcore ? 'ENABLED' : 'DISABLED'}**!`, ephemeral: true });
                        break;

                    case "pitch_but":
                        const newPitch = player.pitch === 1 ? 2 : 1;
                        await player.setPitch(newPitch);
                        console.log(`[DEBUG] Toggled pitch for ${i.user.tag} - Value: ${newPitch}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> Pitch Mode **${newPitch !== 1 ? 'ENABLED' : 'DISABLED'}**!`, ephemeral: true });
                        break;

                    case "distort_but":
                        await player.setDistortion(!player.distortion);
                        console.log(`[DEBUG] Toggled distortion for ${i.user.tag} - Status: ${player.distortion}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> Distort Mode **${player.distortion ? 'ENABLED' : 'DISABLED'}**!`, ephemeral: true });
                        break;

                    case "speed_but":
                        const newSpeed = player.speed === 1 ? 2 : 1;
                        await player.setSpeed(newSpeed);
                        console.log(`[DEBUG] Toggled speed for ${i.user.tag} - Value: ${newSpeed}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> Speed Mode **${newSpeed !== 1 ? 'ENABLED' : 'DISABLED'}**!`, ephemeral: true });
                        break;

                    case "vapo_but":
                        await player.setVaporwave(!player.vaporwave);
                        console.log(`[DEBUG] Toggled vaporwave for ${i.user.tag} - Status: ${player.vaporwave}`);
                        i.followUp({ content: `<a:Chec_kmark:1340583433298251846> VaporWave Mode **${player.vaporwave ? 'ENABLED' : 'DISABLED'}**!`, ephemeral: true });
                        break;
                }
            } catch (error) {
                console.error('Filter Error:', error);
                i.followUp({ content: `<a:cross:1342050022954373121> An error occurred while applying the filter!`, ephemeral: true });
            }
        });

        collector.on("end", () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};