const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); 

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE matricula = ?', [usuario]);

        if (rows.length === 0) {
            return res.status(401).json({ error: "La matrícula o usuario no existen." });
        }

        const usuarioEncontrado = rows[0];

        if (usuarioEncontrado.password !== password) {
            return res.status(401).json({ error: "Contraseña incorrecta." });
        }

        res.json({
            mensaje: "¡Inicio de sesión exitoso!",
            usuario: {
                nombre: usuarioEncontrado.nombre,
                matricula: usuarioEncontrado.matricula,
                rol: usuarioEncontrado.rol
            }
        });

    } catch (error) {
        console.error("Error en el servidor durante el login:", error);
        res.status(500).json({ error: "Error interno del servidor. Inténtalo más tarde." });
    }
});

app.post('/api/materiales', async (req, res) => {
    const { codigo, descripcion, categoria, stock_total } = req.body;

    // Validación básica de campos vacíos
    if (!codigo || !descripcion || !categoria || !stock_total) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    try {
        // Al registrar, el stock_disponible es igual al stock_total inicialmente
        const query = 'INSERT INTO materiales (codigo, descripcion, categoria, stock_total, stock_disponible) VALUES (?, ?, ?, ?, ?)';
        await db.execute(query, [codigo, descripcion, categoria, stock_total, stock_total]);
        
        res.status(201).json({ mensaje: "Material registrado exitosamente." });
    } catch (error) {
        console.error("Error al insertar material:", error);
        // Manejar por si intentan meter un código duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "El código de material ya existe." });
        }
        res.status(500).json({ error: "Error interno al registrar el material." });
    }
});

app.get('/api/prueba', (req, res) => {
    res.json({ mensaje: "¡El backend de Ctrl + Mat está vivo y escuchando!" });
});

app.get('/api/materiales', async (req, res) => {
    try {
        // Consultamos todos los materiales de la base de datos
        const [rows] = await db.execute('SELECT * FROM materiales');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener materiales:", error);
        res.status(500).json({ error: "Error al obtener el inventario." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});