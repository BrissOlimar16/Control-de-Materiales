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
            return res.statusGroup(401).json({ error: "La matrícula o usuario no existen." });
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

app.get('/api/prueba', (req, res) => {
    res.json({ mensaje: "¡El backend de Ctrl + Mat está vivo y escuchando!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});