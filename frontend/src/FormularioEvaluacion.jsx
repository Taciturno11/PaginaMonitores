import { useState } from 'react';
import './FormularioEvaluacion.css';

const FormularioEvaluacion = ({ llamada, tiempoMonitoreo, onGuardar, onCancelar }) => {
  const [tipoServicio, setTipoServicio] = useState('');
  const [fueVenta, setFueVenta] = useState('');
  const [causa, setCausa] = useState('');
  const [motivo, setMotivo] = useState('');

  // Datos para VENTAS
  const opcionesVentas = {
    'AGENTE': [
      'NO REBATE NEGATIVA',
      'NO REBATE EN CIERRE',
      'NO REBATE / ALTERNATIVA',
      'NO SONDEA',
      'NO CREA NECESIDAD',
      'NO HACE OFRECIMIENTO ESCALONADO',
      'NO TIENE PREDISPOSICIÓN'
    ],
    'CLIENTE': [
      'CONFORME CON SERVICIO',
      'NO DA MOTIVO',
      'PROBLEMAS ECONOMICOS',
      'TUVO MALA EXPERIENCIA',
      'YA CUENTA CON SERVICIO',
      'CORTA LLAMADA'
    ],
    'PROCESO': [
      'NO TIENE COBERTURA'
    ],
    'MALA TRANSFERENCIA': [
      'MALA TRANSFERENCIA'
    ]
  };

  const handleTipoServicioChange = (e) => {
    setTipoServicio(e.target.value);
    // Resetear todos los campos cuando cambia el tipo de servicio
    setFueVenta('');
    setCausa('');
    setMotivo('');
  };

  const handleCausaChange = (nuevaCausa) => {
    setCausa(nuevaCausa);
    setMotivo(''); // Limpiar motivo cuando cambie la causa
  };

  const handleGuardar = () => {
    // Validaciones según el tipo de servicio
    if (tipoServicio === 'VENTAS') {
      if (!fueVenta) {
        alert('Por favor selecciona si fue una venta');
        return;
      }
      // Si no fue venta, validar causa y motivo
      if (fueVenta === 'NO' && (!causa || !motivo)) {
        alert('Por favor completa todos los campos');
        return;
      }
    } else if (tipoServicio === 'ATC') {
      // Para ATC no se requieren campos adicionales
    } else {
      alert('Por favor selecciona un tipo de servicio');
      return;
    }

    const evaluacion = {
      tipoServicio,
      fueVenta,
      causa: fueVenta === 'NO' ? causa : '',
      motivo: fueVenta === 'NO' ? motivo : '',
      llamada,
      tiempoMonitoreo
    };

    onGuardar(evaluacion);
  };

  return (
    <div className="formulario-evaluacion">
        <div className="formulario-header">
          <h2>Evaluación de Monitoreo</h2>
        </div>

        <div className="formulario-content">

          {/* Tipo de servicio */}
          <div className="campo-formulario">
            <label>Tipo de Servicio:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="tipoServicio"
                  value="VENTAS"
                  checked={tipoServicio === 'VENTAS'}
                  onChange={handleTipoServicioChange}
                />
                <span className="radio-label">VENTAS</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="tipoServicio"
                  value="ATC"
                  checked={tipoServicio === 'ATC'}
                  onChange={handleTipoServicioChange}
                />
                <span className="radio-label">ATC</span>
              </label>
            </div>
          </div>

          {/* Evaluación para VENTAS */}
          {tipoServicio === 'VENTAS' && (
            <>
              {/* Pregunta si fue venta */}
              <div className="campo-formulario">
                <label>¿Fue una Venta?</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="fueVenta"
                      value="SI"
                      checked={fueVenta === 'SI'}
                      onChange={(e) => setFueVenta(e.target.value)}
                    />
                    <span className="radio-label">Sí</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="fueVenta"
                      value="NO"
                      checked={fueVenta === 'NO'}
                      onChange={(e) => setFueVenta(e.target.value)}
                    />
                    <span className="radio-label">No</span>
                  </label>
                </div>
              </div>

              {/* Campos de causa y motivo solo si NO fue venta */}
              {fueVenta === 'NO' && (
                <div className="evaluacion-grid">
              {/* Causa */}
              <div className="campo-formulario">
                <label>Causa:</label>
                <select
                  value={causa}
                  onChange={(e) => handleCausaChange(e.target.value)}
                  className="select-campo"
                >
                  <option value="">Selecciona una causa</option>
                  {Object.keys(opcionesVentas).map(causaKey => (
                    <option key={causaKey} value={causaKey}>
                      {causaKey}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motivo */}
              <div className="campo-formulario">
                <label>Motivo:</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="select-campo"
                  disabled={!causa}
                >
                  <option value="">Selecciona un motivo</option>
                  {causa && opcionesVentas[causa]?.map(motivoItem => (
                    <option key={motivoItem} value={motivoItem}>
                      {motivoItem}
                    </option>
                  ))}
                </select>
              </div>
                </div>
              )}
            </>
          )}

          {/* Evaluación para ATC */}
          {tipoServicio === 'ATC' && (
            <div className="atc-placeholder">
              <p>Formulario de ATC próximamente...</p>
            </div>
          )}
        </div>

        <div className="formulario-actions">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button 
            className="btn-guardar" 
            onClick={handleGuardar}
            disabled={!tipoServicio || !causa || !motivo}
          >
            Guardar Evaluación
          </button>
        </div>
    </div>
  );
};

export default FormularioEvaluacion;
