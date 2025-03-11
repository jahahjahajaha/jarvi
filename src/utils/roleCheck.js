const checkDevRole = (member) => {
    const devRoleId = '1335329530134659074';
    return member.roles.cache.has(devRoleId);
};

module.exports = { checkDevRole };
