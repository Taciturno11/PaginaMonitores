import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'
import Dashboard from './Dashboard'
import Sidebar from './Sidebar'
import HistorialPersonal from './HistorialPersonal'
import HistorialGeneral from './HistorialGeneral'
import FormularioEvaluacion from './FormularioEvaluacion'
import { io } from 'socket.io-client'

function App() {
  const [usuario, setUsuario] = useState(null);
  const [moduloActivo, setModuloActivo] = useState('monitoreo'); // Para monitores por defecto 'monitoreo', para jefa 'dashboard'
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
  const [inicioMonitoreo, setInicioMonitoreo] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
      setInicioMonitoreo(new Date()); // Guardar hora de inicio
      
      // Emitir evento Socket.IO de inicio de monitoreo
      if (socket && usuario && llamada) {
        socket.emit('iniciar_monitoreo', {
          dni: usuario.dni,
          llamadaId: llamada.ID_Largo
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
    setMostrarFormulario(true);
  };

  const handleGuardarEvaluacion = async (evaluacion) => {
    const fechaHoraFin = new Date();
    
    // Emitir evento Socket.IO de finalización
    if (socket && usuario) {
      socket.emit('finalizar_monitoreo', {
        dni: usuario.dni,
        tiempoTotal: tiempoMonitoreo
      });
    }
    
    // Guardar en base de datos
    if (inicioMonitoreo && llamada && usuario) {
      try {
        // Formatear fechas en hora local sin conversión UTC
        const formatearFechaLocal = (fecha) => {
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          const hours = String(fecha.getHours()).padStart(2, '0');
          const minutes = String(fecha.getMinutes()).padStart(2, '0');
          const seconds = String(fecha.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        const payload = {
          dniMonitor: usuario.dni,
          nombreMonitor: usuario.nombre,
          llamada: llamada,
          fechaHoraInicio: formatearFechaLocal(inicioMonitoreo),
          fechaHoraFin: formatearFechaLocal(fechaHoraFin),
          tiempoSegundos: tiempoMonitoreo,
          evaluacion: evaluacion
        };

        console.log('📤 Guardando monitoreo con evaluación:', payload);

        const response = await fetch(`${API_URL}/api/guardar-monitoreo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          console.log('✅ Monitoreo guardado en BD:', data);
          setTiempoFinal(tiempoMonitoreo);
          setMostrarFormulario(false);
        } else {
          console.error('❌ Error al guardar monitoreo:', data);
          alert('Error al guardar la evaluación');
        }
      } catch (error) {
        console.error('❌ Error al guardar monitoreo:', error);
        alert('Error al guardar la evaluación');
      }
    }
  };

  const handleCancelarEvaluacion = () => {
    setMostrarFormulario(false);
    setMonitoreoActivo(true); // Volver al monitoreo activo
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
    // Establecer módulo inicial según el rol
    setModuloActivo(usuarioData.rol === 'jefa' ? 'dashboard' : 'monitoreo');
  };

  const handleCambiarModulo = (modulo) => {
    setModuloActivo(modulo);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  // Si no hay usuario, mostrar login
  if (!usuario) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderModulo = () => {
    // Para la jefa
    if (usuario.rol === 'jefa') {
      if (moduloActivo === 'dashboard') {
        return <Dashboard socket={socket} />;
      } else if (moduloActivo === 'historial-general') {
        return <HistorialGeneral />;
      }
    }
    
    // Para monitores
    if (usuario.rol === 'monitor') {
      if (moduloActivo === 'monitoreo') {
        // Renderizar el módulo de monitoreo (el código actual)
  return (
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

          {/* Contador y cronómetro debajo de los filtros */}
          {llamada && !mostrarFormulario && (
            <div className="monitoreo-controles">
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
                    ✅ Completado: <strong>{formatearTiempo(tiempoFinal)}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Formulario de evaluación en el espacio del cronómetro */}
          {llamada && mostrarFormulario && (
            <FormularioEvaluacion
              llamada={llamada}
              tiempoMonitoreo={formatearTiempo(tiempoMonitoreo)}
              onGuardar={handleGuardarEvaluacion}
              onCancelar={handleCancelarEvaluacion}
            />
          )}
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
            <div className="llamada-detalle">
                <h2>📞 Detalle de la Llamada</h2>
              
                <div className="detalle-lineas">
                  <div className="detalle-seccion">
                    <h3>📋 Información de la Llamada</h3>
                    <div className="detalle-linea">
                      <span className="icono">🆔</span>
                      <span className="label">ID:</span>
                      <span className="valor">{llamada.ID_Largo || 'N/A'}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">📱</span>
                      <span className="label">Número:</span>
                      <span className="valor">{llamada.Numero}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">📅</span>
                      <span className="label">Fecha:</span>
                      <span className="valor">
                        {llamada.Fecha.includes('T') 
                          ? llamada.Fecha.split('T')[0].split('-').reverse().join('/')
                          : new Date(llamada.Fecha).toLocaleDateString()
                        }
                      </span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">🕐</span>
                      <span className="label">Hora:</span>
                      <span className="valor">
                        {llamada.Hora 
                          ? llamada.Hora.split('T')[1]?.substring(0, 8) || llamada.Hora
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">⏱️</span>
                      <span className="label">Duración:</span>
                      <span className="valor">
                        {llamada.Duracion >= 60 
                          ? `${Math.floor(llamada.Duracion / 60)}m ${llamada.Duracion % 60}s`
                          : `${llamada.Duracion}s`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="detalle-seccion">
                    <h3>👤 Agente</h3>
                    <div className="detalle-linea">
                      <span className="icono">👨‍💼</span>
                      <span className="label">Nombre:</span>
                      <span className="valor">{llamada.NombreCompletoAgente} <span className="dni-parentesis">({llamada.DNIEmpleado})</span></span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">💼</span>
                      <span className="label">Cargo:</span>
                      <span className="valor">{llamada.Cargo}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">✅</span>
                      <span className="label">Estado:</span>
                      <span className="valor badge-estado">{llamada.EstadoEmpleado}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">🏢</span>
                      <span className="label">Modalidad:</span>
                      <span className="valor">{llamada.Modalidad}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">⏰</span>
                      <span className="label">Jornada:</span>
                      <span className="valor">{llamada.Jornada}</span>
                    </div>
                  </div>

                  <div className="detalle-seccion">
                    <h3>🎯 Campaña y Gestión</h3>
                    <div className="detalle-linea">
                      <span className="icono">🎯</span>
                      <span className="label">Campaña:</span>
                      <span className="valor">{llamada.Campaña_Agente}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">📞</span>
                      <span className="label">Cola:</span>
                      <span className="valor">{llamada.Cola}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">👔</span>
                      <span className="label">Supervisor:</span>
                      <span className="valor">{llamada.NombreCompletoSupervisor}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">👤</span>
                      <span className="label">Usuario Origen:</span>
                      <span className="valor">{llamada.Usuario_Llamada_Origen}</span>
                    </div>
                  </div>

                  <div className="detalle-seccion">
                    <h3>📝 Tipificación</h3>
                    <div className="detalle-linea">
                      <span className="icono">📋</span>
                      <span className="label">Detalle:</span>
                      <span className="valor">{llamada.Tipificacion_Detalle}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">📊</span>
                      <span className="label">Estado IPC:</span>
                      <span className="valor">{llamada.Tipificacion_Estado_IPC}</span>
                    </div>
                    <div className="detalle-linea">
                      <span className="icono">✓</span>
                      <span className="label">Estado General:</span>
                      <span className="valor">{llamada.Tipificacion_Estado_General}</span>
                    </div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
        );
      } else if (moduloActivo === 'mi-historial') {
        return <HistorialPersonal usuario={usuario} />;
      }
    }
    
    return null;
  };

  return (
    <div className="app-layout">
      <Sidebar 
        rol={usuario.rol} 
        moduloActivo={moduloActivo} 
        onCambiarModulo={handleCambiarModulo} 
      />
      
      <div className="main-content">
        <header>
          <div className="header-content">
            <div className="header-left">
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

        <div className="modulo-container">
          {renderModulo()}
        </div>
      </div>

    </div>
  )
}

export default App
