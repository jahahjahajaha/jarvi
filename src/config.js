require("dotenv").config();
const chalk = require("chalk");

function getEnvVar(name, defaultValue = "", required = false) {
  const value = process.env[name] || defaultValue;
  if (required && !value) {
    console.error(chalk.red(`[ERROR] Missing required environment variable: ${name}`));
    process.exit(1);
  }
  return value;
}

// Multiple Lavalink node configuration for redundancy
const lavalinkNodes = [
  {
    identifier: process.env.LAVALINK_IDENTIFIER || "NODE-MAIN-2",
    host: process.env.LAVALINK_HOST || "lava-v3.ajieblogs.eu.org",
    port: parseInt(process.env.LAVALINK_PORT || "443"),
    password: process.env.LAVALINK_PASSWORD || "https://dsc.gg/ajidevserver",
    secure: process.env.LAVALINK_SECURE === "true",
    region: "singapore",
    retryAmount: 10,
    retryDelay: 5000,
    options: {
      rejectUnauthorized: false,
      reconnectTries: 20,
      reconnectDelay: 2000
    }
  }
];

// Check token availability and log it
const discordToken = process.env.DISCORD_TOKEN || "";
const tokenVar = process.env.TOKEN || "";
console.log("[CONFIG] DISCORD_TOKEN available:", !!discordToken);
console.log("[CONFIG] TOKEN available:", !!tokenVar);
console.log("[CONFIG] Using token from:", discordToken ? "DISCORD_TOKEN" : (tokenVar ? "TOKEN" : "None found"));

const config = {
  version: "v0.10.0", // Central version number for the bot
  
  api: {
    token: tokenVar || discordToken || "", // Prioritize TOKEN, fall back to DISCORD_TOKEN
    topggapi: getEnvVar("TOPGG_API", ""),
    mongourl: getEnvVar("MONGO_URI", "", true),
    spotify: {
      clientId: getEnvVar("SPOTIFY_CLIENT_ID", ""),
      clientSecret: getEnvVar("SPOTIFY_CLIENT_SECRET", ""),
      useSpotifyMetadata: true,
      albumLimit: 50,
      playlistLimit: 50,
      autoResolveYoutubeTracks: false, // Only use other platforms if Spotify fails
    }
  },

  bot: {
    prefix: getEnvVar("PREFIX", "."),
    ownerID: getEnvVar("OWNERID", "1212719184870383621").split(","),
    clientId: getEnvVar("CLIENT_ID", "1333994486979887186"),
    langs: "en",
    supportServer: "https://discord.gg/tBNezcRHMe",
    mentionPrefix: true,
    supportServerID: "1335329530121945139",
    inviteURL: `https://discord.com/oauth2/authorize?client_id=${getEnvVar("CLIENT_ID", "1333994486979887186")}&permissions=8&scope=bot%20applications.commands`,
  },

  embed: {
    color: getEnvVar("COLOR", "#E87147"),
    footertext: getEnvVar("FOOTER_TEXT", "© Jarvi"),
    footericon: getEnvVar(
      "FOOTER_ICON",
      "https://cdn.discordapp.com/attachments/1288526364286255124/1340756446408609799/Jarvi_Logo.png"
    ),
  },
  logs: {
    join: getEnvVar("JOIN_LOGS", "1335329531262668803"),
    leave: getEnvVar("LEAVE_LOGS", "1335329531262668804"),
    error: getEnvVar("ERROR_LOGS", "1335329531262668805"),
    warning: getEnvVar("WARNING_LOGS", "1349235735416537218"),
    console: getEnvVar("CONSOLE_LOGS", "1349205543897792562"),
    botstatus: getEnvVar("BOT_STATUS_CHANNEL", "1335329530734186535"),
    serverjoinleave: getEnvVar("SERVER_JOIN_LEAVE_LOGS", "1335329530885308539"),
    boost: getEnvVar("BOOST_LOGS", "1336968851988021268"),
    general: getEnvVar("GENERAL_LOGS", "1349220278068183061"),
    logChannelId: getEnvVar("LOG_CHANNEL_ID", "1335329530734186535"),
  },
  
  monitoring: {
    enabled: true,
    updateInterval: 3000, // 3 seconds in milliseconds
    editMessages: true, // Edit existing message instead of creating a new one
    statusChannelId: getEnvVar("BOT_STATUS_CHANNEL", "1335329530734186535"), // Status monitoring channel
    statusMessageId: null, // Will be set dynamically when first created
    recreateInterval: 86400000, // 24 hours (in milliseconds) before recreating the message
    alertOwnerOnError: true,
    useWebhooks: false, // Temporarily disabled webhooks due to issues
    deleteOldStatusMessages: false, // Should be false to prevent constant deleting/recreating
    deleteOnStartup: true, // Delete messages only on startup
    maxMessagesToDelete: 10, // Increased to handle more messages
    showRefreshButton: true, // Show refresh button for manual updates
    showControls: true, // Show interactive controls for managing monitoring 
    allowViewModeChanges: true, // Allow users to change display modes
    trackCommandExecution: true, // Track command execution for analytics
    enableTrendAnalysis: true, // Enable trend analysis for key metrics
    devRoleIds: ["1335329530734186535", "1335329530734186530"], // Developer role IDs that can control monitoring
    ownerIds: [getEnvVar("BOT_OWNER_ID", "966132097078321152")], // Bot owner IDs that can control everything
    persistMessage: true, // Try to persist message between restarts
    stabilityMode: true, // Enhanced stability mode - avoids unnecessary recreation
    publicChannels: ["serverjoinleave", "boost", "botstatus"], // Channels that should use normal messages not webhooks
    healthChecks: {
      memoryThreshold: 80, // Alert if memory usage is above 80%
      cpuThreshold: 90,    // Alert if CPU usage is above 90%
      playerThreshold: 100, // Maximum number of concurrent players before warning
      healthyEmoji: "✅",
      warningEmoji: "⚠️",
      criticalEmoji: "❌"
    }
  },
  status: {
    type: getEnvVar("STATUS_TYPE", "STREAMING"),
    url: getEnvVar("STATUS_URL", "https://www.youtube.com/watch?v=8kfP22meDL0"),
    name: getEnvVar("STATUS", "online")
  },

  nodes: lavalinkNodes,
};

Object.defineProperties(config, {
  token: { get: () => config.api.token },
  prefix: { get: () => config.bot.prefix },
  ownerID: { get: () => config.bot.ownerID },
  mongourl: { get: () => config.api.mongourl },
  topggapi: { get: () => config.api.topggapi },
  embedColor: { get: () => config.embed.color },
  langs: { get: () => config.bot.langs },
  SUPPORT_SERVER: { get: () => config.bot.supportServer },
});

module.exports = config;

console.log(chalk.green("[INFO] Config file loaded successfully!"));