const { Database } = require('quickmongo');

const db = new Database('mongodb+srv://Rayzmusic:music@cluster0.rhzwp8e.mongodb.net/?retryWrites=true&w=majority');
db.connect().then(() => console.log('[ MONGO DB ] Connected to Mongo Database!'));

module.exports = db;