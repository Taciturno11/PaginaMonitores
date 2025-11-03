import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'
import Dashboard from './Dashboard'
import Sidebar from './Sidebar'
import HistorialPersonal from './HistorialPersonal'
import HistorialGeneral from './HistorialGeneral'
import Reporte from './Reporte'
import FormularioEvaluacion from './FormularioEvaluacion'
import EncuestaMonitoreo from './EncuestaMonitoreo'
import { io } from 'socket.io-client'
import { Icon } from '@iconify/react'

function App() {
  // Función para obtener fechas por defecto
  const obtenerFechasPorDefecto = () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const formatearFecha = (fecha) => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      fechaInicio: formatearFecha(primerDiaMes),
      fechaFin: formatearFecha(hoy)
    };
  };

  const fechasDefecto = obtenerFechasPorDefecto();
  
  const [usuario, setUsuario] = useState(null);
  const [moduloActivo, setModuloActivo] = useState('monitoreo'); // Para monitores por defecto 'monitoreo', para jefa 'dashboard'
  const [filtros, setFiltros] = useState({
    fechaInicio: fechasDefecto.fechaInicio,
    fechaFin: fechasDefecto.fechaFin,
    campana: '',
    agente: '',
    idLargo: '',
    cola: ''
  });

  const [llamada, setLlamada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opciones, setOpciones] = useState({ campanas: [], colas: [] });
  const [agentes, setAgentes] = useState([]);
  const [agentesFiltrados, setAgentesFiltrados] = useState([]);
  const [mostrarSugerenciasAgente, setMostrarSugerenciasAgente] = useState(false);
  
  // Estados para el monitoreo
  const [contadorInicial, setContadorInicial] = useState(null);
  const [monitoreoActivo, setMonitoreoActivo] = useState(false);
  const [tiempoMonitoreo, setTiempoMonitoreo] = useState(0);
  const [tiempoFinal, setTiempoFinal] = useState(null);
  const [inicioMonitoreo, setInicioMonitoreo] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEncuesta, setMostrarEncuesta] = useState(false);
  const [audioCargando, setAudioCargando] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  const [socket, setSocket] = useState(null);

  // Cargar usuario y módulo activo desde sessionStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = sessionStorage.getItem('usuario');
    const moduloGuardado = sessionStorage.getItem('moduloActivo');
    
    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
        
        // Restaurar módulo activo si existe
        if (moduloGuardado) {
          setModuloActivo(moduloGuardado);
        }
      } catch (e) {
        console.error('Error al cargar datos guardados:', e);
        sessionStorage.removeItem('usuario');
        sessionStorage.removeItem('moduloActivo');
      }
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

  // Animación de carga del audio (3 segundos)
  useEffect(() => {
    if (llamada) {
      setAudioCargando(true);
      const timer = setTimeout(() => {
        setAudioCargando(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [llamada]);

  // Cargar agentes filtrados según campaña y cola seleccionadas
  useEffect(() => {
    const cargarAgentes = async () => {
      try {
        // Construir URL con filtros
        let url = `${API_URL}/api/agentes`;
        const params = [];
        
        if (filtros.campana) {
          params.push(`campana=${encodeURIComponent(filtros.campana)}`);
        }
        if (filtros.cola) {
          params.push(`cola=${encodeURIComponent(filtros.cola)}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.agentes) {
          setAgentes(data.agentes);
        }
      } catch (err) {
        console.error('Error al cargar agentes:', err);
      }
    };
    
    cargarAgentes();
  }, [filtros.campana, filtros.cola, API_URL]);
  
  // Cargar campañas disponibles al iniciar
  useEffect(() => {
    const cargarCampanas = async () => {
      try {
        const res = await fetch(`${API_URL}/api/opciones-filtros`);
        const data = await res.json();
        if (res.ok && data.campanas) {
          setOpciones(prev => ({
            ...prev,
            campanas: data.campanas
          }));
        }
      } catch (err) {
        console.error('Error al cargar campañas:', err);
      }
    };
    
    cargarCampanas();
  }, [API_URL]);
  
  // Cargar y actualizar colas según campaña seleccionada y usuario
  useEffect(() => {
    const cargarColas = async () => {
      if (filtros.campana) {
        // Caso 1: Hay campaña seleccionada → cargar SOLO las colas de esa campaña específica
        try {
          const res = await fetch(`${API_URL}/api/colas-por-campana?campana=${encodeURIComponent(filtros.campana)}`);
          const data = await res.json();
          
          if (res.ok && data.colas) {
            setOpciones(prev => ({
              ...prev,
              colas: data.colas
            }));
          }
        } catch (err) {
          console.error('Error al cargar colas por campaña:', err);
        }
      } else if (usuario?.dni) {
        // Caso 2: No hay campaña seleccionada pero hay usuario → cargar colas de TODAS sus campañas asignadas
        try {
          const url = `${API_URL}/api/opciones-filtros?dniUsuario=${usuario.dni}&rolUsuario=${usuario.rol || ''}`;
          const res = await fetch(url);
          const data = await res.json();
          
          if (res.ok && data.colas) {
            setOpciones(prev => ({
              ...prev,
              colas: data.colas
            }));
          }
        } catch (err) {
          console.error('Error al cargar colas:', err);
        }
      }
    };
    
    cargarColas();
  }, [filtros.campana, usuario?.dni, usuario?.rol, API_URL]);

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
    
    // Si cambia la campaña, limpiar filtros de cola y agente
    if (name === 'campana') {
      setFiltros(prev => ({
        ...prev,
        campana: value,
        cola: '', // Limpiar cola al cambiar campaña
        agente: '' // Limpiar agente al cambiar campaña
      }));
      setAgentesFiltrados([]);
      setMostrarSugerenciasAgente(false);
    } else if (name === 'cola') {
      // Si cambia la cola, limpiar filtro de agente
      setFiltros(prev => ({
        ...prev,
        cola: value,
        agente: '' // Limpiar agente al cambiar cola
      }));
      setAgentesFiltrados([]);
      setMostrarSugerenciasAgente(false);
    } else if (name === 'agente') {
      // Manejar autocompletado de agente
      setFiltros(prev => ({
        ...prev,
        agente: value
      }));
      
      // Filtrar agentes mientras se escribe
      if (value.length > 0) {
        const filtrados = agentes.filter(a => 
          a.toLowerCase().includes(value.toLowerCase())
        );
        setAgentesFiltrados(filtrados);
        setMostrarSugerenciasAgente(true);
      } else {
        setAgentesFiltrados([]);
        setMostrarSugerenciasAgente(false);
      }
    } else {
      setFiltros(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Función para seleccionar un agente de las sugerencias
  const seleccionarAgente = (agente) => {
    setFiltros(prev => ({
      ...prev,
      agente: agente
    }));
    setMostrarSugerenciasAgente(false);
  };

  const obtenerLlamadaAleatoria = async () => {
    setLoading(true);
    setError('');
    setLlamada(null);
    setContadorInicial(null);
    setMonitoreoActivo(false);
    setTiempoFinal(null);

    try {
      const payload = {
        ...filtros,
        dniUsuario: usuario?.dni
      };
      
      const response = await fetch(`${API_URL}/api/llamada-aleatoria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener llamada');
      }

      const data = await response.json();
      
      // Verificar si hay error (no se encontraron resultados)
      if (data.error) {
        setError(data.error);
        return;
      }
      
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
          
          // Resetear estado inmediatamente para permitir nueva llamada
          setLlamada(null);
          setTiempoFinal(null);
          setMonitoreoActivo(false);
          setTiempoMonitoreo(0);
          setContadorInicial(null);
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
    const moduloInicial = usuarioData.rol === 'jefa' ? 'dashboard' : 'monitoreo';
    setModuloActivo(moduloInicial);
    // Guardar módulo inicial en sessionStorage
    sessionStorage.setItem('moduloActivo', moduloInicial);
  };

  const handleCambiarModulo = (modulo) => {
    setModuloActivo(modulo);
    // Guardar módulo activo en sessionStorage
    sessionStorage.setItem('moduloActivo', modulo);
  };

  const handleLogout = () => {
    // Limpiar sessionStorage y localStorage
    sessionStorage.clear();
    localStorage.clear();
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
      } else if (moduloActivo === 'reporte') {
        return <Reporte />;
      }
    }
    
    // Para monitores
    if (usuario.rol === 'monitor') {
      if (moduloActivo === 'monitoreo') {
        // Renderizar el módulo de monitoreo (el código actual)
  return (
          <div className="content-layout">
          <div className="filtros-container">
          <div className="filtros-header">
            <h2>Filtros de Búsqueda</h2>
            <div className="filtros-actions">
              <button 
                className={`btn-toggle-encuesta ${mostrarEncuesta ? 'activo' : ''}`}
                onClick={() => setMostrarEncuesta(!mostrarEncuesta)}
                title={mostrarEncuesta ? 'Ocultar encuesta' : 'Mostrar encuesta'}
              >
                <Icon icon="mdi:clipboard-text" />
                {mostrarEncuesta ? 'Ocultar Encuesta' : 'Mostrar Encuesta'}
              </button>
            </div>
          </div>
          
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
              {usuario?.campañasAsignadas && usuario.campañasAsignadas.length > 1 ? (
                <select 
                  name="campana"
                  value={filtros.campana}
                  onChange={handleInputChange}
                >
                  <option value="">{usuario.campañasAsignadas.join(' + ')}</option>
                  {usuario.campañasAsignadas.map(campana => (
                    <option key={campana} value={campana}>{campana}</option>
                  ))}
                </select>
              ) : usuario?.campañasAsignadas ? (
                <div style={{ 
                  padding: '8px 12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  backgroundColor: '#f9f9f9',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  {usuario.campañasAsignadas.join(', ')}
                </div>
              ) : (
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
              )}
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

            <div className="filtro-item" style={{ position: 'relative' }}>
              <label>Agente:</label>
              <input 
                type="text" 
                name="agente"
                value={filtros.agente}
                onChange={handleInputChange}
                onFocus={() => filtros.agente.length > 0 && setMostrarSugerenciasAgente(true)}
                onBlur={() => setTimeout(() => setMostrarSugerenciasAgente(false), 200)}
                placeholder="Buscar por nombre"
              />
              {mostrarSugerenciasAgente && agentesFiltrados.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  marginTop: '4px'
                }}>
                  {agentesFiltrados.map((agente, index) => (
                    <div
                      key={index}
                      onClick={() => seleccionarAgente(agente)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      {agente}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="filtro-item">
              <label>ID_Largo:</label>
              <input 
                type="text" 
                name="idLargo"
                value={filtros.idLargo}
                onChange={handleInputChange}
                placeholder="Buscar por ID_Largo"
              />
            </div>
          </div>

          {/* Botón solo visible cuando NO hay llamada activa */}
          {!llamada && (
            <button 
              className="btn-buscar"
              onClick={obtenerLlamadaAleatoria}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin" style={{marginRight: '8px'}} />
                  Buscando...
                </>
              ) : (
                <>
                  <Icon icon="mdi:dice-6" style={{marginRight: '8px'}} />
                  Obtener Llamada Aleatoria
                </>
              )}
            </button>
          )}

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
                    <Icon icon="mdi:check-circle" style={{marginRight: '4px'}} />Completado: <strong>{formatearTiempo(tiempoFinal)}</strong>
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

          {/* Encuesta de monitoreo */}
          {mostrarEncuesta && (
            <EncuestaMonitoreo
              llamada={llamada}
              usuario={usuario}
              onCerrar={() => setMostrarEncuesta(false)}
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
              <div className="empty-state-icon"><Icon icon="mdi:magnify" /></div>
              <p>Selecciona filtros y haz clic en "Obtener Llamada Aleatoria" para empezar</p>
            </div>
          )}

          {llamada && (
            <div className="llamada-detalle">
                <h2>
                  <Icon icon="mdi:phone" style={{marginRight: '8px'}} />
                  Detalle de la Llamada
                </h2>
              
                {/* Reproductor de audio */}
                <div className="audio-player-container">
                  <h3>
                    <Icon icon="mdi:play-circle" style={{marginRight: '8px'}} />
                    Audio de la Llamada
                  </h3>
                  {audioCargando ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px',
                      gap: '20px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #4caf50',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        Cargando audio...
                      </div>
                    </div>
                  ) : (
                    <audio 
                      controls 
                      preload="none" 
                      className="audio-player"
                      onError={(e) => {
                        console.error('Error al cargar audio:', e);
                        console.error('URL que falló:', e.target.src);
                      }}
                      onLoadStart={() => console.log('Iniciando carga del audio...')}
                      onLoadedData={() => console.log('Audio cargado correctamente')}
                      onCanPlay={() => console.log('Audio listo para reproducir')}
                    >
                      {llamada.Campaña_Agente === 'Unificado' ? (
                        <source src={`${API_URL}/audio/test-audio-33-converted.mp3`} type="audio/mpeg" />
                      ) : (
                        <>
                          <source src={`${API_URL}/audio/test-audio-1-converted.mp3`} type="audio/mpeg" />
                          <source src={`${API_URL}/audio/test-audio-2-converted.mp3`} type="audio/mpeg" />
                        </>
                      )}
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  )}
                </div>
              
                <div className="detalle-lineas">
                  <div className="detalle-seccion">
                    <h3>
                      <Icon icon="mdi:information" style={{marginRight: '8px'}} />
                      Información de la Llamada
                    </h3>
                    <div className="detalle-linea">
                      <Icon icon="mdi:identifier" className="icono" />
                      <span className="label">ID:</span>
                      <span className="valor">{llamada.ID_Largo || 'N/A'}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:phone" className="icono" />
                      <span className="label">Número:</span>
                      <span className="valor">{llamada.Numero}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:calendar" className="icono" />
                      <span className="label">Fecha:</span>
                      <span className="valor">
                        {llamada.Fecha.includes('T') 
                          ? llamada.Fecha.split('T')[0].split('-').reverse().join('/')
                          : new Date(llamada.Fecha).toLocaleDateString()
                        }
                      </span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:clock" className="icono" />
                      <span className="label">Hora:</span>
                      <span className="valor">
                        {llamada.Hora 
                          ? llamada.Hora.split('T')[1]?.substring(0, 8) || llamada.Hora
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:timer" className="icono" />
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
                    <h3>
                      <Icon icon="mdi:account" style={{marginRight: '8px'}} />
                      Agente
                    </h3>
                    <div className="detalle-linea">
                      <Icon icon="mdi:account-tie" className="icono" />
                      <span className="label">Nombre:</span>
                      <span className="valor">{llamada.NombreCompletoAgente} <span className="dni-parentesis">({llamada.DNIEmpleado})</span></span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:briefcase" className="icono" />
                      <span className="label">Cargo:</span>
                      <span className="valor">{llamada.Cargo}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:calendar-clock" className="icono" />
                      <span className="label">Antigüedad:</span>
                      <span className="valor">
                        {llamada.AntiguedadAnios ? `${llamada.AntiguedadAnios} año${llamada.AntiguedadAnios !== 1 ? 's' : ''}` : ''}
                        {llamada.AntiguedadMeses && llamada.AntiguedadAnios ? ` y ${llamada.AntiguedadMeses % 12} mes${(llamada.AntiguedadMeses % 12) !== 1 ? 'es' : ''}` : ''}
                        {llamada.AntiguedadMeses && !llamada.AntiguedadAnios ? `${llamada.AntiguedadMeses} mes${llamada.AntiguedadMeses !== 1 ? 'es' : ''}` : ''}
                        {!llamada.AntiguedadMeses && !llamada.AntiguedadAnios ? 'N/A' : ''}
                      </span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:check-circle" className="icono" />
                      <span className="label">Estado:</span>
                      <span className="valor badge-estado">{llamada.EstadoEmpleado}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:office-building" className="icono" />
                      <span className="label">Modalidad:</span>
                      <span className="valor">{llamada.Modalidad}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:clock" className="icono" />
                      <span className="label">Jornada:</span>
                      <span className="valor">{llamada.Jornada}</span>
                    </div>
                  </div>

                  <div className="detalle-seccion">
                    <h3><Icon icon="mdi:target" style={{marginRight: '8px'}} />Campaña y Gestión</h3>
                    <div className="detalle-linea">
                      <Icon icon="mdi:target" className="icono" />
                      <span className="label">Campaña:</span>
                      <span className="valor">{llamada.Campaña_Agente}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:phone" className="icono" />
                      <span className="label">Cola:</span>
                      <span className="valor">{llamada.Cola}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:tie" className="icono" />
                      <span className="label">Supervisor:</span>
                      <span className="valor">{llamada.NombreCompletoSupervisor}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:account" className="icono" />
                      <span className="label">Usuario Origen:</span>
                      <span className="valor">{llamada.Usuario_Llamada_Origen}</span>
                    </div>
                  </div>

                  <div className="detalle-seccion">
                    <h3><Icon icon="mdi:file-document-edit" style={{marginRight: '8px'}} />Tipificación</h3>
                    <div className="detalle-linea">
                      <Icon icon="mdi:clipboard-text" className="icono" />
                      <span className="label">Detalle:</span>
                      <span className="valor">{llamada.Tipificacion_Detalle}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:chart-bar" className="icono" />
                      <span className="label">Estado IPC:</span>
                      <span className="valor">{llamada.Tipificacion_Estado_IPC}</span>
                    </div>
                    <div className="detalle-linea">
                      <Icon icon="mdi:check" className="icono" />
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
              <div className="header-avatar">
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1>Monitor de Llamadas</h1>
                <p>Sistema de auditoría y monitoreo</p>
              </div>
            </div>
            <div className="header-right">
              <div className="header-search">
                <Icon icon="mdi:magnify" className="header-search-icon" />
                <input type="text" placeholder="Buscar..." />
              </div>
              <div className="header-actions">
                <button className="header-icon-btn" title="Notificaciones">
                  <Icon icon="mdi:bell" />
                  <span className="notification-badge"></span>
                </button>
                <button className="header-icon-btn" title="Configuración">
                  <Icon icon="mdi:cog" />
                </button>
              </div>
              <div className="user-info">
                <span className="user-name">{usuario.nombre}</span>
                <span className="user-rol">
                  {usuario.rol === 'jefa' ? (
                    <><Icon icon="mdi:crown" style={{marginRight: '4px'}} />Jefa</>
                  ) : (
                    <><Icon icon="mdi:account" style={{marginRight: '4px'}} />Monitor</>
                  )}
                </span>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <Icon icon="mdi:logout" />
                Cerrar Sesión
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
