const { Client, Collection, EmbedBuilder, GatewayIntentBits } = require("discord.js");
const { Database } = require('quickmongo');
const { Manager } = require("erela.js");
const { readdirSync } = require("fs");
const deezer = require("erela.js-deezer");
const spotify = require("erela.js-spotify");
const apple = require("erela.js-apple");
const facebook = require("erela.js-facebook");
const mongoose = require('mongoose');
const moment = require('moment-timezone');
require("./PlayerBase"); 
require("../utils/lavamusic");
const StatusMonitor = require("../utils/statusMonitor");

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
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMessageReactions
            ]
        });

        moment.tz.setDefault("Asia/Kolkata");

        this.commands = new Collection();
        this.aliases = new Collection();
        this.slashCommands = new Collection();
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
                new spotify({
                    clientID: process.env.SPOTIFY_CLIENT_ID || this.config.api.spotify.clientId,
                    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || this.config.api.spotify.clientSecret,
                    albumLimit: this.config.api.spotify.albumLimit || 50,
                    playlistLimit: this.config.api.spotify.playlistLimit || 50,
                    useSpotifyMetadata: true,
                    convertUnresolved: true,
                }),
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
        this.loadSlashCommands();
    }

    // Advanced node failover system
    tryAlternativeNode(failedNode) {
        const availableNodes = this.manager.nodes.filter(n => 
            n.state === "CONNECTED" && n.options.identifier !== failedNode.options.identifier
        );

        if (availableNodes.length > 0) {
            const alternativeNode = availableNodes[0];
            this.logger.log(`Switching to alternative node ${alternativeNode.options.identifier}`, "info", false);
            this.logger.log(`Alternative node info - Host: ${alternativeNode.options.host}, Port: ${alternativeNode.options.port}`, "info", false);

            // Move all players to the alternative node
            this.manager.players.forEach(player => {
                if (player.node.options.identifier === failedNode.options.identifier) {
                    this.logger.log(`Moving player in guild ${player.guild} to node ${alternativeNode.options.identifier}`, "info", false);
                    player.node = alternativeNode;
                    if (player.playing) {
                        const { track, position } = player;
                        player.play(track, { startTime: position });
                    }
                }
            });
        } else {
            this.logger.log("No alternative nodes available. Music playback may be disrupted.", "warn");
            this.logger.log("Attempting to reconnect to original node...", "info", false);
            setTimeout(() => failedNode.connect(), 5000);
        }
    }

    loadEvents() {
        // Load Client events (bot core events)
        readdirSync("./src/events/Client/").forEach(file => {
            const event = require(`../events/Client/${file}`);
            let eventName = file.split(".")[0];
            this.logger.log(`Loading Client Events ${eventName}`, "event");
            this.on(event.name, (...args) => event.run(this, ...args));
        });

        // Load Guild events (member join/leave, etc.)
        try {
            readdirSync("./src/events/Guild/").forEach(file => {
                const event = require(`../events/Guild/${file}`);
                let eventName = file.split(".")[0];
                this.logger.log(`Loading Guild Events ${eventName}`, "event");
                this.on(event.name, (...args) => event.run(this, ...args));
            });
        } catch (error) {
            this.logger.log(`Error loading Guild events: ${error.message}`, "error");
        }

        // Load Lavalink events (music player)
        readdirSync("./src/events/Lavalink/").forEach(file => {
            const event = require(`../events/Lavalink/${file}`);
            let eventName = file.split(".")[0];
            this.logger.log(`Loading Lavalink Events ${eventName}`, "event");
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
    
    loadSlashCommands() {
        // Allow all slash commands to be loaded for the developer test bot
        // Track count of commands for logging
        let loadedCount = 0;
        
        // Process each slash command file
        readdirSync("./src/slashCommands/").forEach(file => {
            // Skip non-JS files silently
            if (!file.endsWith('.js')) return;
            
            // Get the command name from the file name
            const commandName = file.split('.')[0];
            
            try {
                const command = require(`../slashCommands/${file}`);
                if (!command.data || !command.execute) {
                    this.logger.log(`Invalid slash command structure in ${file}`, "warn");
                    return;
                }
                
                this.logger.log(`Loading slash command: ${commandName}`, "cmd");
                this.slashCommands.set(commandName, command);
                loadedCount++;
            } catch (error) {
                this.logger.log(`Error loading slash command ${file}: ${error.message}`, "error");
            }
        });
        
        // Log summary of loaded commands
        this.logger.log(`Loaded ${loadedCount} slash commands successfully!`, "ready");
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
        // Set client instance in logger for Discord channel logging
        this.logger.setClient(this);
        
        // Better error handling for login
        console.log("[CONNECTION] Attempting to connect to Discord...");
        console.log("[CONNECTION] Token check: DISCORD_TOKEN exists:", !!process.env.DISCORD_TOKEN);
        console.log("[CONNECTION] Token check: TOKEN exists:", !!process.env.TOKEN);
        console.log("[CONNECTION] Token check: this.token exists:", !!this.token);
        console.log("[CONNECTION] Token first 10 chars:", this.token ? this.token.substring(0, 10) + "..." : "undefined");
        
        return super.login(this.token)
            .then(() => {
                console.log("[CONNECTION] Successfully connected to Discord API!");
                console.log(`[CONNECTION] Connected as: ${this.user.tag} (${this.user.id})`);
                
                // Always initialize status monitor after successful login
                try {
                    // IMPORTANT: Only create status monitor once at startup
                    // We need this double-check to prevent duplicate instances
                    if (!global._statusMonitorInitialized) {
                        console.log("[INFO] First-time status monitor initialization");
                        
                        // Set the global flag first
                        global._statusMonitorInitialized = true;
                        
                        // Create and initialize just once
                        this.statusMonitor = new StatusMonitor(this);
                        
                        // Initialize the status monitor (happens asynchronously)
                        this.statusMonitor.init().catch(error => {
                            console.error(`[ERROR] Failed to initialize status monitor: ${error.message}`);
                            // Reset flag on failure
                            global._statusMonitorInitialized = false;
                        });
                    } else {
                        console.log("[INFO] Status monitor already globally initialized, skipping");
                    }
                    
                    // Initialize webhook logging if enabled
                    if (this.logger && typeof this.logger.initWebhooks === 'function') {
                        this.logger.initWebhooks().catch(error => {
                            console.error(`[ERROR] Failed to initialize logger webhooks: ${error.message}`);
                        });
                    }
                } catch (error) {
                    console.error(`[ERROR] Status monitor initialization error: ${error.message}`);
                }
                
                return true;
            })
            .catch(error => {
                console.error("[CONNECTION ERROR] Failed to login to Discord:");
                console.error(error.message);
                
                if (error.message.includes("token")) {
                    console.error("[TOKEN ERROR] The Discord bot token appears to be invalid or expired.");
                    console.error("[TOKEN ERROR] Please check your .env file and update the TOKEN variable.");
                    // Try one more time with direct environment variable
                    console.error("[TOKEN RETRY] Attempting to connect with direct TOKEN from environment...");
                    return super.login(process.env.TOKEN)
                        .then(() => {
                            console.log("[CONNECTION] Successfully connected with direct TOKEN!");
                            console.log(`[CONNECTION] Connected as: ${this.user.tag} (${this.user.id})`);
                            return true;
                        })
                        .catch(retryError => {
                            console.error("[TOKEN RETRY] Failed with direct TOKEN too:", retryError.message);
                            throw retryError;
                        });
                }
                
                throw error; // Rethrow so parent can handle
            });
    }
}

module.exports = MusicBot;