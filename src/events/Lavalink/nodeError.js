
module.exports = async (client, node, error) => {
    // Format error message to be more readable
    const errorMessage = error ? error.message || error.toString() : "Unknown error";
    const errorCode = error && error.code ? error.code : "N/A";
    const errorType = error && error.type ? error.type : "N/A";
    
    // Completely ignore "Unexpected op 'ready'" errors - they are non-critical
    if (errorMessage.toLowerCase().includes("unexpected op") && 
        errorMessage.toLowerCase().includes("ready")) {
        // Silent return - these errors are expected and can be safely ignored
        return;
    }
    
    // Only log actual errors to warnings channel
    client.logger.log(`Node "${node.options.identifier}" encountered an error: ${errorMessage}`, "error", true);
    client.logger.log(`Additional Error Info - Code: ${errorCode}, Type: ${errorType}`, "error", true);
    
    // Handle critical connection errors
    if (errorMessage.includes("ECONNREFUSED") || 
        errorMessage.includes("socket hang up") || 
        errorMessage.includes("Unexpected server response")) {
        
        client.logger.log(`Critical node error detected. Implementing retry...`, "warn", true);
        
        // Increment retry counter
        node.retryAttempts = (node.retryAttempts || 0) + 1;
        
        // Calculate delay with exponential backoff (capped at 30 seconds)
        const delay = Math.min((node.retryAttempts * 1000), 30000);
        
        // Schedule reconnection attempt
        setTimeout(() => {
            if (!node.connected) {
                client.logger.log(`Attempting to reconnect to node (attempt #${node.retryAttempts})...`, "warn", true);
                node.connect();
            }
        }, delay);
    }
};
