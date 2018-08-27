var mysql = require('mysql');
var connect = mysql.createConnection({
    database : 'prk',
    user : 'prk',
    password : 'prk',
});

module.exports = connect;