import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'
import Dashboard from './Dashboard'
import { io } from 'socket.io-client'

function App() {
  const [usuario, setUsuario] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    campana: '',
    agente: '',
    supervisor: '',
    cola: ''
  });

  const [llamada, setLlamada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opciones, setOpciones] = useState({ campanas: [], colas: [] });
  
  // Estados para el monitoreo
  const [contadorInicial, setContadorInicial] = useState(null);
  const [monitoreoActivo, setMonitoreoActivo] = useState(false);
  const [tiempoMonitoreo, setTiempoMonitoreo] = useState(0);
  const [tiempoFinal, setTiempoFinal] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const [socket, setSocket] = useState(null);

  // Verificar si hay usuario en localStorage al cargar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Conectar Socket.IO cuando hay usuario
  useEffect(() => {
    if (usuario) {
      // Crear conexión Socket.IO
      const newSocket = io(API_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Conectado a Socket.IO');
        
        // Emitir evento de conexión con datos del usuario
        newSocket.emit('usuario_conectado', {
          dni: usuario.dni,
          nombre: usuario.nombre,
          rol: usuario.rol
        });
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Desconectado de Socket.IO');
      });

      // Guardar socket en estado
      setSocket(newSocket);

      // Actualizar tiempo cada segundo
      const interval = setInterval(() => {
        if (newSocket && usuario) {
          newSocket.emit('actualizar_tiempo', { dni: usuario.dni });
        }
      }, 1000);

      // Cleanup al desmontar
      return () => {
        clearInterval(interval);
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [usuario, API_URL]);

  // Cargar opciones de filtros al iniciar
  useEffect(() => {
    fetch(`${API_URL}/api/opciones-filtros`)
      .then(res => res.json())
      .then(data => setOpciones(data))
      .catch(err => console.error('Error al cargar opciones:', err));
  }, [API_URL]);

  // Contador inicial (5, 4, 3, 2, 1)
  useEffect(() => {
    if (contadorInicial !== null && contadorInicial > 0) {
      const timer = setTimeout(() => {
        setContadorInicial(contadorInicial - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (contadorInicial === 0) {
      // Iniciar monitoreo cuando el contador llegue a 0
      setContadorInicial(null);
      setMonitoreoActivo(true);
      setTiempoMonitoreo(0);
      
      // Emitir evento Socket.IO de inicio de monitoreo
      if (socket && usuario && llamada) {
        socket.emit('iniciar_monitoreo', {
          dni: usuario.dni,
          llamadaId: llamada.ID_Corto || llamada.ID_Largo
        });
      }
    }
  }, [contadorInicial, usuario, llamada, socket]);

  // Cronómetro de monitoreo activo
  useEffect(() => {
    if (monitoreoActivo) {
      const interval = setInterval(() => {
        setTiempoMonitoreo(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [monitoreoActivo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const obtenerLlamadaAleatoria = async () => {
    setLoading(true);
    setError('');
    setLlamada(null);
    setContadorInicial(null);
    setMonitoreoActivo(false);
    setTiempoFinal(null);

    try {
      const response = await fetch(`${API_URL}/api/llamada-aleatoria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filtros)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener llamada');
      }

      const data = await response.json();
      setLlamada(data);
      // Iniciar contador de 5 segundos
      setContadorInicial(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizarMonitoreo = () => {
    setMonitoreoActivo(false);
    setTiempoFinal(tiempoMonitoreo);
    
    // Emitir evento Socket.IO de finalización
    if (socket && usuario) {
      socket.emit('finalizar_monitoreo', {
        dni: usuario.dni,
        tiempoTotal: tiempoMonitoreo
      });
    }
  };

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const handleLoginSuccess = (usuarioData) => {
    setUsuario(usuarioData);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  // Si no hay usuario, mostrar login
  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <div className="header-left">
            <img src="/partnerlogo.svg" alt="Partner Logo" className="header-logo" />
            <div>
              <h1>🎧 Monitor de Llamadas</h1>
              <p>Sistema de auditoría de llamadas</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{usuario.nombre}</span>
              <span className="user-rol">{usuario.rol === 'jefa' ? '👑 Jefa' : '👤 Monitor'}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {usuario.rol === 'jefa' ? (
        // Vista de la jefa: Dashboard con monitores
        <Dashboard socket={socket} />
      ) : (
        // Vista del monitor: Búsqueda de llamadas
        <div className="content-layout">
          <div className="filtros-container">
          <h2>Filtros de Búsqueda</h2>
          
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Fecha Inicio:</label>
              <input 
                type="date" 
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleInputChange}
              />
            </div>

            <div className="filtro-item">
              <label>Fecha Fin:</label>
              <input 
                type="date" 
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleInputChange}
              />
            </div>

            <div className="filtro-item">
              <label>Campaña:</label>
              <select 
                name="campana"
                value={filtros.campana}
                onChange={handleInputChange}
              >
                <option value="">Todas</option>
                {opciones.campanas.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>Cola:</label>
              <select 
                name="cola"
                value={filtros.cola}
                onChange={handleInputChange}
              >
                <option value="">Todas</option>
                {opciones.colas.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>Agente:</label>
              <input 
                type="text" 
                name="agente"
                value={filtros.agente}
                onChange={handleInputChange}
                placeholder="Buscar por nombre"
              />
            </div>

            <div className="filtro-item">
              <label>Supervisor:</label>
              <input 
                type="text" 
                name="supervisor"
                value={filtros.supervisor}
                onChange={handleInputChange}
                placeholder="Buscar por nombre"
              />
            </div>
          </div>

          <button 
            className="btn-buscar"
            onClick={obtenerLlamadaAleatoria}
            disabled={loading}
          >
            {loading ? '🔄 Buscando...' : '🎲 Obtener Llamada Aleatoria'}
          </button>
        </div>

        <div className="results-area">
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {!llamada && !error && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p>Selecciona filtros y haz clic en "Obtener Llamada Aleatoria" para empezar</p>
            </div>
          )}

          {llamada && (
            <>
              {/* Contador inicial */}
              {contadorInicial !== null && (
                <div className="contador-inicial">
                  <div className="contador-numero">{contadorInicial}</div>
                  <p>Iniciando monitoreo...</p>
                </div>
              )}

              {/* Cronómetro activo */}
              {monitoreoActivo && (
                <div className="cronometro-activo">
                  <div className="cronometro-tiempo">{formatearTiempo(tiempoMonitoreo)}</div>
                  <button className="btn-finalizar" onClick={finalizarMonitoreo}>
                    ⏹ Finalizar Monitoreo
                  </button>
                </div>
              )}

              {/* Tiempo final */}
              {tiempoFinal !== null && (
                <div className="tiempo-final">
                  <div className="tiempo-completado">
                    ✅ Monitoreo completado: <strong>{formatearTiempo(tiempoFinal)}</strong>
                  </div>
                </div>
              )}

              <div className="llamada-detalle">
                <h2>📞 Detalle de la Llamada</h2>
              
              <div className="info-grid">
            <div className="info-item">
              <strong>ID Corto:</strong>
              <span>{llamada.ID_Corto}</span>
            </div>

            <div className="info-item">
              <strong>ID Largo:</strong>
              <span>{llamada.ID_Largo}</span>
            </div>

            <div className="info-item">
              <strong>Número:</strong>
              <span>{llamada.Numero}</span>
            </div>

            <div className="info-item">
              <strong>Fecha:</strong>
              <span>{new Date(llamada.Fecha).toLocaleDateString()}</span>
            </div>

            <div className="info-item">
              <strong>Hora:</strong>
              <span>{llamada.Hora}</span>
            </div>

            <div className="info-item">
              <strong>Duración:</strong>
              <span>{llamada.Duracion}</span>
            </div>

            <div className="info-item">
              <strong>Cola:</strong>
              <span>{llamada.Cola}</span>
            </div>

            <div className="info-item">
              <strong>Agente:</strong>
              <span>{llamada.NombreCompletoAgente}</span>
            </div>

            <div className="info-item">
              <strong>DNI Empleado:</strong>
              <span>{llamada.DNIEmpleado}</span>
            </div>

            <div className="info-item">
              <strong>Cargo:</strong>
              <span>{llamada.Cargo}</span>
            </div>

            <div className="info-item">
              <strong>Estado Empleado:</strong>
              <span>{llamada.EstadoEmpleado}</span>
            </div>

            <div className="info-item">
              <strong>Modalidad:</strong>
              <span>{llamada.Modalidad}</span>
            </div>

            <div className="info-item">
              <strong>Jornada:</strong>
              <span>{llamada.Jornada}</span>
            </div>

            <div className="info-item">
              <strong>Campaña:</strong>
              <span>{llamada.Campaña_Agente}</span>
            </div>

            <div className="info-item">
              <strong>Supervisor:</strong>
              <span>{llamada.NombreCompletoSupervisor}</span>
            </div>

            <div className="info-item">
              <strong>Tipificación Detalle:</strong>
              <span>{llamada.Tipificacion_Detalle}</span>
            </div>

            <div className="info-item">
              <strong>Tipificación Estado IPC:</strong>
              <span>{llamada.Tipificacion_Estado_IPC}</span>
            </div>

            <div className="info-item">
              <strong>Tipificación Estado General:</strong>
              <span>{llamada.Tipificacion_Estado_General}</span>
            </div>

            <div className="info-item">
              <strong>Usuario Llamada Origen:</strong>
              <span>{llamada.Usuario_Llamada_Origen}</span>
            </div>

            <div className="info-item">
              <strong>Reporte ID:</strong>
              <span>{llamada.ReporteID}</span>
            </div>
          </div>
        </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default App
