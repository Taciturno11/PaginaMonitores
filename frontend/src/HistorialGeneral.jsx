import { useState, useEffect } from 'react'
import './HistorialGeneral.css'

function HistorialGeneral() {
  // Obtener fechas por defecto
  const obtenerFechasPorDefecto = () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Formatear fechas a YYYY-MM-DD
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

  const [historial, setHistorial] = useState([]);
  const [historialFiltrado, setHistorialFiltrado] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const fechasDefecto = obtenerFechasPorDefecto();
  const [filtros, setFiltros] = useState({
    fechaInicio: fechasDefecto.fechaInicio,
    fechaFin: fechasDefecto.fechaFin,
    monitor: ''
  });

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

  // Cargar historial y filtros guardados al montar
  useEffect(() => {
    // Cargar filtros guardados, si no hay usar fechas por defecto
    const filtrosGuardados = sessionStorage.getItem('historialGeneralFiltros');
    if (filtrosGuardados) {
      try {
        const filtrosParsed = JSON.parse(filtrosGuardados);
        setFiltros(filtrosParsed);
      } catch (e) {
        console.error('Error al cargar filtros guardados:', e);
        // Si hay error, usar fechas por defecto
        const fechasDefecto = obtenerFechasPorDefecto();
        setFiltros({
          fechaInicio: fechasDefecto.fechaInicio,
          fechaFin: fechasDefecto.fechaFin,
          monitor: ''
        });
      }
    } else {
      // Si no hay filtros guardados, guardar los valores por defecto
      sessionStorage.setItem('historialGeneralFiltros', JSON.stringify(filtros));
    }
    
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historial, filtros]);

  const aplicarFiltros = () => {
    let resultado = [...historial];

    // Filtrar por fecha inicio
    if (filtros.fechaInicio) {
      resultado = resultado.filter(item => {
        // Extraer solo la fecha sin hora para comparar
        const fechaItem = item.FechaHoraInicio.includes('T') 
          ? item.FechaHoraInicio.split('T')[0] 
          : new Date(item.FechaHoraInicio).toISOString().split('T')[0];
        
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
        
        return fechaItem <= filtros.fechaFin;
      });
    }

    // Filtrar por monitor
    if (filtros.monitor) {
      resultado = resultado.filter(item => 
        item.NombreMonitor.toLowerCase().includes(filtros.monitor.toLowerCase()) ||
        item.DNIMonitor.includes(filtros.monitor)
      );
    }

    setHistorialFiltrado(resultado);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nuevosFiltros = {
      ...filtros,
      [name]: value
    };
    setFiltros(nuevosFiltros);
    // Guardar filtros en sessionStorage
    sessionStorage.setItem('historialGeneralFiltros', JSON.stringify(nuevosFiltros));
  };

  const limpiarFiltros = () => {
    const fechasDefecto = obtenerFechasPorDefecto();
    const filtrosLimpios = {
      fechaInicio: fechasDefecto.fechaInicio,
      fechaFin: fechasDefecto.fechaFin,
      monitor: ''
    };
    setFiltros(filtrosLimpios);
    // Guardar filtros por defecto
    sessionStorage.setItem('historialGeneralFiltros', JSON.stringify(filtrosLimpios));
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
      <div className="historial-header">
        <h2>📋 Historial de Auditorías</h2>
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
            <input
              type="text"
              name="monitor"
              placeholder="Buscar monitor..."
              value={filtros.monitor}
              onChange={handleInputChange}
              className="filtro-busqueda-inline"
            />
            <button className="btn-limpiar-inline" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
      </div>

      {/* Tabla de historial */}
      <div className="historial-table-wrapper">
        {historialFiltrado.length === 0 ? (
          <div className="no-historial">
            <p>{historial.length === 0 ? 'No hay monitoreos registrados aún' : 'No se encontraron resultados con los filtros aplicados'}</p>
            {historial.length > 0 && (
              <p className="hint">Ajusta los filtros para ver más resultados</p>
            )}
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
          {!filtros.monitor && (
            <span>Tiempo total acumulado: <strong>{formatearTiempo(estadisticas.tiempoTotalSegundos)}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}

export default HistorialGeneral

