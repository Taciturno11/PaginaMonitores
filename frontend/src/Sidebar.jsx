import { useState } from 'react'
import './Sidebar.css'
import { Icon } from '@iconify/react'

function Sidebar({ rol, moduloActivo, onCambiarModulo }) {
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
          <Icon icon={colapsado ? 'mdi:chevron-right' : 'mdi:chevron-left'} />
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
    </div>
  );
}

export default Sidebar

