const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Error conectando a la base de datos de XAMPP:", err.message);
    } else {
        console.log("¡Conexión exitosa a la base de datos control_materiales!");
        connection.release(); 
    }
});

module.exports = db;