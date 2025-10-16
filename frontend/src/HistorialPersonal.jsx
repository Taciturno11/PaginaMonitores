import { useState, useEffect } from 'react'
import './HistorialPersonal.css'

function HistorialPersonal({ usuario }) {
  const [historial, setHistorial] = useState([]);
  const [historialFiltrado, setHistorialFiltrado] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: ''
  });

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historial, filtros]);

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

  const aplicarFiltros = () => {
    let resultado = [...historial];

    // Filtrar por fecha inicio
    if (filtros.fechaInicio) {
      resultado = resultado.filter(item => {
        // Extraer solo la fecha sin hora para comparar
        const fechaItem = item.FechaHoraInicio.includes('T') 
          ? item.FechaHoraInicio.split('T')[0] 
          : new Date(item.FechaHoraInicio).toISOString().split('T')[0];
        
        // Debug: mostrar comparación
        console.log(`Comparando: ${fechaItem} >= ${filtros.fechaInicio} = ${fechaItem >= filtros.fechaInicio}`);
        
        return fechaItem >= filtros.fechaInicio;
      });
    }

    // Filtrar por fecha fin
    if (filtros.fechaFin) {
      resultado = resultado.filter(item => {
        // Extraer solo la fecha sin hora para comparar
        const fechaItem = item.FechaHoraInicio.includes('T') 
          ? item.FechaHoraInicio.split('T')[0] 
          : new Date(item.FechaHoraInicio).toISOString().split('T')[0];
        
        // Debug: mostrar comparación
        console.log(`Comparando: ${fechaItem} <= ${filtros.fechaFin} = ${fechaItem <= filtros.fechaFin}`);
        
        return fechaItem <= filtros.fechaFin;
      });
    }

    console.log(`Resultado final: ${resultado.length} registros`);
    setHistorialFiltrado(resultado);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: ''
    });
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
    // Si es un string de fecha ISO, extraer solo la parte de fecha y hora sin zona horaria
    if (typeof fechaHora === 'string' && fechaHora.includes('T')) {
      const [fechaPart, horaPart] = fechaHora.split('T');
      const hora = horaPart.split('.')[0]; // Quitar milisegundos si existen
      return `${fechaPart.split('-').reverse().join('/')} ${hora}`;
    }
    
    // Si es un objeto Date o string normal
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
        <div className="historial-header">
          <h2>📋 Mis Auditorías</h2>
          <div className="filtros-inline">
            <input 
              type="date" 
              name="fechaInicio"
              value={filtros.fechaInicio}
              onChange={handleInputChange}
              className="filtro-fecha"
            />
            <input 
              type="date" 
              name="fechaFin"
              value={filtros.fechaFin}
              onChange={handleInputChange}
              className="filtro-fecha"
            />
            <button className="btn-limpiar-inline" onClick={limpiarFiltros}>Limpiar</button>
          </div>
        </div>
        
        {historialFiltrado.length === 0 ? (
          <div className="no-historial">
            <p>{historial.length === 0 ? 'No tienes monitoreos registrados aún' : 'No se encontraron resultados con los filtros aplicados'}</p>
            {historial.length > 0 && (
              <p className="hint">Ajusta los filtros de fecha para ver más resultados</p>
            )}
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
              {historialFiltrado.map((item) => (
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

