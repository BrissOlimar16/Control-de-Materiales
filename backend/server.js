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

app.get('/api/materiales', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM materiales');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener materiales:", error);
        res.status(500).json({ error: "Error al obtener el inventario." });
    }
});

app.post('/api/materiales', async (req, res) => {
    const { codigo, descripcion, categoria, stock_total } = req.body;

    if (!codigo || !descripcion || !categoria || !stock_total) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    try {
        const query = 'INSERT INTO materiales (codigo, descripcion, categoria, stock_total, stock_disponible) VALUES (?, ?, ?, ?, ?)';
        await db.execute(query, [codigo, descripcion, categoria, stock_total, stock_total]);
        
        res.status(201).json({ mensaje: "Material registrado exitosamente." });
    } catch (error) {
        console.error("Error al insertar material:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "El código de material ya existe." });
        }
        res.status(500).json({ error: "Error interno al registrar el material." });
    }
});

app.post('/api/prestamos', async (req, res) => {
    const { usuario_id, laboratorio, fecha_solicitud, fecha_entrega, materiales } = req.body;

    if (!usuario_id || !laboratorio || !fecha_solicitud || !materiales || materiales.length === 0) {
        return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    try {
        const query = `
            INSERT INTO prestamos (usuario_id, codigo_material, laboratorio, cantidad, fecha_solicitud, fecha_entrega_estimada, estado) 
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
        `;

        for (const mat of materiales) {
            await db.execute(query, [
                usuario_id, 
                mat.codigo,  
                laboratorio,
                mat.cantidad,
                fecha_solicitud,
                fecha_entrega || null
            ]);
        }

        res.status(201).json({ mensaje: "¡Solicitud de vale enviada con éxito!" });

    } catch (error) {
        console.error("Error al registrar el préstamo:", error);
        res.status(500).json({ error: "Error interno al procesar el vale." });
    }
});

app.get('/api/prestamos/pendientes', async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.usuario_id, u.nombre AS solicitante, p.laboratorio, 
                   p.codigo_material, p.cantidad, p.fecha_solicitud, p.fecha_entrega_estimada
            FROM prestamos p
            INNER JOIN usuarios u ON p.usuario_id = u.matricula
            WHERE p.estado = 'pendiente'
        `;
        const [resultado] = await db.execute(query);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener solicitudes pendientes:", error);
        res.status(500).json({ error: "Error al cargar las solicitudes." });
    }
});

app.post('/api/prestamos/accion', async (req, res) => {
    const { id_prestamo, accion } = req.body;

    if (!id_prestamo || !accion) {
        return res.status(400).json({ error: "Faltan parámetros obligatorios." });
    }

    try {
        if (accion === 'aprobar') {
            const [prestamo] = await db.execute(
                "SELECT codigo_material, cantidad FROM prestamos WHERE id = ?", 
                [id_prestamo]
            );

            if (prestamo.length === 0) {
                return res.status(404).json({ error: "No se encontró el registro del préstamo." });
            }

            const { codigo_material, cantidad } = prestamo[0];

            const [material] = await db.execute(
                "SELECT stock_disponible, descripcion FROM materiales WHERE codigo = ?", 
                [codigo_material]
            );

            if (material.length === 0) {
                return res.status(404).json({ error: "El material solicitado ya no existe en el inventario." });
            }

            const { stock_disponible, descripcion } = material[0];

            if (stock_disponible < cantidad) {
                return res.status(400).json({ 
                    error: `No hay suficiente stock disponible de: ${descripcion}. Solicitado: ${cantidad}, Disponible: ${stock_disponible}` 
                });
            }

            await db.execute(
                "UPDATE materiales SET stock_disponible = stock_disponible - ? WHERE codigo = ?", 
                [cantidad, codigo_material]
            );

            await db.execute("UPDATE prestamos SET estado = 'activo' WHERE id = ?", [id_prestamo]);
            
            res.json({ mensaje: `¡Solicitud aprobada con éxito! Se descontaron ${cantidad} unidades de ${descripcion}.` });

        } else if (accion === 'rechazar') {
            await db.execute("DELETE FROM prestamos WHERE id = ?", [id_prestamo]);
            res.json({ mensaje: "Solicitud rechazada y eliminada del sistema." });
        }
    } catch (error) {
        console.error("Error al procesar la acción del préstamo:", error);
        res.status(500).json({ error: "Error interno al procesar la solicitud." });
    }
});

app.get('/api/prestamos/activos', async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.usuario_id, u.nombre AS solicitante, p.laboratorio, 
                   p.codigo_material, m.descripcion, p.cantidad, p.fecha_solicitud, p.fecha_entrega_estimada
            FROM prestamos p
            INNER JOIN usuarios u ON p.usuario_id = u.matricula
            INNER JOIN materiales m ON p.codigo_material = m.codigo
            WHERE p.estado = 'activo'
        `;
        const [resultado] = await db.execute(query);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener préstamos activos:", error);
        res.status(500).json({ error: "Error al cargar los préstamos activos." });
    }
});

app.post('/api/prestamos/devolver', async (req, res) => {
    const { id_prestamo } = req.body;

    if (!id_prestamo) {
        return res.status(400).json({ error: "Falta el ID del préstamo." });
    }

    try {
        const [prestamo] = await db.execute(
            "SELECT codigo_material, cantidad FROM prestamos WHERE id = ? AND estado = 'activo'",
            [id_prestamo]
        );

        if (prestamo.length === 0) {
            return res.status(400).json({ error: "Este material ya fue devuelto previamente o el registro no es válido." });
        }

        const { codigo_material, cantidad } = prestamo[0];

        await db.execute(
            "UPDATE materiales SET stock_disponible = stock_disponible + ? WHERE codigo = ?",
            [cantidad, codigo_material]
        );

        const fechaHoy = new Date().toISOString().split('T')[0];
        await db.execute(
            "UPDATE prestamos SET estado = 'devuelto', fecha_devolucion_real = ? WHERE id = ?",
            [fechaHoy, id_prestamo]
        );

        res.json({ mensaje: "Material devuelto con éxito. El inventario ha sido actualizado." });

    } catch (error) {
        console.error("Error al procesar la devolución:", error);
        res.status(500).json({ error: "Error interno al procesar la devolución." });
    }
});

app.get('/api/prestamos/concluidos', async (req, res) => {
    try {
        const query = `
            SELECT p.id, u.nombre AS solicitante, p.laboratorio, 
                   p.codigo_material, m.descripcion, p.cantidad, p.fecha_devolucion_real
            FROM prestamos p
            INNER JOIN usuarios u ON p.usuario_id = u.matricula
            INNER JOIN materiales m ON p.codigo_material = m.codigo
            WHERE p.estado = 'devuelto'
            ORDER BY p.fecha_devolucion_real DESC
        `;
        const [resultado] = await db.execute(query);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener vales concluidos:", error);
        res.status(500).json({ error: "Error al cargar el historial de concluidos." });
    }
});

app.get('/api/prestamos/alumno/:matricula', async (req, res) => {
    const { matricula } = req.params;

    try {
        const query = `
            SELECT p.id, p.laboratorio, m.descripcion, p.cantidad, 
                   p.fecha_solicitud, p.fecha_entrega_estimada,
                   IF(p.estado = 'activo' AND p.fecha_entrega_estimada < CURDATE(), 'retrasado', p.estado) AS estado
            FROM prestamos p
            INNER JOIN materiales m ON p.codigo_material = m.codigo
            WHERE p.usuario_id = ?
            ORDER BY p.fecha_solicitud DESC
        `;
        const [resultado] = await db.execute(query, [matricula]);
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener historial del alumno:", error);
        res.status(500).json({ error: "Error al cargar tu historial." });
    }
});


app.get('/api/prueba', (req, res) => {
    res.json({ mensaje: "¡El backend de Ctrl + Mat está vivo y escuchando!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});