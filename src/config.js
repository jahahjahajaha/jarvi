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
    tenor: {
      apiKey: getEnvVar("TENOR_API_KEY", "LIVDSRZULELA"),
      baseUrl: "https://tenor.googleapis.com/v2"
    },
  },

  bot: {
    prefix: getEnvVar("PREFIX", "."),
    ownerID: getEnvVar("OWNERID", "1212719184870383621").split(","),
    langs: getEnvVar("LANGS", "en"),
    supportServer: "https://discord.gg/tBNezcRHMe",
    mentionPrefix: true,
    logChannelId: getEnvVar("LOG_CHANNEL_ID", ""),
  },

  embed: {
    color: getEnvVar("COLOR", "#E87147"),
    footertext: getEnvVar("FOOTER_TEXT", "© Jarvi"),
    footericon: getEnvVar(
      "FOOTER_ICON",
      "https://cdn.discordapp.com/attachments/1288526364286255124/1340756446408609799/Jarvi_Logo.png"
    ),
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
  logChannelId: { get: () => config.bot.logChannelId },
});

module.exports = config;

console.log(chalk.green("[INFO] Config file loaded successfully!"));