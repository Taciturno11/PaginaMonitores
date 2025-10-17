import { useState, useEffect } from 'react'
import './Dashboard.css'

function Dashboard({ socket }) {
  const [monitores, setMonitores] = useState([]);

  // Cargar último estado del dashboard desde sessionStorage
  useEffect(() => {
    const dashboardGuardado = sessionStorage.getItem('dashboardActual');
    if (dashboardGuardado) {
      try {
        const datos = JSON.parse(dashboardGuardado);
        if (datos.monitores && Array.isArray(datos.monitores)) {
          setMonitores(datos.monitores);
        }
      } catch (e) {
        console.error('Error al cargar dashboard guardado:', e);
        sessionStorage.removeItem('dashboardActual');
      }
    }
  }, []);

  useEffect(() => {
    if (socket) {
      // Escuchar actualizaciones de estado de monitores
      socket.on('estado_monitores', (data) => {
        setMonitores(data);
        // Guardar en sessionStorage cada vez que se actualiza
        sessionStorage.setItem('dashboardActual', JSON.stringify({ monitores: data }));
      });

      return () => {
        socket.off('estado_monitores');
      };
    }
  }, [socket]);

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'en_llamada':
        return <span className="badge badge-en-llamada">🟢 Llamada</span>;
      case 'conectado':
        return <span className="badge badge-conectado">🟡 Conect.</span>;
      case 'desconectado':
        return <span className="badge badge-desconectado">🔴 Descon.</span>;
      default:
        return <span className="badge badge-desconocido">⚪ Desconocido</span>;
    }
  };

  // Filtrar solo monitores (no mostrar a la jefa en la lista)
  const monitoresActivos = monitores.filter(m => m.rol === 'monitor');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>📊 Dashboard de Monitores</h2>
        <div className="dashboard-stats">
          <div className="stat-item">
            <span className="stat-label">Total Monitores:</span>
            <span className="stat-value">{monitoresActivos.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">En Llamada:</span>
            <span className="stat-value stat-green">
              {monitoresActivos.filter(m => m.estado === 'en_llamada').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Conectados:</span>
            <span className="stat-value stat-yellow">
              {monitoresActivos.filter(m => m.estado === 'conectado').length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Desconectados:</span>
            <span className="stat-value stat-red">
              {monitoresActivos.filter(m => m.estado === 'desconectado').length}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Monitor</th>
              <th>DNI</th>
              <th>Estado</th>
              <th>📅 Fecha</th>
              <th>🕒 Hora</th>
              <th>⏱️ Tiempo</th>
              <th>Llamada Actual</th>
            </tr>
          </thead>
          <tbody>
            {monitoresActivos.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No hay monitores conectados
                </td>
              </tr>
            ) : (
              monitoresActivos.map(monitor => (
                <tr key={monitor.dni} className={`row-${monitor.estado}`}>
                  <td className="monitor-nombre">{monitor.nombre}</td>
                  <td>{monitor.dni}</td>
                  <td>{getEstadoBadge(monitor.estado)}</td>
                  <td>{monitor.fechaEstado || '-'}</td>
                  <td>{monitor.horaEstado || '-'}</td>
                  <td className={`tiempo-estado tiempo-activo`}>
                    {formatearTiempo(monitor.tiempoEnEstado || 0)}
                  </td>
                  <td className="llamada-actual">
                    {monitor.llamadaActual || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="dashboard-footer">
        <p>🔄 Actualización en tiempo real cada segundo</p>
      </div>
    </div>
  )
}

export default Dashboard

