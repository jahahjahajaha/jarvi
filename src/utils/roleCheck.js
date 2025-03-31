/**
 * Check if a user has the developer role or is a developer
 * Only allows users with the developer role to use dev commands
 * @param {GuildMember} member - Discord guild member
 * @returns {Boolean} - Whether the user is a developer
 */
const checkDevRole = (member) => {
    // Dev role ID - anyone with this role can use dev commands
    const devRoleId = (process.env.DEV_ROLE || "1335329530134659074");
    
    // Check if member has the dev role
    return member.roles.cache.has(devRoleId);
};

module.exports = { checkDevRole };