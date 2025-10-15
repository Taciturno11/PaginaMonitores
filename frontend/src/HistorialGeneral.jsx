import { useState, useEffect } from 'react'
import './HistorialGeneral.css'

function HistorialGeneral() {
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroMonitor, setFiltroMonitor] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/historial-general`);
      const data = await response.json();
      
      if (response.ok) {
        setHistorial(data.monitoreos);
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    }
    return `${minutos}m ${segs}s`;
  };

  const formatearFechaHora = (fechaHora) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar historial por monitor
  const historialFiltrado = filtroMonitor
    ? historial.filter(h => h.NombreMonitor.toLowerCase().includes(filtroMonitor.toLowerCase()) || h.DNIMonitor.includes(filtroMonitor))
    : historial;

  if (loading) {
    return (
      <div className="historial-loading">
        <div className="loading-spinner">🔄</div>
        <p>Cargando historial general...</p>
      </div>
    );
  }

  return (
    <div className="historial-general-container">
      {/* Ranking de monitores */}
      {estadisticas && estadisticas.ranking && (
        <div className="ranking-container">
          <h2>🏆 Ranking de Monitores</h2>
          <div className="ranking-cards">
            {estadisticas.ranking.slice(0, 5).map((monitor) => (
              <div key={monitor.dni} className={`ranking-card ranking-${monitor.posicion}`}>
                <div className="ranking-posicion">#{monitor.posicion}</div>
                <div className="ranking-info">
                  <div className="ranking-nombre">{monitor.nombre}</div>
                  <div className="ranking-stats">
                    <span>📞 {monitor.total} llamadas</span>
                    <span>⏱️ {formatearTiempo(monitor.tiempoPromedio)} promedio</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-historial">
        <h2>📋 Historial de Auditorías</h2>
        <div className="filtro-busqueda">
          <input
            type="text"
            placeholder="Buscar por monitor (nombre o DNI)..."
            value={filtroMonitor}
            onChange={(e) => setFiltroMonitor(e.target.value)}
          />
          {filtroMonitor && (
            <button className="btn-limpiar" onClick={() => setFiltroMonitor('')}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de historial */}
      <div className="historial-table-wrapper">
        {historialFiltrado.length === 0 ? (
          <div className="no-historial">
            <p>{filtroMonitor ? 'No se encontraron resultados' : 'No hay monitoreos registrados aún'}</p>
          </div>
        ) : (
          <table className="historial-table">
            <thead>
              <tr>
                <th>Monitor</th>
                <th>Fecha/Hora</th>
                <th>ID Llamada</th>
                <th>Agente</th>
                <th>Campaña</th>
                <th>Cola</th>
                <th>⏱️ Tiempo</th>
              </tr>
            </thead>
            <tbody>
              {historialFiltrado.map((item) => (
                <tr key={item.ID}>
                  <td className="monitor-nombre">{item.NombreMonitor}</td>
                  <td>{formatearFechaHora(item.FechaHoraInicio)}</td>
                  <td className="id-llamada">{item.ID_Llamada_Largo || 'N/A'}</td>
                  <td>{item.AgenteAuditado || 'N/A'}</td>
                  <td>{item.CampañaAuditada || 'N/A'}</td>
                  <td>{item.ColaAuditada || 'N/A'}</td>
                  <td className="tiempo-monitoreo">
                    {formatearTiempo(item.TiempoMonitoreoSegundos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totales */}
      {estadisticas && historialFiltrado.length > 0 && (
        <div className="totales-footer">
          <span>Total de registros: <strong>{historialFiltrado.length}</strong></span>
          {!filtroMonitor && (
            <span>Tiempo total acumulado: <strong>{formatearTiempo(estadisticas.tiempoTotalSegundos)}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}

export default HistorialGeneral

