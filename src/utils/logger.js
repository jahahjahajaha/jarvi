const chalk = require("chalk");
const moment = require("moment");
const { EmbedBuilder } = require("discord.js");
const config = require("../config.js");

module.exports = class Logger {
    static client = null;
    
    // Set the client instance to use for sending logs
    static setClient(clientInstance) {
        this.client = clientInstance;
    }
    
    // Send log to Discord log channel if configured
    static async sendToLogChannel(content, type = "log") {
        if (!this.client || !config.bot.logChannelId) return;
        
        try {
            const logChannel = await this.client.channels.fetch(config.bot.logChannelId).catch(() => null);
            if (!logChannel) return;
            
            // Create color based on log type
            let color;
            switch (type.toLowerCase()) {
                case "error": color = "#FF0000"; break;
                case "warn": color = "#FFFF00"; break;
                case "ready": color = "#00FFFF"; break;
                case "info": color = "#0000FF"; break;
                case "cmd": color = "#FF00FF"; break;
                default: color = "#FFFFFF";
            }
            
            // Create and send embed to log channel
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${type.toUpperCase()} Log`)
                .setDescription(`\`\`\`${content}\`\`\``)
                .setTimestamp();
                
            await logChannel.send({ embeds: [embed] });
        } catch (err) {
            console.error(`Failed to send log to Discord channel: ${err.message}`);
        }
    }
    
    static log(content, type = "log") {
        const date = `${moment().format("DD-MM-YYYY hh:mm:ss")}`;
        const logMessage = `[${date}]: [${type.toUpperCase()}] ${content}`;
        
        // Console logging with chalk colors
        switch (type.toLowerCase()) {
            case "log": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgBlue(type.toUpperCase())}] ${content}`);
                break;
            }
            case "warn": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgYellow(type.toUpperCase())}] ${content}`);
                break;
            }
            case "error": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgRed(type.toUpperCase())}] ${content}`);
                break;
            }
            case "debug": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgGreen(type.toUpperCase())}] ${content}`);
                break;
            }
            case "cmd": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgWhite(type.toUpperCase())}] ${content}`);
                break;
            }
            case "event": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgWhite(type.toUpperCase())}] ${content}`);
                break;
            }
            case "ready": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgBlueBright(type.toUpperCase())}] ${content}`);
                break;
            }
            case "info": {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgCyan(type.toUpperCase())}] ${content}`);
                break;
            }
            default: {
                console.log(`[${chalk.gray(date)}]: [${chalk.black.bgWhite(type.toUpperCase())}] ${content}`);
                break;
            }
        }
        
        // Send to Discord log channel
        this.sendToLogChannel(content, type);
    }
};