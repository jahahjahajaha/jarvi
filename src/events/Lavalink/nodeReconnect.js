
module.exports = async (client, node) => {
    try {
        client.logger.log(`Node "${node.options.identifier}" is attempting to reconnect...`, "warn");
        
        // Clear any existing reconnection timeout
        if (node.reconnectTimeout) {
            clearTimeout(node.reconnectTimeout);
        }

        // Initialize reconnect attempts counter if not exists
        if (!node.reconnectAttempts) {
            node.reconnectAttempts = 0;
        }
        
        // Increment reconnect attempts
        node.reconnectAttempts++;
        
        // Calculate delay with exponential backoff (1s, 2s, 4s, 8s...) capped at 30s
        const delay = Math.min(Math.pow(2, node.reconnectAttempts - 1) * 1000, 30000);
        
        client.logger.log(`Reconnection attempt ${node.reconnectAttempts} scheduled in ${delay/1000} seconds for node "${node.options.identifier}"`, "warn");
        
        // Set reconnection timeout
        node.reconnectTimeout = setTimeout(() => {
            client.logger.log(`Executing reconnection attempt ${node.reconnectAttempts} for node "${node.options.identifier}"...`, "warn");
            
            // Try to connect
            try {
                // Check if node.connect returns a promise
                const connectResult = node.connect();
                
                if (connectResult && typeof connectResult.then === 'function') {
                    // If it's a promise, use then/catch
                    connectResult
                        .then(() => {
                            client.logger.log(`Successfully reconnected to node "${node.options.identifier}"`, "log");
                            // Reset counter on successful connection
                            node.reconnectAttempts = 0;
                        })
                        .catch(err => {
                            client.logger.log(`Failed to reconnect to node "${node.options.identifier}": ${err.message}`, "error");
                            // The next reconnection attempt will be triggered by another disconnect event
                        });
                } else {
                    // If it's not a promise, assume it worked (or will emit error event if it didn't)
                    client.logger.log(`Attempted reconnection to node "${node.options.identifier}" (non-promise result)`, "log");
                }
            } catch (err) {
                client.logger.log(`Error during reconnection to node "${node.options.identifier}": ${err.message}`, "error");
            }
        }, delay);
        
    } catch (error) {
        client.logger.log(`Error in nodeReconnect event: ${error.message}`, "error");
    }
};
