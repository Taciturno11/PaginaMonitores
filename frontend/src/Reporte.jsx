import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import './HistorialGeneral.css'
import './Reporte.css'

function Reporte() {
  const API_URL = import.meta.env.VITE_API_URL
  
  const [dni, setDni] = useState('')
  const [tipo, setTipo] = useState('dia') // 'dia' | 'rango'
  const [fecha, setFecha] = useState('')
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reporte, setReporte] = useState(null)

  // Cargar último reporte desde localStorage al montar el componente
  useEffect(() => {
    const ultimoReporte = localStorage.getItem('ultimoReporte')
    if (ultimoReporte) {
      try {
        const datos = JSON.parse(ultimoReporte)
        setReporte(datos.reporte)
        setDni(datos.dni)
        setTipo(datos.tipo)
        setFecha(datos.fecha || '')
        setInicio(datos.inicio || '')
        setFin(datos.fin || '')
      } catch (e) {
        console.error('Error al cargar último reporte:', e)
      }
    }
  }, [])

  // WebSocket para actualización en tiempo real
  useEffect(() => {
    const socket = io(API_URL)
    
    // Unirse a la sala de jefa para recibir actualizaciones
    socket.emit('usuario_conectado', { dni: 'jefa', nombre: 'Jefa', rol: 'jefa' })
    
    socket.on('estado_monitores', (data) => {
      console.log('📡 Datos recibidos del WebSocket:', data)
      
      // Actualizar KPIs en tiempo real si tenemos un reporte activo
      if (reporte && dni) {
        const monitorActual = data.find(m => m.dni === dni)
        if (monitorActual) {
          console.log('🎯 Monitor encontrado para actualización:', monitorActual)
          
          // Actualizar solo los datos de estado en tiempo real
          setReporte(prevReporte => ({
            ...prevReporte,
            resumen: {
              ...prevReporte.resumen,
              // Mantener llamadas totales del historial, pero actualizar tiempos de estado
              tiempoEnLlamadaSegundos: monitorActual.tiempoEnLlamada || 0,
              tiempoConectadoSegundos: monitorActual.tiempoInactivo || 0,
              tiempoDesconectadoSegundos: monitorActual.tiempoDesconectado || 0
            },
            // Actualizar estado actual
            estadoActual: monitorActual.estado,
            fechaEstado: monitorActual.fechaEstado,
            horaEstado: monitorActual.horaEstado,
            tiempoEnEstado: monitorActual.tiempoEnEstado
          }))
        }
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [reporte, dni, API_URL])

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    if (horas > 0) return `${horas}h ${minutos}m ${segs}s`
    return `${minutos}m ${segs}s`
  }

  const formatearFechaHora = (fh) => {
    try {
      if (typeof fh === 'string' && fh.includes('T')) {
        const [f, h] = fh.split('T')
        return `${f.split('-').reverse().join('/')} ${h.substring(0,8)}`
      }
      const d = new Date(fh)
      return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return String(fh)
    }
  }

  const consultar = async () => {
    setLoading(true)
    setError('')
    setReporte(null)
    try {
      let url = ''
      if (!dni) throw new Error('Ingresa DNI')
      if (tipo === 'dia') {
        if (!fecha) throw new Error('Selecciona fecha')
        url = `${API_URL}/api/reporte/monitor-dia?dni=${encodeURIComponent(dni)}&fecha=${encodeURIComponent(fecha)}`
      } else {
        if (!inicio || !fin) throw new Error('Selecciona inicio y fin')
        url = `${API_URL}/api/reporte/monitor-rango?dni=${encodeURIComponent(dni)}&inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en reporte')
      setReporte(data)
      
      // Guardar en localStorage para persistir al refrescar
      const datosPersistir = {
        reporte: data,
        dni,
        tipo,
        fecha,
        inicio,
        fin
      }
      localStorage.setItem('ultimoReporte', JSON.stringify(datosPersistir))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="historial-general-container">
      <div className="historial-header">
        <h2>🧾 Reporte de Monitoreo</h2>
        <div className="filtros-inline" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="DNI monitor"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="filtro-busqueda-inline"
            style={{ width: 160 }}
          />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="filtro-fecha">
            <option value="dia">Por día</option>
            <option value="rango">Por rango</option>
          </select>
          {tipo === 'dia' ? (
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="filtro-fecha" />
          ) : (
            <>
              <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="filtro-fecha" />
              <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="filtro-fecha" />
            </>
          )}
          <button className="btn-limpiar-inline" onClick={consultar} disabled={loading}>
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="no-historial"><p>⚠️ {error}</p></div>
      )}

      {reporte && (
        <>
          <div className="reporte-orbit">
            <div className="kpi-orbit">
              {/* KPI Left (180°) */}
              <div className="kpi kpi-node kpi-left">
                <div className="kpi-icon">🟢</div>
                <div className="kpi-content">
                  <div className="kpi-label">En llamada</div>
                  <div className="kpi-value">{formatearTiempo(reporte.resumen.tiempoEnLlamadaSegundos)}</div>
                </div>
              </div>
              {/* KPI Right (0°) */}
              <div className="kpi kpi-node kpi-right">
                <div className="kpi-icon">🟡</div>
                <div className="kpi-content">
                  <div className="kpi-label">Conectado</div>
                  <div className="kpi-value">{formatearTiempo(reporte.resumen.tiempoConectadoSegundos)}</div>
                </div>
              </div>
              {/* KPI Bottom-Left */}
              <div className="kpi kpi-node kpi-bottom-left">
                <div className="kpi-icon">🔴</div>
                <div className="kpi-content">
                  <div className="kpi-label">Desconectado</div>
                  <div className="kpi-value">{formatearTiempo(reporte.resumen.tiempoDesconectadoSegundos)}</div>
                </div>
              </div>
              {/* KPI Bottom-Right */}
              <div className="kpi kpi-node kpi-bottom-right">
                <div className="kpi-icon kpi-primary">📞</div>
                <div className="kpi-content">
                  <div className="kpi-label">Llamadas</div>
                  <div className="kpi-value">{reporte.resumen.totalLlamadas}</div>
                </div>
              </div>

              <div className="reporte-hero-center">
                {reporte.nombre && (
                  <div className="nombre-monitor">
                    {reporte.nombre}
                    <span className="live-indicator">● LIVE</span>
                  </div>
                )}
                <div className="avatar-circle">👩‍💻</div>
              </div>
            </div>
          </div>

          {reporte.llamadas && (
            <div className="historial-table-wrapper" style={{ marginTop: 16 }}>
              {reporte.llamadas.length === 0 ? (
                <div className="no-historial"><p>No hay llamadas en el periodo</p></div>
              ) : (
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>ID Llamada</th>
                      <th>Número</th>
                      <th>Agente</th>
                      <th>Campaña</th>
                      <th>Cola</th>
                      <th>⏱️ Tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.llamadas.map((l) => (
                      <tr key={l.ID}>
                        <td>{formatearFechaHora(l.FechaHoraInicio)}</td>
                        <td className="id-llamada">{l.ID_Llamada_Largo || 'N/A'}</td>
                        <td>{l.NumeroLlamada || 'N/A'}</td>
                        <td>{l.AgenteAuditado || 'N/A'}</td>
                        <td>{l.CampañaAuditada || 'N/A'}</td>
                        <td>{l.ColaAuditada || 'N/A'}</td>
                        <td className="tiempo-monitoreo">{formatearTiempo(l.TiempoMonitoreoSegundos || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Reporte


