const { prefix } = require("../../config.js");

module.exports = {
    name: "ready",
    run: async (client) => {
        client.manager.init(client.user.id);
        client.logger.log(`${client.user.username} online!`, "ready");
        client.logger.log(`Ready on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users`, "ready");

        // Simple bot ready message - No port signals
        console.log("Bot is ready and operational!");

        // Status update function
        function updateStatus() {
            let serverCount = client.guilds.cache.size;
            let userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            let status = (`${prefix}help | Serving Music in ${serverCount} servers & ${userCount} users` || `Serving Music in ${serverCount} servers & ${userCount} users`);

            client.user.setPresence({
                activities: [
                    {
                        name: status,
                        type: (client.config.status.type || `STREAMING`),
                        url: (client.config.status.url || `https://www.youtube.com/watch?v=8kfP22meDL0`)
                    }
                ],
                status: (client.config.status.name || "online")
            });
        }

        // Pehli baar status set karega
        updateStatus();

        // Har 10 seconds me status update karega
        setInterval(updateStatus, 10000);
    }
};