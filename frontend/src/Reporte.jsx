import { useState, useEffect } from 'react'
import './HistorialGeneral.css'
import './Reporte.css'
import { Icon } from '@iconify/react'

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

  // Cargar último reporte desde sessionStorage al montar el componente
  useEffect(() => {
    const datosReporte = sessionStorage.getItem('reporteActual')
    if (datosReporte) {
      try {
        const datos = JSON.parse(datosReporte)
        if (datos.dni) setDni(datos.dni)
        if (datos.tipo) setTipo(datos.tipo)
        if (datos.fecha) setFecha(datos.fecha)
        if (datos.inicio) setInicio(datos.inicio)
        if (datos.fin) setFin(datos.fin)
        if (datos.reporte) setReporte(datos.reporte)
      } catch (e) {
        console.error('Error al cargar reporte guardado:', e)
        sessionStorage.removeItem('reporteActual')
      }
    }
  }, [])

  // Guardar cambios en los filtros
  useEffect(() => {
    if (dni || tipo || fecha || inicio || fin) {
      const datosActuales = {
        dni,
        tipo,
        fecha,
        inicio,
        fin,
        reporte
      }
      sessionStorage.setItem('reporteActual', JSON.stringify(datosActuales))
    }
  }, [dni, tipo, fecha, inicio, fin, reporte])

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
      
      // Guardar en sessionStorage para persistir al cambiar de módulo
      const datosPersistir = {
        reporte: data,
        dni,
        tipo,
        fecha,
        inicio,
        fin
      }
      sessionStorage.setItem('reporteActual', JSON.stringify(datosPersistir))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="historial-general-container">
      <div className="historial-header">
        <h2><Icon icon="mdi:file-document-multiple" style={{marginRight: '8px'}} />Reporte de Monitoreo</h2>
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
                <div className="kpi-icon"><Icon icon="mdi:circle" style={{color: '#22c55e'}} /></div>
                <div className="kpi-content">
                  <div className="kpi-label">En llamada</div>
                  <div className="kpi-value">{formatearTiempo(reporte.resumen.tiempoEnLlamadaSegundos)}</div>
                </div>
              </div>
              {/* KPI Right (0°) */}
              <div className="kpi kpi-node kpi-right">
                <div className="kpi-icon"><Icon icon="mdi:circle" style={{color: '#eab308'}} /></div>
                <div className="kpi-content">
                  <div className="kpi-label">Conectado</div>
                  <div className="kpi-value">{formatearTiempo(reporte.resumen.tiempoConectadoSegundos)}</div>
                </div>
              </div>
              {/* KPI Bottom-Left */}
              <div className="kpi kpi-node kpi-bottom-left">
                <div className="kpi-icon"><Icon icon="mdi:circle" style={{color: '#ef4444'}} /></div>
                <div className="kpi-content">
                  <div className="kpi-label">Desconectado</div>
                  <div className="kpi-value">{formatearTiempo(reporte.resumen.tiempoDesconectadoSegundos)}</div>
                </div>
              </div>
              {/* KPI Bottom-Right */}
              <div className="kpi kpi-node kpi-bottom-right">
                <div className="kpi-icon kpi-primary"><Icon icon="mdi:phone" /></div>
                <div className="kpi-content">
                  <div className="kpi-label">Llamadas</div>
                  <div className="kpi-value">{reporte.resumen.totalLlamadas}</div>
                </div>
              </div>

              <div className="reporte-hero-center">
                {reporte.nombre && (
                  <div className="nombre-monitor">
                    {reporte.nombre}
                  </div>
                )}
                <div className="avatar-circle">👩‍💻</div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="graficos-container">
            <h3><Icon icon="mdi:chart-bar" style={{marginRight: '8px'}} />Análisis Visual</h3>
            
            <div className="graficos-grid">
              {/* Gráfico de Tiempos */}
              <div className="grafico-card">
                <h4><Icon icon="mdi:timer" style={{marginRight: '4px'}} />Distribución de Tiempo</h4>
                <div className="chart-bars">
                  <div className="bar-item">
                    <div className="bar-label">En Llamada</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar bar-green" 
                        style={{ 
                          width: `${(reporte.resumen.tiempoEnLlamadaSegundos / (reporte.resumen.tiempoEnLlamadaSegundos + reporte.resumen.tiempoConectadoSegundos + reporte.resumen.tiempoDesconectadoSegundos)) * 100}%` 
                        }}
                      >
                        <span className="bar-value">{formatearTiempo(reporte.resumen.tiempoEnLlamadaSegundos)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bar-item">
                    <div className="bar-label">Conectado</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar bar-yellow" 
                        style={{ 
                          width: `${(reporte.resumen.tiempoConectadoSegundos / (reporte.resumen.tiempoEnLlamadaSegundos + reporte.resumen.tiempoConectadoSegundos + reporte.resumen.tiempoDesconectadoSegundos)) * 100}%` 
                        }}
                      >
                        <span className="bar-value">{formatearTiempo(reporte.resumen.tiempoConectadoSegundos)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bar-item">
                    <div className="bar-label">Desconectado</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar bar-red" 
                        style={{ 
                          width: `${(reporte.resumen.tiempoDesconectadoSegundos / (reporte.resumen.tiempoEnLlamadaSegundos + reporte.resumen.tiempoConectadoSegundos + reporte.resumen.tiempoDesconectadoSegundos)) * 100}%` 
                        }}
                      >
                        <span className="bar-value">{formatearTiempo(reporte.resumen.tiempoDesconectadoSegundos)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicadores de Productividad */}
              <div className="grafico-card">
                <h4><Icon icon="mdi:chart-line" style={{marginRight: '4px'}} />Indicadores</h4>
                <div className="indicadores-grid">
                  <div className="indicador-item">
                    <div className="indicador-icon"><Icon icon="mdi:phone" /></div>
                    <div className="indicador-info">
                      <div className="indicador-label">Total Llamadas</div>
                      <div className="indicador-value">{reporte.resumen.totalLlamadas}</div>
                    </div>
                  </div>
                  
                  <div className="indicador-item">
                    <div className="indicador-icon"><Icon icon="mdi:timer" /></div>
                    <div className="indicador-info">
                      <div className="indicador-label">Tiempo Promedio</div>
                      <div className="indicador-value">
                        {reporte.resumen.totalLlamadas > 0 
                          ? formatearTiempo(Math.floor(reporte.resumen.tiempoMonitoreoSegundos / reporte.resumen.totalLlamadas))
                          : '0m 0s'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="indicador-item">
                    <div className="indicador-icon"><Icon icon="mdi:target" /></div>
                    <div className="indicador-info">
                      <div className="indicador-label">Productividad</div>
                      <div className="indicador-value">
                        {((reporte.resumen.tiempoEnLlamadaSegundos / (reporte.resumen.tiempoEnLlamadaSegundos + reporte.resumen.tiempoConectadoSegundos + reporte.resumen.tiempoDesconectadoSegundos)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="indicador-item">
                    <div className="indicador-icon"><Icon icon="mdi:lightning-bolt" /></div>
                    <div className="indicador-info">
                      <div className="indicador-label">Total Monitoreo</div>
                      <div className="indicador-value">{formatearTiempo(reporte.resumen.tiempoMonitoreoSegundos)}</div>
                    </div>
                  </div>
                </div>
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
                      <th><Icon icon="mdi:timer" style={{marginRight: '4px'}} />Tiempo</th>
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


