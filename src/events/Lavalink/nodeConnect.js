module.exports = async (client, node) => {
    try {
        client.logger.log(`Node "${node.options.identifier}" attempting connection...`, "info");

        // Reset node state
        node.retryAttempts = 0;
        node.state = "CONNECTED";
        node.connected = true;

        // Clear any existing reconnect timeout
        if (node.reconnectTimeout) {
            clearTimeout(node.reconnectTimeout);
            node.reconnectTimeout = null;
        }

        // Initialize basic node stats
        node.stats = {
            players: 0,
            playingPlayers: 0,
            uptime: process.uptime() * 1000,
            memory: {
                free: 0,
                used: 0,
                allocated: 0,
                reservable: 0
            },
            cpu: {
                cores: 0,
                systemLoad: 0,
                lavalinkLoad: 0
            }
        };

        // Mark node as ready
        node.ready = true;
        client.logger.log(`Node "${node.options.identifier}" connected and ready!`, "ready");

    } catch (error) {
        client.logger.log(`Error in nodeConnect event: ${error.message}`, "error");

        // Simplified reconnection for better stability
        setTimeout(() => {
            if (!node.connected) {
                client.logger.log(`Attempting to reconnect...`, "warn");
                node.connect();
            }
        }, 3000); // 3 second delay before retry
    }
};