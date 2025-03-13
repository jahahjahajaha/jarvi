const { EmbedBuilder } = require("discord.js");
const { post } = require("node-superfetch");
const util = require("util");
const os = require("os");

module.exports = {
  name: "eval",
  category: "Dev",
  description: "Evaluates JavaScript code with extended functionality",
  aliases: ["ev", "evaluate"],
  args: false,
  usage: "<string>",
  permission: [],
  owner: true,
  execute: async (message, args, client, prefix) => {
    // Create embed to display both input and output
    const embed = new EmbedBuilder()
      .setTitle("Code Evaluation")
      .setTimestamp()
      .addFields([{
        name: "💎 Input",
        value: "```js\n" + args.join(" ") + "```"
      }]);

    try {
      const code = args.join(" ");
      if (!code) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("❌ Please include the code to evaluate.")
          ]
        });
      }

      // Security check for sensitive information
      if (
        code.includes(`SECRET`) ||
        code.includes(`TOKEN`) ||
        code.includes("process.env") ||
        code.includes("client.token")
      ) {
        embed
          .addFields([{
            name: "🔒 Security Alert", 
            value: "```An attempt to access sensitive information was blocked.```"
          }])
          .setColor("Red");
        
        return message.channel.send({ embeds: [embed] });
      }

      // Add timing measurement
      const startTime = process.hrtime();
      let evaled = await eval(code);
      const stopTime = process.hrtime(startTime);
      const executionTime = (stopTime[0] * 1000 + stopTime[1] / 1000000).toFixed(2);

      // Handle non-string results
      if (typeof evaled !== "string") {
        evaled = util.inspect(evaled, { depth: 0 });
      }

      let output = clean(evaled);
      
      // Add system resource usage info
      const memoryUsage = process.memoryUsage();
      const systemInfo = {
        memory: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        cpu: `${os.loadavg()[0].toFixed(2)}%`,
        platform: `${os.platform()} (${os.release()})`,
        executionTime: `${executionTime} ms`
      };
      
      // Handle large outputs with hastebin
      if (output.length > 1024) {
        try {
          const { body } = await post("https://hastebin.com/documents").send(output);
          embed
            .addFields([{ 
              name: "🚮 Output (Exceeds character limit)", 
              value: `[View on Hastebin](https://hastebin.com/${body.key}.js)` 
            }])
            .addFields([{
              name: "⚙️ Execution Info",
              value: `\`\`\`Execution Time: ${systemInfo.executionTime}\nMemory: ${systemInfo.memory}\nCPU Load: ${systemInfo.cpu}\`\`\``
            }])
            .setColor(client.embedColor);
        } catch (error) {
          // If hastebin upload fails
          embed
            .addFields([{
              name: "🚮 Output",
              value: "```Output exceeded 1024 characters and Hastebin upload failed.```"
            }])
            .addFields([{
              name: "⚙️ Execution Info",
              value: `\`\`\`Execution Time: ${systemInfo.executionTime}\nMemory: ${systemInfo.memory}\nCPU Load: ${systemInfo.cpu}\`\`\``
            }])
            .setColor("Yellow");
        }
      } else {
        embed
          .addFields([{
            name: "🚮 Output", 
            value: "```js\n" + output + "```"
          }])
          .addFields([{
            name: "⚙️ Execution Info",
            value: `\`\`\`Execution Time: ${systemInfo.executionTime}\nMemory: ${systemInfo.memory}\nCPU Load: ${systemInfo.cpu}\`\`\``
          }])
          .setColor(client.embedColor);
      }

      message.channel.send({ embeds: [embed] });
    } catch (error) {
      let err = clean(error);
      
      // Handle large errors with hastebin
      if (err.length > 1024) {
        try {
          const { body } = await post("https://hastebin.com/documents").send(err);
          embed
            .addFields([{
              name: "❌ Error", 
              value: `[View Error on Hastebin](https://hastebin.com/${body.key}.js)`
            }])
            .setColor("Red");
        } catch (uploadError) {
          embed
            .addFields([{
              name: "❌ Error", 
              value: "```Error exceeded 1024 characters and Hastebin upload failed.```"
            }])
            .setColor("Red");
        }
      } else {
        embed
          .addFields([{
            name: "❌ Error", 
            value: "```js\n" + err + "```"
          }])
          .setColor("Red");
      }

      message.channel.send({ embeds: [embed] });
    }
  },
};

/**
 * Clean up text for code display
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function clean(text) {
  if (typeof text === "string") {
    return text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203))
      .replace(/\n/g, "\n")
      .replace(/\r/g, "\r");
  } else {
    return String(text);
  }
}