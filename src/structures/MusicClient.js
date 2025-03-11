const { Client, Collection, EmbedBuilder, GatewayIntentBits } = require("discord.js");
const { Database } = require('quickmongo');
const { Manager } = require("erela.js");
const { readdirSync } = require("fs");
const deezer = require("erela.js-deezer");
const spotify = require("better-erela.js-spotify").default;
const apple = require("erela.js-apple");
const facebook = require("erela.js-facebook");
const mongoose = require('mongoose');
const moment = require('moment-timezone');
require("./PlayerBase"); 
require("../utils/lavamusic");

class MusicBot extends Client {
    constructor() {
        super({
            shards: "auto",
            allowedMentions: {
                parse: ["roles", "users", "everyone"],
                repliedUser: false
            },
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ]
        });

        moment.tz.setDefault("Asia/Kolkata");

        this.commands = new Collection();
        this.aliases = new Collection();
        this.config = require("../config.js");
        this.owner = this.config.bot.ownerID;
        this.prefix = this.config.bot.prefix;
        this.embedColor = this.config.embed.color;
        this.logger = require("../utils/logger.js");
        this.emoji = require("../utils/emoji.json");
        if(!this.token) this.token = this.config.api.token;

        this.manager = new Manager({
            nodes: this.config.nodes,
            send: (id, payload) => {
                const guild = this.guilds.cache.get(id);
                if (guild) guild.shard.send(payload);
            },
            autoPlay: true,
            plugins: [
                new deezer(),
                new spotify(),
                new apple(),
                new facebook(),
            ],
            retryDelay: 3000,
            retryAmount: 5,
            defaultSearchPlatform: "youtube",
            clientName: "Jarvi Music",
            defaultVolume: 80,
        });

        // Enhanced node connection events with improved error handling
        this.manager.on("nodeConnect", node => {
            this.logger.log(`Node "${node.options.identifier}" connected successfully.`, "ready");
            this.logger.log(`Node Info - Host: ${node.options.host}, Port: ${node.options.port}, Secure: ${node.options.secure}`, "info");
            node.retryAttempts = 0;
        });

        this.manager.on("nodeError", (node, error) => {
            // Error handlers moved to src/events/Lavalink/nodeError.js for better organization
            // This handler is kept for compatibility but won't duplicate logs
            
            // Ignore specific "Unexpected op 'ready'" errors that are non-critical
            const errorMessage = error?.message || "Unknown error";
            if (errorMessage.toLowerCase().includes("unexpected op") && 
                errorMessage.toLowerCase().includes("ready")) {
                // Silent return - common non-critical error
                return;
            }
        });

        this.manager.on("nodeReconnect", node => {
            this.logger.log(`Node "${node.options.identifier}" is reconnecting...`, "warn");
            this.logger.log(`Reconnection attempt #${node.retryAttempts || 1}`, "info");
        });

        this.manager.on("nodeDisconnect", (node, reason) => {
            this.logger.log(`Node "${node.options.identifier}" disconnected. Reason: ${reason}`, "warn");

            // Attempt immediate reconnection for any disconnected node after a short delay
            this.logger.log(`Node disconnected. Attempting reconnection...`, "warn");
            setTimeout(() => {
                if (!node.connected) {
                    node.connect();
                }
            }, 3000); // 3 second delay to avoid rapid reconnection attempts
        });


        // MongoDB Connection with better error handling
        const dbOptions = {
            useNewUrlParser: true,
            autoIndex: false,
            connectTimeoutMS: 10000,
            family: 4,
            useUnifiedTopology: true,
        };

        mongoose.connect(this.config.api.mongourl, dbOptions)
            .then(() => {
                this.logger.log('[DB] DATABASE CONNECTED', "ready");
            })
            .catch(error => {
                this.logger.log(`MongoDB connection error: ${error.message}`, "error");
                process.exit(1);
            });

        // Error Handler
        this.on("disconnect", () => this.logger.log("Bot is disconnecting...", "warn"));
        this.on("reconnecting", () => this.logger.log("Bot reconnecting...", "log"));
        this.on('warn', error => this.logger.log(error, "warn"));
        this.on('error', error => this.logger.log(error, "error"));

        // Load Events and Commands
        this.loadEvents();
        this.loadCommands();
    }

    // Advanced node failover system
    tryAlternativeNode(failedNode) {
        const availableNodes = this.manager.nodes.filter(n => 
            n.state === "CONNECTED" && n.options.identifier !== failedNode.options.identifier
        );

        if (availableNodes.length > 0) {
            const alternativeNode = availableNodes[0];
            this.logger.log(`Switching to alternative node ${alternativeNode.options.identifier}`, "info");
            this.logger.log(`Alternative node info - Host: ${alternativeNode.options.host}, Port: ${alternativeNode.options.port}`, "info");

            // Move all players to the alternative node
            this.manager.players.forEach(player => {
                if (player.node.options.identifier === failedNode.options.identifier) {
                    this.logger.log(`Moving player in guild ${player.guild} to node ${alternativeNode.options.identifier}`, "info");
                    player.node = alternativeNode;
                    if (player.playing) {
                        const { track, position } = player;
                        player.play(track, { startTime: position });
                    }
                }
            });
        } else {
            this.logger.log("No alternative nodes available. Music playback may be disrupted.", "warn");
            this.logger.log("Attempting to reconnect to original node...", "info");
            setTimeout(() => failedNode.connect(), 5000);
        }
    }

    loadEvents() {
        readdirSync("./src/events/Client/").forEach(file => {
            const event = require(`../events/Client/${file}`);
            let eventName = file.split(".")[0];
            this.logger.log(`Loading Events ${eventName}`, "event");
            this.on(event.name, (...args) => event.run(this, ...args));
        });

        readdirSync("./src/events/Lavalink/").forEach(file => {
            const event = require(`../events/Lavalink/${file}`);
            let eventName = file.split(".")[0];
            this.logger.log(`Loading Events Lavalink ${eventName}`, "event");
            this.manager.on(eventName, event.bind(null, this));
        });
    }

    loadCommands() {
        readdirSync("./src/commands/").forEach(dir => {
            const commandFiles = readdirSync(`./src/commands/${dir}/`).filter(f => f.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../commands/${dir}/${file}`);
                this.logger.log(`Loading ${command.category} commands ${command.name}`, "cmd");
                this.commands.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => this.aliases.set(alias, command.name));
                }
            }
        });
    }

    createEmbed(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor(this.embedColor);

        if (fields.length > 0) embed.addFields(fields);
        if (title) embed.setTitle(title);
        return embed;
    }

    connect() {
        return super.login(this.token);
    }
}

module.exports = MusicBot;