// Carga las variables de entorno
const os = require('os');
require('dotenv').config(); 
const cors = require('cors');
const express = require('express');
const sql = require('mssql');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir todos los orígenes (para desarrollo)
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const PORT = process.env.PORT; 

// Estado de los monitores en memoria
const monitores = new Map();
// Map estructura: dni -> { dni, nombre, rol, estado, conectadoDesde, tiempoEnLlamada, tiempoInactivo, socketId, llamadaActual }

// Función para obtener las IPs locales
function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
      // Itera sobre todas las interfaces de red (Ethernet, Wi-Fi, etc.)
      for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            // Solo queremos IPv4, no direcciones internas (loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

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
        AND ID_Largo IS NOT NULL
        AND ID_Largo != ''
        AND Duracion >= 60
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

// Endpoint para guardar monitoreo en BD
app.post('/api/guardar-monitoreo', async (req, res) => {
  try {
    const {
      dniMonitor,
      nombreMonitor,
      llamada,
      fechaHoraInicio,
      fechaHoraFin,
      tiempoSegundos
    } = req.body;

    // Validaciones
    if (!dniMonitor || !nombreMonitor || !llamada || !fechaHoraInicio || !fechaHoraFin || !tiempoSegundos) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .input('dniMonitor', sql.VarChar, dniMonitor)
      .input('nombreMonitor', sql.VarChar, nombreMonitor)
      .input('idLlamadaLargo', sql.VarChar, llamada.ID_Largo)
      .input('numeroLlamada', sql.VarChar, llamada.Numero)
      .input('fechaLlamada', sql.Date, llamada.Fecha)
      .input('horaLlamada', sql.Time, llamada.Hora)
      .input('duracionLlamada', sql.Int, llamada.Duracion)
      .input('agenteAuditado', sql.VarChar, llamada.NombreCompletoAgente)
      .input('dniEmpleadoAuditado', sql.VarChar, llamada.DNIEmpleado)
      .input('campanaAuditada', sql.VarChar, llamada.Campaña_Agente)
      .input('colaAuditada', sql.VarChar, llamada.Cola)
      .input('fechaHoraInicio', sql.DateTime, fechaHoraInicio)
      .input('fechaHoraFin', sql.DateTime, fechaHoraFin)
      .input('tiempoSegundos', sql.Int, tiempoSegundos)
      .query(`
        INSERT INTO [Partner].[mo].[Historial_Monitoreos]
          (DNIMonitor, NombreMonitor, ID_Llamada_Largo, NumeroLlamada, FechaLlamada, 
           HoraLlamada, DuracionLlamada, AgenteAuditado, DNIEmpleadoAuditado, 
           CampañaAuditada, ColaAuditada, FechaHoraInicio, FechaHoraFin, TiempoMonitoreoSegundos)
        VALUES
          (@dniMonitor, @nombreMonitor, @idLlamadaLargo, @numeroLlamada, @fechaLlamada,
           @horaLlamada, @duracionLlamada, @agenteAuditado, @dniEmpleadoAuditado,
           @campanaAuditada, @colaAuditada, @fechaHoraInicio, @fechaHoraFin, @tiempoSegundos);
        
        SELECT SCOPE_IDENTITY() AS ID;
      `);

    res.json({
      success: true,
      id: result.recordset[0].ID,
      message: 'Monitoreo guardado correctamente'
    });
  } catch (error) {
    console.error('Error al guardar monitoreo:', error);
    res.status(500).json({ error: 'Error al guardar monitoreo', detalle: error.message });
  }
});

// Endpoint para obtener historial personal de un monitor
app.get('/api/mi-historial', async (req, res) => {
  try {
    const { dni } = req.query;

    if (!dni) {
      return res.status(400).json({ error: 'DNI es requerido' });
    }

    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .input('dni', sql.VarChar, dni)
      .query(`
        SELECT 
          ID,
          ID_Llamada_Largo,
          NumeroLlamada,
          FechaLlamada,
          HoraLlamada,
          DuracionLlamada,
          AgenteAuditado,
          DNIEmpleadoAuditado,
          CampañaAuditada,
          ColaAuditada,
          FechaHoraInicio,
          FechaHoraFin,
          TiempoMonitoreoSegundos,
          CreadoEn
        FROM [Partner].[mo].[Historial_Monitoreos]
        WHERE DNIMonitor = @dni
        ORDER BY FechaHoraInicio DESC
      `);

    // Calcular estadísticas
    const total = result.recordset.length;
    const tiempoTotal = result.recordset.reduce((sum, r) => sum + r.TiempoMonitoreoSegundos, 0);
    const tiempoPromedio = total > 0 ? Math.floor(tiempoTotal / total) : 0;

    // Filtrar por hoy
    const hoy = new Date().toISOString().split('T')[0];
    const monitoreosHoy = result.recordset.filter(r => {
      const fecha = new Date(r.FechaHoraInicio).toISOString().split('T')[0];
      return fecha === hoy;
    });

    res.json({
      monitoreos: result.recordset,
      estadisticas: {
        total: total,
        hoy: monitoreosHoy.length,
        tiempoTotalSegundos: tiempoTotal,
        tiempoPromedioSegundos: tiempoPromedio
      }
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial', detalle: error.message });
  }
});

// Endpoint para obtener historial general (solo jefa)
app.get('/api/historial-general', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request().query(`
      SELECT 
        ID,
        DNIMonitor,
        NombreMonitor,
        ID_Llamada_Largo,
        NumeroLlamada,
        FechaLlamada,
        HoraLlamada,
        DuracionLlamada,
        AgenteAuditado,
        DNIEmpleadoAuditado,
        CampañaAuditada,
        ColaAuditada,
        FechaHoraInicio,
        FechaHoraFin,
        TiempoMonitoreoSegundos,
        CreadoEn
      FROM [Partner].[mo].[Historial_Monitoreos]
      ORDER BY FechaHoraInicio DESC
    `);

    // Estadísticas generales
    const total = result.recordset.length;
    const tiempoTotal = result.recordset.reduce((sum, r) => sum + r.TiempoMonitoreoSegundos, 0);

    // Estadísticas por monitor
    const statsPorMonitor = {};
    result.recordset.forEach(r => {
      if (!statsPorMonitor[r.DNIMonitor]) {
        statsPorMonitor[r.DNIMonitor] = {
          dni: r.DNIMonitor,
          nombre: r.NombreMonitor,
          total: 0,
          tiempoTotal: 0
        };
      }
      statsPorMonitor[r.DNIMonitor].total++;
      statsPorMonitor[r.DNIMonitor].tiempoTotal += r.TiempoMonitoreoSegundos;
    });

    const ranking = Object.values(statsPorMonitor)
      .sort((a, b) => b.total - a.total)
      .map((m, index) => ({
        posicion: index + 1,
        ...m,
        tiempoPromedio: m.total > 0 ? Math.floor(m.tiempoTotal / m.total) : 0
      }));

    res.json({
      monitoreos: result.recordset,
      estadisticas: {
        total: total,
        tiempoTotalSegundos: tiempoTotal,
        ranking: ranking
      }
    });
  } catch (error) {
    console.error('Error al obtener historial general:', error);
    res.status(500).json({ error: 'Error al obtener historial general', detalle: error.message });
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

// =====================================================
// SOCKET.IO - Manejo de conexiones en tiempo real
// =====================================================

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Evento: Monitor/Jefa se conecta y envía sus datos
  socket.on('usuario_conectado', (data) => {
    const { dni, nombre, rol } = data;
    
    console.log(`👤 Usuario conectado: ${nombre} (${rol}) - DNI: ${dni}`);
    
    // Guardar/actualizar información del monitor
    monitores.set(dni, {
      dni,
      nombre,
      rol,
      estado: 'conectado', // Estados: conectado, en_llamada, desconectado
      conectadoDesde: Date.now(),
      tiempoEnLlamada: 0,
      tiempoInactivo: 0,
      socketId: socket.id,
      llamadaActual: null,
      ultimaActualizacion: Date.now()
    });

    // Unir a sala según el rol
    if (rol === 'jefa') {
      socket.join('sala_jefa');
      console.log('👑 Jefa unida a sala_jefa');
    } else {
      socket.join('sala_monitores');
      console.log('👤 Monitor unido a sala_monitores');
    }

    // Enviar lista actualizada de monitores a la jefa
    emitirEstadoMonitoresAJefa();
  });

  // Evento: Monitor inicia monitoreo de una llamada
  socket.on('iniciar_monitoreo', (data) => {
    const { dni, llamadaId } = data;
    
    const monitor = monitores.get(dni);
    if (monitor) {
      monitor.estado = 'en_llamada';
      monitor.llamadaActual = {
        id: llamadaId,
        inicioMonitoreo: Date.now()
      };
      monitor.ultimaActualizacion = Date.now();
      
      console.log(`▶️ Monitor ${monitor.nombre} inició monitoreo de llamada ${llamadaId}`);
      
      // Notificar a la jefa
      emitirEstadoMonitoresAJefa();
    }
  });

  // Evento: Monitor finaliza monitoreo de una llamada
  socket.on('finalizar_monitoreo', (data) => {
    const { dni, tiempoTotal } = data;
    
    const monitor = monitores.get(dni);
    if (monitor && monitor.llamadaActual) {
      const tiempoMonitoreo = Math.floor((Date.now() - monitor.llamadaActual.inicioMonitoreo) / 1000);
      
      monitor.estado = 'conectado';
      monitor.tiempoEnLlamada += tiempoMonitoreo;
      monitor.llamadaActual = null;
      monitor.ultimaActualizacion = Date.now();
      
      console.log(`⏹️ Monitor ${monitor.nombre} finalizó monitoreo (${tiempoMonitoreo}s)`);
      
      // Notificar a la jefa
      emitirEstadoMonitoresAJefa();
    }
  });

  // Evento: Actualización periódica de tiempo (cada segundo)
  socket.on('actualizar_tiempo', (data) => {
    const { dni } = data;
    
    const monitor = monitores.get(dni);
    if (monitor) {
      monitor.ultimaActualizacion = Date.now();
      
      // Calcular tiempos
      const tiempoConectado = Math.floor((Date.now() - monitor.conectadoDesde) / 1000);
      
      if (monitor.estado === 'conectado') {
        // Tiempo inactivo = tiempo conectado - tiempo en llamada
        monitor.tiempoInactivo = tiempoConectado - monitor.tiempoEnLlamada;
      }
    }
  });

  // Evento: Desconexión
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
    
    // Buscar el monitor por socketId
    for (const [dni, monitor] of monitores.entries()) {
      if (monitor.socketId === socket.id) {
        monitor.estado = 'desconectado';
        monitor.ultimaActualizacion = Date.now();
        
        console.log(`👤 Monitor desconectado: ${monitor.nombre}`);
        
        // Notificar a la jefa
        emitirEstadoMonitoresAJefa();
        break;
      }
    }
  });
});

// Función para enviar estado de monitores a la jefa
function emitirEstadoMonitoresAJefa() {
  const estadoMonitores = Array.from(monitores.values()).map(monitor => {
    const ahora = Date.now();
    const tiempoConectado = Math.floor((ahora - monitor.conectadoDesde) / 1000);
    
    let tiempoEnLlamada = monitor.tiempoEnLlamada;
    let tiempoInactivo = monitor.tiempoInactivo;
    let tiempoDesconectado = 0;
    
    // Si está en llamada actualmente, sumar el tiempo actual
    if (monitor.estado === 'en_llamada' && monitor.llamadaActual) {
      const tiempoLlamadaActual = Math.floor((ahora - monitor.llamadaActual.inicioMonitoreo) / 1000);
      tiempoEnLlamada += tiempoLlamadaActual;
    }
    
    // Si está conectado pero no en llamada, es tiempo inactivo
    if (monitor.estado === 'conectado') {
      tiempoInactivo = tiempoConectado - monitor.tiempoEnLlamada;
    }
    
    // Si está desconectado, calcular tiempo desconectado
    if (monitor.estado === 'desconectado') {
      tiempoDesconectado = Math.floor((ahora - monitor.ultimaActualizacion) / 1000);
    }
    
    return {
      dni: monitor.dni,
      nombre: monitor.nombre,
      rol: monitor.rol,
      estado: monitor.estado,
      tiempoEnLlamada,
      tiempoInactivo,
      tiempoDesconectado,
      llamadaActual: monitor.llamadaActual?.id || null
    };
  });
  
  // Emitir solo a la sala de la jefa
  io.to('sala_jefa').emit('estado_monitores', estadoMonitores);
}

// Actualizar estado cada segundo
setInterval(() => {
  emitirEstadoMonitoresAJefa();
}, 1000);

// =====================================================
// FIN SOCKET.IO
// =====================================================

// Inicia el servidor
const HOST = '0.0.0.0';
// Inicia el servidor
server.listen(PORT, HOST, () => {
    console.log(`\n--- Accesible a través de ---`);
    
    // Imprime localhost (siempre funciona)
    console.log(`👉 http://localhost:${PORT}`);
    
    // Imprime las IPs detectadas dinámicamente
    const localIps = getLocalIps();
    localIps.forEach(ip => {
        console.log(`👉 http://${ip}:${PORT}`);
    });
  
    console.log(`-----------------------------`);
  });