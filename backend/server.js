// Carga las variables de entorno
require('dotenv').config(); 
const cors = require('cors');
const express = require('express');
const sql = require('mssql');

const app = express();
app.use(cors());

const PORT = process.env.PORT; 

// Configuración de la base de datos SQL Server
const dbConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  port: parseInt(process.env.SQL_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Middleware: Permite que Express lea peticiones con formato JSON
app.use(express.json());

// Ruta de prueba (Endpoint)
app.get('/api/saludo', (req, res) => {
  res.json({ message: '¡Hola desde el Backend de Node.js!' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a mi API' });
});

// Endpoint para obtener una llamada aleatoria con filtros
app.post('/api/llamada-aleatoria', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const { fechaInicio, fechaFin, campana, agente, supervisor, cola } = req.body;
    
    // Construir query con filtros opcionales
    let query = `
      SELECT TOP 1 *
      FROM [Partner].[dbo].[Reporte_Llamadas_Detalle]
      WHERE 1=1
    `;
    
    const params = [];
    
    if (fechaInicio) {
      query += ` AND Fecha >= @fechaInicio`;
      params.push({ name: 'fechaInicio', type: sql.Date, value: fechaInicio });
    }
    
    if (fechaFin) {
      query += ` AND Fecha <= @fechaFin`;
      params.push({ name: 'fechaFin', type: sql.Date, value: fechaFin });
    }
    
    if (campana) {
      query += ` AND Campaña_Agente = @campana`;
      params.push({ name: 'campana', type: sql.NVarChar, value: campana });
    }
    
    if (agente) {
      query += ` AND NombreCompletoAgente LIKE @agente`;
      params.push({ name: 'agente', type: sql.NVarChar, value: `%${agente}%` });
    }
    
    if (supervisor) {
      query += ` AND NombreCompletoSupervisor LIKE @supervisor`;
      params.push({ name: 'supervisor', type: sql.NVarChar, value: `%${supervisor}%` });
    }
    
    if (cola) {
      query += ` AND Cola = @cola`;
      params.push({ name: 'cola', type: sql.NVarChar, value: cola });
    }
    
    query += ` ORDER BY NEWID()`; // Orden aleatorio
    
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'No se encontraron llamadas con esos filtros' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al obtener llamada:', error);
    res.status(500).json({ error: 'Error al obtener llamada', detalle: error.message });
  }
});

// Endpoint para obtener opciones de filtros (campañas, colas disponibles)
app.get('/api/opciones-filtros', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const campanas = await pool.request().query(`
      SELECT DISTINCT Campaña_Agente 
      FROM [Partner].[dbo].[Reporte_Llamadas_Detalle] 
      WHERE Campaña_Agente IS NOT NULL 
      ORDER BY Campaña_Agente
    `);
    
    const colas = await pool.request().query(`
      SELECT DISTINCT Cola 
      FROM [Partner].[dbo].[Reporte_Llamadas_Detalle] 
      WHERE Cola IS NOT NULL 
      ORDER BY Cola
    `);
    
    res.json({
      campanas: campanas.recordset.map(r => r['Campaña_Agente']),
      colas: colas.recordset.map(r => r.Cola)
    });
  } catch (error) {
    console.error('Error al obtener opciones:', error);
    res.status(500).json({ error: 'Error al obtener opciones de filtros', detalle: error.message });
  }
});

// Endpoint de login para monitores y jefa
app.post('/api/login', async (req, res) => {
  try {
    const { dni, password } = req.body;

    // Validar que se envíen DNI y contraseña
    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y contraseña son requeridos' });
    }

    // Verificar que DNI y contraseña coincidan (ambos deben ser el DNI)
    if (dni !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const pool = await sql.connect(dbConfig);
    
    // Verificar si es monitor activo o la jefa
    const result = await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        SELECT 
          DNI,
          Nombres,
          ApellidoPaterno,
          ApellidoMaterno,
          CargoID,
          EstadoEmpleado
        FROM [Partner].[PRI].[Empleados]
        WHERE DNI = @dni 
          AND (
            (CargoID = 6 AND EstadoEmpleado = 'Activo')
            OR DNI = '76157106'
          )
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'No tienes acceso a esta aplicación' });
    }

    const empleado = result.recordset[0];
    
    // Determinar el rol
    const rol = empleado.DNI === '76157106' ? 'jefa' : 'monitor';
    
    res.json({
      success: true,
      usuario: {
        dni: empleado.DNI,
        nombre: `${empleado.Nombres} ${empleado.ApellidoPaterno} ${empleado.ApellidoMaterno}`,
        rol: rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al procesar login', detalle: error.message });
  }
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Backend corriendo en http://localhost:${PORT}`);
});