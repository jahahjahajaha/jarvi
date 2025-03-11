
module.exports = async (client, node, reason) => {
    client.logger.log(`Node "${node.options.identifier}" disconnected. Reason: ${reason}`, "warn");
    client.logger.log(`Primary node disconnected. Attempting immediate reconnection...`, "warn");
    client.logger.log(`Node "${node.options.identifier}" disconnect because ${reason}.`, "warn");
};
