
module.exports = async (client, node, reason) => {
    // Convert object reason to string representation to avoid [object Object] in logs
    let reasonStr = "";
    try {
        reasonStr = typeof reason === 'object' ? JSON.stringify(reason) : reason || 'Unknown';
    } catch (e) {
        reasonStr = "Unable to stringify reason";
    }
    
    // Only send one log message instead of three to avoid cluttering the warning channel
    client.logger.log(`Node "${node.options.identifier}" disconnected. Reason: ${reasonStr}. Attempting immediate reconnection...`, "warn", true);
};
