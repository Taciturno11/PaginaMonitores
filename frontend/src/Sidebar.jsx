import { useState } from 'react'
import './Sidebar.css'
import { Icon } from '@iconify/react'

function Sidebar({ rol, moduloActivo, onCambiarModulo, onLogout }) {
  const [colapsado, setColapsado] = useState(false);

  const toggleSidebar = () => {
    setColapsado(!colapsado);
  };

  // Módulos para monitores
  const modulosMonitor = [
    { id: 'monitoreo', nombre: 'Monitoreo', icono: 'mdi:phone' },
    { id: 'mi-historial', nombre: 'Mi Historial', icono: 'mdi:chart-line' }
  ];

  // Módulos para jefa
  const modulosJefa = [
    { id: 'dashboard', nombre: 'Dashboard', icono: 'mdi:view-dashboard' },
    { id: 'historial-general', nombre: 'Historial General', icono: 'mdi:chart-box' },
    { id: 'reporte', nombre: 'Reporte', icono: 'mdi:file-document-multiple' }
  ];

  const modulos = rol === 'jefa' ? modulosJefa : modulosMonitor;

  return (
    <div className={`sidebar ${colapsado ? 'sidebar-colapsado' : ''}`}>
      <div className="sidebar-header">
        {!colapsado && (
          <div className="sidebar-logo">
            <img src="/partnerlogo.svg" alt="Partner" />
            <span>Partner</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <Icon icon="mdi:menu" style={{ color: 'var(--primary-1)', fontSize: '24px' }} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {modulos.map(modulo => (
          <button
            key={modulo.id}
            className={`sidebar-item ${moduloActivo === modulo.id ? 'activo' : ''}`}
            onClick={() => onCambiarModulo(modulo.id)}
            title={modulo.nombre}
          >
            <Icon icon={modulo.icono} className="sidebar-icono" />
            {!colapsado && <span className="sidebar-texto">{modulo.nombre}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="sidebar-logout"
          onClick={onLogout}
          title="Cerrar Sesión"
        >
          <Icon icon="mdi:logout" className="sidebar-icono" />
          {!colapsado && <span className="sidebar-texto">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar

