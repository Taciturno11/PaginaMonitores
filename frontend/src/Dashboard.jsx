import { useState, useEffect } from 'react'
import './Dashboard.css'
import { Icon } from '@iconify/react'

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
        return <span className="badge badge-en-llamada"><Icon icon="mdi:circle" /> En Llamada</span>;
      case 'conectado':
        return <span className="badge badge-conectado"><Icon icon="mdi:circle" /> Conectado</span>;
      case 'desconectado':
        return <span className="badge badge-desconectado"><Icon icon="mdi:circle" /> Desconectado</span>;
      default:
        return <span className="badge badge-desconocido"><Icon icon="mdi:circle" /> Desconocido</span>;
    }
  };

  // Filtrar solo monitores (no mostrar a la jefa en la lista)
  const monitoresActivos = monitores.filter(m => m.rol === 'monitor');
  
  // Calcular estadísticas
  const totalMonitores = monitoresActivos.length;
  const enLlamada = monitoresActivos.filter(m => m.estado === 'en_llamada').length;
  const conectados = monitoresActivos.filter(m => m.estado === 'conectado').length;
  const desconectados = monitoresActivos.filter(m => m.estado === 'desconectado').length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>
          <Icon icon="mdi:view-dashboard" />
          Dashboard de Monitores
        </h2>
        <p className="dashboard-subtitle">
          Monitoreo en tiempo real del estado de los monitores
        </p>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-kpis">
        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <div className="kpi-title">Total Monitores</div>
              <div className="kpi-value">{totalMonitores}</div>
            </div>
            <div className="kpi-icon primary">
              <Icon icon="mdi:account-group" />
            </div>
          </div>
          <div className="kpi-change neutral">
            <Icon icon="mdi:information" />
            <span>Monitores activos en el sistema</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <div className="kpi-title">En Llamada</div>
              <div className="kpi-value">{enLlamada}</div>
            </div>
            <div className="kpi-icon success">
              <Icon icon="mdi:phone-in-talk" />
            </div>
          </div>
          <div className="kpi-change positive">
            <Icon icon="mdi:arrow-up" />
            <span>{totalMonitores > 0 ? Math.round((enLlamada / totalMonitores) * 100) : 0}% del total</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <div className="kpi-title">Conectados</div>
              <div className="kpi-value">{conectados}</div>
            </div>
            <div className="kpi-icon warning">
              <Icon icon="mdi:account-check" />
            </div>
          </div>
          <div className="kpi-change neutral">
            <Icon icon="mdi:minus" />
            <span>{totalMonitores > 0 ? Math.round((conectados / totalMonitores) * 100) : 0}% del total</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div>
              <div className="kpi-title">Desconectados</div>
              <div className="kpi-value">{desconectados}</div>
            </div>
            <div className="kpi-icon error">
              <Icon icon="mdi:account-off" />
            </div>
          </div>
          <div className="kpi-change negative">
            <Icon icon="mdi:arrow-down" />
            <span>{totalMonitores > 0 ? Math.round((desconectados / totalMonitores) * 100) : 0}% del total</span>
          </div>
        </div>
      </div>

      {/* Tabla de monitores */}
      <div className="dashboard-table-section">
        <div className="table-header">
          <h3>
            <Icon icon="mdi:table" />
            Detalle de Monitores
          </h3>
        </div>

        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Monitor</th>
                <th>DNI</th>
                <th>Estado</th>
                <th><Icon icon="mdi:calendar" style={{marginRight: '4px'}} />Fecha</th>
                <th><Icon icon="mdi:clock" style={{marginRight: '4px'}} />Hora</th>
                <th><Icon icon="mdi:timer" style={{marginRight: '4px'}} />Tiempo</th>
                <th>Llamada Actual</th>
              </tr>
            </thead>
            <tbody>
              {monitoresActivos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    <Icon icon="mdi:alert-circle-outline" style={{fontSize: '2rem', marginBottom: '0.5rem'}} />
                    <div>No hay monitores conectados</div>
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
                    <td className="tiempo-estado tiempo-activo">
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
          <p>
            <Icon icon="mdi:refresh" />
            Actualización en tiempo real cada segundo
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

