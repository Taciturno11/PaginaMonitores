import { useState, useEffect } from 'react';
import './FormularioEvaluacion.css';

const FormularioEvaluacion = ({ llamada, tiempoMonitoreo, onGuardar, onCancelar }) => {
  const [tipoServicio, setTipoServicio] = useState('');
  const [fueVenta, setFueVenta] = useState('');
  const [causa, setCausa] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fueSatisfactoriaATC, setFueSatisfactoriaATC] = useState('');
  const [evaluacionCompletada, setEvaluacionCompletada] = useState(false);

  // Autocompletar evaluación basado en Estado IPC
  useEffect(() => {
    if (llamada && llamada.Tipificacion_Estado_IPC) {
      const estadoIPC = llamada.Tipificacion_Estado_IPC;
      
      // Estados que son VENTAS
      const estadosVentas = [
        'Agendado',
        'Aceptacion No Efectiva',
        'Llamada Saliente',
        'No Acepta',
        'Aceptados',
        'No Desea Recibir Llamada',
        'No Contactado',
        'Agente Cierra Sin Tipificar',
        'Contacto AGL'
      ];
      
      // Si el estado es uno de VENTAS
      if (estadosVentas.includes(estadoIPC)) {
        setTipoServicio('VENTAS');
        
        // Si es "Aceptados" = venta exitosa (SI)
        if (estadoIPC === 'Aceptados') {
          setFueVenta('SI');
          setEvaluacionCompletada(true);
        } else {
          // Cualquier otro estado = no venta (NO)
          setFueVenta('NO');
        }
      } else {
        // Si no es ningún estado de VENTAS, es ATC
        setTipoServicio('ATC');
        setFueSatisfactoriaATC('SI'); // Por defecto satisfactoria
        setEvaluacionCompletada(true);
      }
    }
  }, [llamada])

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
          {/* Solo mostrar contenido si ya tenemos tipo de servicio */}
          {tipoServicio && (
            <>
              {/* Campo Estado - Solo mostrar si NO es venta exitosa */}
              {!(tipoServicio === 'VENTAS' && fueVenta === 'SI') && (
                <div className="campo-estado">
                  <label>Estado:</label>
                  <div className="estado-badge">
                    {tipoServicio === 'VENTAS' && fueVenta === 'NO' && (
                      <span className="estado no-venta">✗ No Venta</span>
                    )}
                    {tipoServicio === 'ATC' && fueSatisfactoriaATC === 'SI' && (
                      <span className="estado satisfactoria">✓ Satisfactoria</span>
                    )}
                    {tipoServicio === 'ATC' && fueSatisfactoriaATC === 'NO' && (
                      <span className="estado no-satisfactoria">✗ No Satisfactoria</span>
                    )}
                  </div>
                </div>
              )}

              {/* Evaluación para VENTAS */}
              {tipoServicio === 'VENTAS' && (
                <>
                  {/* Si fue venta exitosa, mostrar badge */}
                  {fueVenta === 'SI' && (
                    <div className="evaluacion-badge">
                      <h3>✓ Venta Exitosa</h3>
                      <p>La evaluación está completa. Puedes guardar directamente.</p>
                    </div>
                  )}

                  {/* Si NO fue venta, mostrar causa y motivo */}
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
                  {/* Si fue satisfactoria, mostrar badge */}
                  {fueSatisfactoriaATC === 'SI' && (
                    <div className="evaluacion-badge">
                      <h3>✓ Llamada Satisfactoria</h3>
                      <p>La evaluación está completa. Puedes guardar directamente.</p>
                    </div>
                  )}

                  {/* Si NO fue satisfactoria, mostrar causa y motivo */}
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
            </>
          )}
        </div>

        <div className="formulario-actions">
          {evaluacionCompletada ? (
            <>
              <button className="btn-cancelar" onClick={onCancelar}>
                Cancelar
              </button>
              <button 
                className="btn-guardar btn-guardar-auto" 
                onClick={handleGuardar}
                disabled={!puedeGuardar}
              >
                ✓ Guardar Automáticamente
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
    </div>
  );
};

export default FormularioEvaluacion;
