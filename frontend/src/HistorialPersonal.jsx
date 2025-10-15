import { useState, useEffect } from 'react'
import './HistorialPersonal.css'

function HistorialPersonal({ usuario }) {
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/mi-historial?dni=${usuario.dni}`);
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

  if (loading) {
    return (
      <div className="historial-loading">
        <div className="loading-spinner">🔄</div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="historial-container">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <span className="stat-label">Total Monitoreos</span>
              <span className="stat-value">{estadisticas.total}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <span className="stat-label">Hoy</span>
              <span className="stat-value">{estadisticas.hoy}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <span className="stat-label">Tiempo Total</span>
              <span className="stat-value">{formatearTiempo(estadisticas.tiempoTotalSegundos)}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⌛</div>
            <div className="stat-info">
              <span className="stat-label">Tiempo Promedio</span>
              <span className="stat-value">{formatearTiempo(estadisticas.tiempoPromedioSegundos)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de historial */}
      <div className="historial-table-container">
        <h2>📋 Mis Auditorías</h2>
        
        {historial.length === 0 ? (
          <div className="no-historial">
            <p>No tienes monitoreos registrados aún</p>
            <p className="hint">Comienza auditando llamadas en el módulo de Monitoreo</p>
          </div>
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
                <th>⏱️ Tiempo Monitoreo</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => (
                <tr key={item.ID}>
                  <td>{formatearFechaHora(item.FechaHoraInicio)}</td>
                  <td className="id-llamada">{item.ID_Llamada_Largo}</td>
                  <td>{item.NumeroLlamada}</td>
                  <td>{item.AgenteAuditado}</td>
                  <td>{item.CampañaAuditada}</td>
                  <td>{item.ColaAuditada}</td>
                  <td className="tiempo-monitoreo">
                    {formatearTiempo(item.TiempoMonitoreoSegundos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default HistorialPersonal

