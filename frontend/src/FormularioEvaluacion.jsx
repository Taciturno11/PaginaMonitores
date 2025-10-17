import { useState } from 'react';
import './FormularioEvaluacion.css';

const FormularioEvaluacion = ({ llamada, tiempoMonitoreo, onGuardar, onCancelar }) => {
  const [tipoServicio, setTipoServicio] = useState('');
  const [fueVenta, setFueVenta] = useState('');
  const [causa, setCausa] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fueSatisfactoriaATC, setFueSatisfactoriaATC] = useState('');

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

  // Datos para ATC (según tu especificación). Ajustable si necesitas afinar mapeos
  const opcionesATC = {
    'PROCESO': [
      'PLAZOS DE ATENCIÓN',
      'INCUMPLIMIENTO DE PLAZOS',
      'CONDICIONES CONTRACTUALES',
      'DIFICULTAD CON LOS SISTEMAS DE APOYO',
      'CONFIGURACIONES ESPECIALES',
      'RESPUESTA DE RECLAMO',
      'TRANSFERENCIAS O DERIVACIONES',
      'NO CUMPLE CON REQUISITOS',
      'PROMOCIONES',
      'LINEA CON CEDULA',
      'AFECTACIÓN MASIVA'
    ],
    'EJECUTIVO': [
      'DEJA AL CLIENTE EN ESPERA O TIEMPO PROLONGADO',
      'ERROR EN LA INFORMACIÓN BRINDADA',
      'ACTITUD',
      'NO OFRECE ALTERNATIVAS DE SOLUCIÓN',
      'NO RESUELVE LA SOLICITUD',
      'REALIZA INNECESARIAMENTE UNA DERIVACIÓN A OTRO GRUPO O CANAL',
      'CORTE DE LLAMADA',
      'NO IDENTIFICA LA NECESIDAD DEL USUARIO',
      'INSEGURIDAD',
      'CLARIDAD PARA HACERSE ENTENDER',
      'ABANDONO DE LLAMADA'
    ],
    'NOVEDADES': [
      'MASIVO DE NAVEGACIÓN',
      'MASIVO DE VOZ',
      'APLICACIONES DEL CLIENTE',
      'PLATAFORMA INTERNA',
      'PLATAFORMA DE ACTIVACION DE SERVICIOS',
      'ATÍPICO'
    ],
    'PRODUCTO': [
      'CARACTERÍSTICAS',
      'TARIFAS',
      'EQUIPOS',
      'COBERTURA',
      'OTROS'
    ],
    'GESTION_ANTERIOR': [
      'VENTAS',
      'SOPORTE TÉCNICO',
      'TIENDAS/CAC',
      'TRÁMITES ADMINISTRATIVOS',
      'LLAMADA ANTERIOR'
    ],
    'GESTION_POSTERIOR': [
      'LLAMAR A OTRO CC',
      'BUENA GESTIÓN',
      'LLAMADA MUDA',
      'CLIENTE APURADO',
      'OTROS',
      'LLAMADA MOLESTOSA'
    ],
    'CLIENTE': [
      'CLIENTE CORTA',
      'INTERFERENCIA',
      'LLAMADA ANTERIOR',
      'CLIENTE APURADO',
      'LLAMADA MOLESTOSA',
      'CLIENTE CRÍTICO'
    ],
    'OTROS': [
      'NO HAY GRABACION',
      'ATÍPICO',
      'OTROS'
    ]
  };

  const handleTipoServicioChange = (e) => {
    setTipoServicio(e.target.value);
    // Resetear todos los campos cuando cambia el tipo de servicio
    setFueVenta('');
    setCausa('');
    setMotivo('');
    setFueSatisfactoriaATC('');
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
      if (!fueSatisfactoriaATC) {
        alert('Por favor indica si la llamada fue satisfactoria');
        return;
      }
      if (fueSatisfactoriaATC === 'NO') {
        if (!causa || !motivo) {
          alert('Por favor selecciona causa y motivo');
          return;
        }
      }
    } else {
      alert('Por favor selecciona un tipo de servicio');
      return;
    }

    const evaluacion = {
      tipoServicio,
      fueVenta,
      fueSatisfactoria: tipoServicio === 'ATC' ? fueSatisfactoriaATC : '',
      causa: (tipoServicio === 'VENTAS' && fueVenta === 'NO') || (tipoServicio === 'ATC' && fueSatisfactoriaATC === 'NO') ? causa : '',
      motivo: (tipoServicio === 'VENTAS' && fueVenta === 'NO') || (tipoServicio === 'ATC' && fueSatisfactoriaATC === 'NO') ? motivo : '',
      llamada,
      tiempoMonitoreo
    };

    onGuardar(evaluacion);
  };

  // Lógica de habilitado del botón Guardar
  const puedeGuardar = (() => {
    if (!tipoServicio) return false;
    if (tipoServicio === 'VENTAS') {
      if (!fueVenta) return false;
      if (fueVenta === 'NO') return !!causa && !!motivo;
      return true; // Venta = SI
    }
    if (tipoServicio === 'ATC') {
      if (!fueSatisfactoriaATC) return false;
      if (fueSatisfactoriaATC === 'NO') return !!causa && !!motivo;
      return true; // Satisfactoria = SI
    }
    return false;
  })();

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
            <>
              <div className="campo-formulario">
                <label>¿La llamada fue satisfactoria?</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="fueSatisfactoriaATC"
                      value="SI"
                      checked={fueSatisfactoriaATC === 'SI'}
                      onChange={(e) => {
                        setFueSatisfactoriaATC(e.target.value);
                        setCausa('');
                        setMotivo('');
                      }}
                    />
                    <span className="radio-label">Sí</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="fueSatisfactoriaATC"
                      value="NO"
                      checked={fueSatisfactoriaATC === 'NO'}
                      onChange={(e) => {
                        setFueSatisfactoriaATC(e.target.value);
                        setCausa('');
                        setMotivo('');
                      }}
                    />
                    <span className="radio-label">No</span>
                  </label>
                </div>
              </div>

              {fueSatisfactoriaATC === 'NO' && (
                <div className="evaluacion-grid">
                  {/* Causa ATC */}
                  <div className="campo-formulario">
                    <label>Causa:</label>
                    <select
                      value={causa}
                      onChange={(e) => handleCausaChange(e.target.value)}
                      className="select-campo"
                    >
                      <option value="">Selecciona una causa</option>
                      {Object.keys(opcionesATC).map(causaKey => (
                        <option key={causaKey} value={causaKey}>
                          {causaKey}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Motivo ATC */}
                  <div className="campo-formulario">
                    <label>Motivo:</label>
                    <select
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="select-campo"
                      disabled={!causa}
                    >
                      <option value="">Selecciona un motivo</option>
                      {causa && opcionesATC[causa]?.map(motivoItem => (
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
        </div>

        <div className="formulario-actions">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button 
            className="btn-guardar" 
            onClick={handleGuardar}
            disabled={!puedeGuardar}
          >
            Guardar Evaluación
          </button>
        </div>
    </div>
  );
};

export default FormularioEvaluacion;
