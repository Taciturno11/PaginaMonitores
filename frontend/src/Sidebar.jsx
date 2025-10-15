import { useState } from 'react'
import './Sidebar.css'

function Sidebar({ rol, moduloActivo, onCambiarModulo }) {
  const [colapsado, setColapsado] = useState(false);

  const toggleSidebar = () => {
    setColapsado(!colapsado);
  };

  // Módulos para monitores
  const modulosMonitor = [
    { id: 'monitoreo', nombre: 'Monitoreo', icono: '📞' },
    { id: 'mi-historial', nombre: 'Mi Historial', icono: '📊' }
  ];

  // Módulos para jefa
  const modulosJefa = [
    { id: 'dashboard', nombre: 'Dashboard', icono: '📊' },
    { id: 'historial-general', nombre: 'Historial General', icono: '📈' }
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
          {colapsado ? '▶' : '◀'}
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
            <span className="sidebar-icono">{modulo.icono}</span>
            {!colapsado && <span className="sidebar-texto">{modulo.nombre}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar

