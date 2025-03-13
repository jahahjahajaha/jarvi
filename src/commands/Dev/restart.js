const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Logger = require("../../utils/logger");
const os = require("os");

module.exports = {
  name: "restart",
  category: "Dev",
  description: "Restart the bot with enhanced monitoring",
  aliases: ["reboot", "reset"],
  args: false,
  usage: "[reason]",
  permission: [],
  owner: true,
  
  async execute(message, args, client) {
    const allowedUsers = ["1212719184870383621", "1045714939676999752"];

    if (!allowedUsers.includes(message.author.id)) {  
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ | You don't have permission to use this command.\n*Only my developers (<@1212719184870383621> and other authorized devs) can use this command.*")
        ]
      });  
    }
    
    const reason = args.join(" ") || "No reason provided";
    const timestamp = new Date().toISOString();
    
    // Collect system statistics before restart
    const uptime = process.uptime();
    const readableUptime = formatUptime(uptime);
    const memoryUsage = process.memoryUsage();
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const cpuLoad = os.loadavg()[0].toFixed(2);
    
    // Prepare restart embed
    const restartEmbed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("🔄 Bot Restart Initiated")
      .setDescription(`The bot is now restarting. Please wait...`)
      .addFields([
        { name: "Initiated By", value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: "Reason", value: reason, inline: true },
        { name: "Previous Uptime", value: readableUptime, inline: true },
        { name: "System Stats Before Restart", value: `Memory: ${heapUsed}MB / ${totalMemory}GB\nCPU Load: ${cpuLoad}%`, inline: false },
        { name: "Expected Return", value: "The bot should return within 120 seconds", inline: false }
      ])
      .setFooter({ text: `Restart ID: ${generateRestartId()}` })
      .setTimestamp();

    try {
      // Log restart to both Discord and console
      await Logger.logBilingual(
        `Bot restart initiated by ${message.author.tag} for reason: ${reason}`,
        `बॉट को ${message.author.tag} द्वारा पुनः आरंभ किया गया, कारण: ${reason}`,
        "info",
        true
      );
      
      // Send restart message to user
      await message.reply({ embeds: [restartEmbed] });
      
      console.log(`[RESTART] Bot restart initiated by ${message.author.tag} at ${timestamp}`);
      console.log(`[RESTART] Reason: ${reason}`);
      console.log(`[RESTART] System stats: Memory: ${heapUsed}MB / ${totalMemory}GB | CPU: ${cpuLoad}%`);
      
      // Graceful shutdown process
      console.log("[RESTART] Initiating graceful shutdown...");
      
      // Small delay to ensure messages are sent before exit
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    } catch (error) {
      console.error("[RESTART] Error during restart process:", error);
      message.channel.send("❌ | An error occurred during the restart process. Please check the logs.");
    }
  }
};

/**
 * Format uptime into human readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Generate a unique restart ID for tracking
 * @returns {string} Unique restart ID
 */
function generateRestartId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}