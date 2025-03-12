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

const config = {
  api: {
    token: getEnvVar("TOKEN", "", true),
    topggapi: getEnvVar("TOPGG_API", ""),
    mongourl: getEnvVar("MONGO_URI", "", true),
  },

  bot: {
    prefix: getEnvVar("PREFIX", "."),
    ownerID: getEnvVar("OWNERID", "1212719184870383621").split(","),
    langs: "en",
    supportServer: "https://discord.gg/tBNezcRHMe",
    mentionPrefix: true,
    supportServerID: "1335329530121945139",
    inviteURL: "https://discord.com/oauth2/authorize?client_id=1343760491452825754"
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
    console: getEnvVar("CONSOLE_LOGS", "1349205543897792562"),
    botstatus: getEnvVar("BOT_STATUS_CHANNEL", "1335329530734186535"),
    serverjoinleave: getEnvVar("SERVER_JOIN_LEAVE_LOGS", "1335329530885308539"),
    boost: getEnvVar("BOOST_LOGS", "1336968851988021268"),
    general: getEnvVar("GENERAL_LOGS", "1349220278068183061"),
    logChannelId: getEnvVar("LOG_CHANNEL_ID", "1335329530734186535"),
  },
  
  monitoring: {
    enabled: true,
    updateInterval: 5000, // 5 seconds in milliseconds (change to 3000 for 3 seconds)
    editMessages: true, // Edit existing message instead of creating a new one
    statusChannelId: getEnvVar("BOT_STATUS_CHANNEL", "1335329530734186535"), // Status monitoring channel
    statusMessageId: null, // Will be set dynamically when first created
    alertOwnerOnError: true,
    useWebhooks: true, // Use webhooks for private log channels only
    deleteOldStatusMessages: false, // Set to false when using edit mode
    maxMessagesToDelete: 5, // Maximum messages to delete at once (if needed)
    showRefreshButton: false, // No need for refresh button with fast updates
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