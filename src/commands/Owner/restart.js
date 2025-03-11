const { PermissionsBitField } = require("discord.js");

module.exports = {
name: "restart",
category: "Owner",
description: "Restart the bot",
execute(message, args, client) {
const allowedUsers = ["1212719184870383621", "1045714939676999752"];

if (!allowedUsers.includes(message.author.id)) {  
  return message.reply("❌ | You don't have permission to use this command.\n*only my devlopers (<@1212719184870383621> or other devs) can use this cmd*");  
}  

message.reply("## <a:Restarting:1346108443596947520> | Restarting...\n Restarted under 120 seconds").then(() => {  
  process.exit();  
});

}
};