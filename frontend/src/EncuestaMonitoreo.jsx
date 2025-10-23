import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import './EncuestaMonitoreo.css'

function EncuestaMonitoreo({ llamada, onCerrar }) {
  const [pasoActual, setPasoActual] = useState(1)
  const [pestañaActivaPaso3, setPestañaActivaPaso3] = useState('saluda')
  const [pestañaActivaPaso4, setPestañaActivaPaso4] = useState('informacion')
  const [pestañaActivaPaso5, setPestañaActivaPaso5] = useState('gestion')
  const [formData, setFormData] = useState({
    // Paso 1: Datos Generales
    proveedor: '',
    analistaCalidad: '',
    idInteraccion: '',
    telefono: '',
    fechaLlamada: '',
    fechaMonitoreo: '',
    duracionLlamada: '',
    nombreAsesor: '',
    usuarioAsesor: '',
    
    // Paso 2: Clasificación de Gestión
    tipoGestion: '',
    campanasOutbound: '',
    tipoMonitoreo: '',
    productoOfertado: '',
    
    // Paso 3: PENC - ASESOR: PROTOCOLOS
    pencSaluda: {
      saludaDespide: '',
      scriptEstablecido: ''
    },
    pencEscucha: {
      desconcentracion: '',
      evitaEspaciosBlanco: '',
      interrupciones: ''
    },
    pencFormulas: {
      personalizaLlamada: '',
      seguridadLlamada: '',
      amabilidadEmpatia: '',
      buenTonoVoz: ''
    },
    
    // Paso 4: PEC-UF: PRECISIÓN ERRORES CRÍTICOS DEL USUARIO FINAL
    pecInformacion: {
      informacionCorrecta: ''
    },
    pecProceso: {
      procesoCoordinacion: '',
      verificacionDocumentos: '',
      reglasOrtografia: '',
      procesoBiometrico: '',
      revisionScripter: ''
    },
    pecActitud: {
      mantieneAtencion: '',
      llamadaIncompleta: '',
      canalAbierto: ''
    },
    pecCalidad: {
      solicitaEspera: '',
      tiempoEspera: ''
    },
    
    // Paso 5: PEC-NEG: PRECISIÓN ERRORES CRÍTICOS DEL NEGOCIO
    pecGestionalComercial: {
      seguimientoGestion: '',
      validacionDatos: '',
      validaCobertura: '',
      sondeaNecesidades: '',
      ofrecimientoAcorde: '',
      ofrecimientoEscalonado: '',
      rebateObjeciones: '',
      despejaDudas: '',
      ofrecimientoPromocion: '',
      incentivaBaja: '',
      procedimientoURL: ''
    },
    pecValidacionesCRM: {
      registroCRMOne: '',
      registroCRMVentas: '',
      registroCodigoConclusion: ''
    },
    
    // Paso 6: PEC CUM - MANEJO DE INFORMACIÓN CONFIDENCIAL
    pecManejoInfo: {
      validaIdentidad: '',
      resumenVenta: '',
      mencionaPermanencia: '',
      confirmaAceptacion: '',
      indicaGrabacion: '',
      tratamientoDatos: '',
      pausaSegura: '',
      solicitaPermiso: ''
    },
    
    // Paso 7: Cierre y Observaciones
    novedadesCriticas: '',
    concretoVenta: '',
    generoOrden: {
      generoOrden: '',
      instaloServicio: '',
      entregoChipEquipo: '',
      entregoEquipo: ''
    },
    porqueNoConcreto: '',
    correoSupervisor: '',
    correoAnalistaCapacitacion: '',
    aplicaRetroalimentacion: ''
  })

  const totalPasos = 7

  // Autocompletar campos con datos de la llamada
  useEffect(() => {
    console.log('🔍 EncuestaMonitoreo - llamada recibida:', llamada)
    
    if (llamada) {
      // Formatear fecha de llamada (YYYY-MM-DD)
      const formatearFecha = (fechaString) => {
        if (!fechaString) return ''
        
        // Si ya está en formato YYYY-MM-DD
        if (fechaString.includes('-') && fechaString.length === 10) {
          return fechaString
        }
        
        // Si viene en formato DD/MM/YYYY
        if (fechaString.includes('/')) {
          const [dia, mes, anio] = fechaString.split('/')
          return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
        }
        
        // Si es un objeto Date o string ISO
        try {
          const fecha = new Date(fechaString)
          return fecha.toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      // Formatear duración (hh:mm:ss)
      const formatearDuracion = (duracionSegundos) => {
        if (!duracionSegundos) return ''
        const horas = Math.floor(duracionSegundos / 3600)
        const minutos = Math.floor((duracionSegundos % 3600) / 60)
        const segundos = duracionSegundos % 60
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
      }

      // Obtener fecha actual para fecha de monitoreo
      const fechaActual = new Date().toISOString().split('T')[0]

      // Determinar tipo de gestión basado en la campaña
      const determinarTipoGestion = (campana) => {
        if (!campana) return ''
        const campanaUpper = campana.toUpperCase()
        if (campanaUpper.includes('OUTBOUND') || campanaUpper.includes('PORTABILIDAD') || campanaUpper.includes('MIGRACION') || campanaUpper.includes('RENOVACION')) {
          return 'OUTBOUND'
        }
        return 'INBOUND'
      }

      // Mapear campaña a campanasOutbound
      const mapearCampanaOutbound = (campana) => {
        if (!campana) return ''
        const campanaUpper = campana.toUpperCase()
        if (campanaUpper.includes('PORTABILIDAD')) {
          return 'PORTABILIDAD - LINEA NUEVA'
        } else if (campanaUpper.includes('MIGRACION')) {
          return 'MIGRACIÓN'
        } else if (campanaUpper.includes('RENOVACION')) {
          return 'RENOVACIÓN'
        }
        return ''
      }

      setFormData(prev => ({
        ...prev,
        // Paso 1: Datos Generales
        idInteraccion: llamada.ID_Largo || '',
        telefono: llamada.Numero || '',
        fechaLlamada: formatearFecha(llamada.Fecha),
        fechaMonitoreo: fechaActual,
        duracionLlamada: formatearDuracion(llamada.Duracion),
        nombreAsesor: llamada.NombreCompletoAgente || '',
        usuarioAsesor: llamada.Usuario_Llamada_Origen || '',
        
        // Paso 2: Clasificación de Gestión
        tipoGestion: determinarTipoGestion(llamada.Campaña_Agente),
        campanasOutbound: mapearCampanaOutbound(llamada.Campaña_Agente),
        tipoMonitoreo: 'Aleatorio', // Por defecto es aleatorio
        productoOfertado: llamada.Campaña_Agente || ''
      }))
      
      console.log('✅ Autocompletado realizado con datos:', {
        idInteraccion: llamada.ID_Largo || '',
        telefono: llamada.Numero || '',
        fechaLlamada: formatearFecha(llamada.Fecha),
        fechaMonitoreo: fechaActual,
        duracionLlamada: formatearDuracion(llamada.Duracion),
        nombreAsesor: llamada.NombreCompletoAgente || '',
        usuarioAsesor: llamada.Usuario_Llamada_Origen || '',
        tipoGestion: determinarTipoGestion(llamada.Campaña_Agente),
        campanasOutbound: mapearCampanaOutbound(llamada.Campaña_Agente),
        tipoMonitoreo: 'Aleatorio',
        productoOfertado: llamada.Campaña_Agente || ''
      })
    } else {
      console.log('⚠️ No hay llamada disponible para autocompletar')
    }
  }, [llamada])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Log para debug
  useEffect(() => {
    console.log('📋 FormData actual:', formData)
  }, [formData])

  const handleRadioChange = (seccion, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor
      }
    }))
  }

  const handleRadioChangeSimple = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const siguientePaso = () => {
    if (pasoActual < totalPasos) {
      setPasoActual(pasoActual + 1)
    }
  }

  const anteriorPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1)
    }
  }

  const finalizarEncuesta = () => {
    console.log('Encuesta finalizada:', formData)
    // Aquí se enviaría la encuesta al backend
    onCerrar()
  }

  const renderBarraProgreso = () => {
    const porcentaje = (pasoActual / totalPasos) * 100
    
    return (
      <div className="barra-progreso">
        <div className="progreso-info">
          <span className="paso-actual">Paso {pasoActual} de {totalPasos}</span>
          <span className="porcentaje">{Math.round(porcentaje)}%</span>
        </div>
        <div className="barra-contenedor">
          <div 
            className="barra-llenado" 
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>
        <div className="pasos-indicadores">
          {Array.from({ length: totalPasos }, (_, i) => (
            <div 
              key={i + 1}
              className={`indicador-paso ${i + 1 <= pasoActual ? 'completado' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPaso1 = () => (
    <div className="paso-contenido">
      <h3><Icon icon="mdi:clipboard-text" style={{marginRight: '8px'}} />Datos Generales</h3>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Seleccione Proveedor *</label>
          <div className="radio-group">
            {['ACC', 'CANTEC', 'PARTNER', 'PABELPE', 'ORVILACA', 'RECUPERA', 'GNP', 'BRM'].map(proveedor => (
              <label key={proveedor} className="radio-option">
                <input
                  type="radio"
                  name="proveedor"
                  value={proveedor}
                  checked={formData.proveedor === proveedor}
                  onChange={handleInputChange}
                />
                <span>{proveedor}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Analista de Calidad *</label>
          <div className="radio-group">
            {['Jhair Gonzales', 'Romina Herrera', 'Evelyn villa', 'Stephany Salazar', 'Jean Paul Aguilar', 'Enmanuel Lavin'].map(analista => (
              <label key={analista} className="radio-option">
                <input
                  type="radio"
                  name="analistaCalidad"
                  value={analista}
                  checked={formData.analistaCalidad === analista}
                  onChange={handleInputChange}
                />
                <span>{analista}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>ID DE INTERACCIÓN (ID del CIC) *</label>
          <input
            type="text"
            name="idInteraccion"
            value={formData.idInteraccion}
            onChange={handleInputChange}
            placeholder="Ingrese el ID de interacción"
          />
        </div>

        <div className="form-group">
          <label>TELEFONO (09XXXXXXXX) *</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            placeholder="09XXXXXXXX"
            pattern="09[0-9]{8}"
          />
        </div>

        <div className="form-group">
          <label>Fecha de Llamada (DD/MM/AAAA) *</label>
          <input
            type="date"
            name="fechaLlamada"
            value={formData.fechaLlamada}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Fecha de Monitoreo (DD/MM/AAAA) *</label>
          <input
            type="date"
            name="fechaMonitoreo"
            value={formData.fechaMonitoreo}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Duración de la Llamada (hh:mm:ss) *</label>
          <input
            type="text"
            name="duracionLlamada"
            value={formData.duracionLlamada}
            onChange={handleInputChange}
            placeholder="hh:mm:ss"
            pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
          />
        </div>

        <div className="form-group">
          <label>Nombre del Asesor (APELLIDOS Y NOMBRES MAYUSCULA SIN TILDE) *</label>
          <input
            type="text"
            name="nombreAsesor"
            value={formData.nombreAsesor}
            onChange={handleInputChange}
            placeholder="APELLIDOS Y NOMBRES"
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group">
          <label>Usuario del Asesor *</label>
          <input
            type="text"
            name="usuarioAsesor"
            value={formData.usuarioAsesor}
            onChange={handleInputChange}
            placeholder="Usuario del asesor"
          />
        </div>
      </div>
    </div>
  )

  const renderPaso2 = () => (
    <div className="paso-contenido">
      <h3><Icon icon="mdi:chart-box" style={{marginRight: '8px'}} />Clasificación de Gestión</h3>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Tipo de Gestión *</label>
          <div className="radio-group">
            {['INBOUND', 'OUTBOUND', 'INBOUND VENTAS'].map(tipo => (
              <label key={tipo} className="radio-option">
                <input
                  type="radio"
                  name="tipoGestion"
                  value={tipo}
                  checked={formData.tipoGestion === tipo}
                  onChange={handleInputChange}
                />
                <span>{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        {formData.tipoGestion === 'OUTBOUND' && (
          <div className="form-group">
            <label>CAMPAÑAS OUTBOUND *</label>
            <div className="radio-group">
              {['RENOVACIÓN', 'PORTABILIDAD - LINEA NUEVA', 'MIGRACIÓN', 'PORTABILIDAD PPA', 'UPGRADE'].map(campana => (
                <label key={campana} className="radio-option">
                  <input
                    type="radio"
                    name="campanasOutbound"
                    value={campana}
                    checked={formData.campanasOutbound === campana}
                    onChange={handleInputChange}
                  />
                  <span>{campana}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Tipo de Monitoreo *</label>
          <div className="radio-group">
            {['Aleatorio', 'Auditoría'].map(tipo => (
              <label key={tipo} className="radio-option">
                <input
                  type="radio"
                  name="tipoMonitoreo"
                  value={tipo}
                  checked={formData.tipoMonitoreo === tipo}
                  onChange={handleInputChange}
                />
                <span>{tipo}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>PRODUCTO OFERTADO *</label>
          <input
            type="text"
            name="productoOfertado"
            value={formData.productoOfertado}
            onChange={handleInputChange}
            placeholder="Producto ofertado"
          />
        </div>
      </div>
    </div>
  )

  const renderCuadriculaEvaluacion = (seccion, items, titulo, mostrarTitulo = true) => (
    <div className="evaluacion-seccion">
      {mostrarTitulo && <h4>{titulo}</h4>}
      <div className="cuadricula-evaluacion">
        <div className="cuadricula-header">
          <div className="col-item">Item</div>
          <div className="col-si">SI CUMPLE</div>
          <div className="col-no">NO CUMPLE</div>
          <div className="col-na">NO APLICA</div>
        </div>
        {items.map(item => (
          <div key={item.key} className="cuadricula-fila">
            <div className="col-item">{item.label}</div>
            <div className="col-si">
              <input
                type="radio"
                name={`${seccion}_${item.key}`}
                checked={formData[seccion]?.[item.key] === 'SI'}
                onChange={() => handleRadioChange(seccion, item.key, 'SI')}
              />
            </div>
            <div className="col-no">
              <input
                type="radio"
                name={`${seccion}_${item.key}`}
                checked={formData[seccion]?.[item.key] === 'NO'}
                onChange={() => handleRadioChange(seccion, item.key, 'NO')}
              />
            </div>
            <div className="col-na">
              <input
                type="radio"
                name={`${seccion}_${item.key}`}
                checked={formData[seccion]?.[item.key] === 'NA'}
                onChange={() => handleRadioChange(seccion, item.key, 'NA')}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPaso3 = () => (
    <div className="paso-contenido">
      <h3><Icon icon="mdi:account-tie" style={{marginRight: '8px'}} />PENC - ASESOR: PROTOCOLOS // BUENAS PRACTICAS</h3>
      
      {/* Menú de pestañas */}
      <div className="pestañas-menu">
        <button 
          className={`pestaña-btn ${pestañaActivaPaso3 === 'saluda' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso3('saluda')}
        >
          <Icon icon="mdi:hand-wave" style={{marginRight: '8px'}} />
          Saluda / Se despide
        </button>
        <button 
          className={`pestaña-btn ${pestañaActivaPaso3 === 'escucha' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso3('escucha')}
        >
          <Icon icon="mdi:ear-hearing" style={{marginRight: '8px'}} />
          Escucha activa
        </button>
        <button 
          className={`pestaña-btn ${pestañaActivaPaso3 === 'formulas' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso3('formulas')}
        >
          <Icon icon="mdi:handshake" style={{marginRight: '8px'}} />
          Fórmulas de Cortesía
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="pestaña-contenido">
        {pestañaActivaPaso3 === 'saluda' && (
          renderCuadriculaEvaluacion('pencSaluda', [
            { key: 'saludaDespide', label: 'Saluda / Se despide' },
            { key: 'scriptEstablecido', label: 'Script establecido' }
          ], 'Saluda / Se despide', false)
        )}

        {pestañaActivaPaso3 === 'escucha' && (
          renderCuadriculaEvaluacion('pencEscucha', [
            { key: 'desconcentracion', label: 'Desconcentración' },
            { key: 'evitaEspaciosBlanco', label: 'Evita espacios en Blanco' },
            { key: 'interrupciones', label: 'Interrupciones' }
          ], 'Escucha activa', false)
        )}

        {pestañaActivaPaso3 === 'formulas' && (
          renderCuadriculaEvaluacion('pencFormulas', [
            { key: 'personalizaLlamada', label: 'Personaliza la llamada' },
            { key: 'seguridadLlamada', label: 'Seguridad en la llamada' },
            { key: 'amabilidadEmpatia', label: 'Amabilidad y empatía' },
            { key: 'buenTonoVoz', label: 'Buen tono de voz/vocabulario/tecnicismos' }
          ], 'Fórmulas de Cortesía', false)
        )}
      </div>
    </div>
  )

  const renderPaso4 = () => (
    <div className="paso-contenido">
      <h3><Icon icon="mdi:account-check" style={{marginRight: '8px'}} />PEC-UF: PRECISIÓN ERRORES CRÍTICOS DEL USUARIO FINAL</h3>
      
      {/* Menú de pestañas */}
      <div className="pestañas-menu">
        <button 
          className={`pestaña-btn ${pestañaActivaPaso4 === 'informacion' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso4('informacion')}
        >
          <Icon icon="mdi:information" style={{marginRight: '8px'}} />
          Información del Producto
        </button>
        <button 
          className={`pestaña-btn ${pestañaActivaPaso4 === 'proceso' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso4('proceso')}
        >
          <Icon icon="mdi:cog" style={{marginRight: '8px'}} />
          Proceso
        </button>
        <button 
          className={`pestaña-btn ${pestañaActivaPaso4 === 'actitud' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso4('actitud')}
        >
          <Icon icon="mdi:account-heart" style={{marginRight: '8px'}} />
          Actitud del Servicio
        </button>
        <button 
          className={`pestaña-btn ${pestañaActivaPaso4 === 'calidad' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso4('calidad')}
        >
          <Icon icon="mdi:star" style={{marginRight: '8px'}} />
          Calidad de Atención
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="pestaña-contenido">
        {pestañaActivaPaso4 === 'informacion' && (
          renderCuadriculaEvaluacion('pecInformacion', [
            { key: 'informacionCorrecta', label: 'Información correcta/completa del producto ofrecido' }
          ], 'Información correcta/completa del producto ofrecido', false)
        )}

        {pestañaActivaPaso4 === 'proceso' && (
          renderCuadriculaEvaluacion('pecProceso', [
            { key: 'procesoCoordinacion', label: 'Correcto proceso de coordinación' },
            { key: 'verificacionDocumentos', label: 'Verificación de documentos' },
            { key: 'reglasOrtografia', label: 'Cumple con reglas ortografías y sintaxis en la redacción' },
            { key: 'procesoBiometrico', label: 'Cumple con el proceso biométrico' },
            { key: 'revisionScripter', label: 'Asesor realizó la revisión del scripter sugerido del cic' }
          ], 'PROCESO', false)
        )}

        {pestañaActivaPaso4 === 'actitud' && (
          renderCuadriculaEvaluacion('pecActitud', [
            { key: 'mantieneAtencion', label: 'Mantiene la atención del cliente en la llamada' },
            { key: 'llamadaIncompleta', label: 'Llamada incompleta/corte de llamada' },
            { key: 'canalAbierto', label: 'Canal abierto' }
          ], 'Actitud del servicio', false)
        )}

        {pestañaActivaPaso4 === 'calidad' && (
          renderCuadriculaEvaluacion('pecCalidad', [
            { key: 'solicitaEspera', label: 'Solicita y agradece la Espera' },
            { key: 'tiempoEspera', label: 'Tiempo de Espera y uso del hold (1:15)' }
          ], 'Calidad de atención', false)
        )}
      </div>
    </div>
  )

  const renderPaso5 = () => (
    <div className="paso-contenido">
      <h3><Icon icon="mdi:briefcase" style={{marginRight: '8px'}} />PEC-NEG: PRECISIÓN ERRORES CRÍTICOS DEL NEGOCIO</h3>
      
      {/* Menú de pestañas */}
      <div className="pestañas-menu">
        <button 
          className={`pestaña-btn ${pestañaActivaPaso5 === 'gestion' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso5('gestion')}
        >
          <Icon icon="mdi:chart-line" style={{marginRight: '8px'}} />
          Gestión Comercial
        </button>
        <button 
          className={`pestaña-btn ${pestañaActivaPaso5 === 'validaciones' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso5('validaciones')}
        >
          <Icon icon="mdi:database-check" style={{marginRight: '8px'}} />
          Validaciones CRM
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="pestaña-contenido">
        {pestañaActivaPaso5 === 'gestion' && (
          renderCuadriculaEvaluacion('pecGestionalComercial', [
            { key: 'seguimientoGestion', label: 'Seguimiento de Gestión' },
            { key: 'validacionDatos', label: 'Validación de datos' },
            { key: 'validaCobertura', label: 'Valida correctamente cobertura' },
            { key: 'sondeaNecesidades', label: 'Sondea correctamente necesidades' },
            { key: 'ofrecimientoAcorde', label: 'Ofrecimiento acorde a la necesidad' },
            { key: 'ofrecimientoEscalonado', label: 'Realiza un ofrecimiento comercial de manera escalonada' },
            { key: 'rebateObjeciones', label: 'Rebate objeciones' },
            { key: 'despejaDudas', label: 'Despeja dudas del producto ofertado' },
            { key: 'ofrecimientoPromocion', label: 'Ofrecimiento de promoción vigente/proactivo' },
            { key: 'incentivaBaja', label: 'Incentiva a la baja' },
            { key: 'procedimientoURL', label: 'Procedimiento URL (registro de datos)' }
          ], 'Gestión Comercial', false)
        )}

        {pestañaActivaPaso5 === 'validaciones' && (
          renderCuadriculaEvaluacion('pecValidacionesCRM', [
            { key: 'registroCRMOne', label: 'Registro correcto de crm one' },
            { key: 'registroCRMVentas', label: 'Registro correcto en el crm ventas' },
            { key: 'registroCodigoConclusion', label: 'Registro correcto en el código de conclusión' }
          ], 'Validaciones y Registros en CRM', false)
        )}
      </div>
    </div>
  )

  const renderPaso6 = () => (
    <div className="paso-contenido">
      <h3><Icon icon="mdi:shield-check" style={{marginRight: '8px'}} />PEC CUM - MANEJO DE INFORMACIÓN CONFIDENCIAL</h3>
      
      {renderCuadriculaEvaluacion('pecManejoInfo', [
        { key: 'validaIdentidad', label: 'Valida identidad para entregar información' },
        { key: 'resumenVenta', label: 'Resumen completo de venta' },
        { key: 'mencionaPermanencia', label: 'Menciona condición de permanencia (permin)' },
        { key: 'confirmaAceptacion', label: 'Confirma aceptación del cliente' },
        { key: 'indicaGrabacion', label: 'Indica que llamada está siendo grabada' },
        { key: 'tratamientoDatos', label: 'Tratamiento de datos personales (ley de protección de datos)' },
        { key: 'pausaSegura', label: 'Pausa segura' },
        { key: 'solicitaPermiso', label: 'Solicita permiso para dar información comercial' }
      ], 'Manejo de información confidencial')}
    </div>
  )

  const renderPaso7 = () => (
    <div className="paso-contenido">
      <h3><Icon icon="mdi:flag-checkered" style={{marginRight: '8px'}} />Cierre y Observaciones</h3>
      
      <div className="form-grid">
        <div className="form-group full-width">
          <label>DETALLAR LAS NOVEDADES CRÍTICAS PRESENTADAS EN LA LLAMADA *</label>
          <textarea
            name="novedadesCriticas"
            value={formData.novedadesCriticas}
            onChange={handleInputChange}
            placeholder="Detalle las novedades críticas..."
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Concretó la venta en la llamada *</label>
          <div className="radio-group">
            {['SI', 'NO', 'NO APLICA'].map(opcion => (
              <label key={opcion} className="radio-option">
                <input
                  type="radio"
                  name="concretoVenta"
                  value={opcion}
                  checked={formData.concretoVenta === opcion}
                  onChange={handleInputChange}
                />
                <span>{opcion}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group full-width">
          <h4>¿SE GENERÓ LA ORDEN?</h4>
          <div className="cuadricula-evaluacion">
            <div className="cuadricula-header">
              <div className="col-item">Item</div>
              <div className="col-si">SI</div>
              <div className="col-no">NO</div>
              <div className="col-na">NO APLICA</div>
            </div>
            {[
              { key: 'generoOrden', label: '¿SE GENERÓ LA ORDEN?' },
              { key: 'instaloServicio', label: 'SE INSTALÓ EL SERVICIO' },
              { key: 'entregoChipEquipo', label: 'SE ENTREGÓ CHIP Y EQUIPO' },
              { key: 'entregoEquipo', label: 'SE ENTREGÓ EQUIPO' }
            ].map(item => (
              <div key={item.key} className="cuadricula-fila">
                <div className="col-item">{item.label}</div>
                <div className="col-si">
                  <input
                    type="radio"
                    name={`generoOrden_${item.key}`}
                    checked={formData.generoOrden?.[item.key] === 'SI'}
                    onChange={() => handleRadioChange('generoOrden', item.key, 'SI')}
                  />
                </div>
                <div className="col-no">
                  <input
                    type="radio"
                    name={`generoOrden_${item.key}`}
                    checked={formData.generoOrden?.[item.key] === 'NO'}
                    onChange={() => handleRadioChange('generoOrden', item.key, 'NO')}
                  />
                </div>
                <div className="col-na">
                  <input
                    type="radio"
                    name={`generoOrden_${item.key}`}
                    checked={formData.generoOrden?.[item.key] === 'NA'}
                    onChange={() => handleRadioChange('generoOrden', item.key, 'NA')}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {formData.concretoVenta === 'NO' && (
          <div className="form-group full-width">
            <label>Porque no se concretó la venta?</label>
            <textarea
              name="porqueNoConcreto"
              value={formData.porqueNoConcreto}
              onChange={handleInputChange}
              placeholder="Explique por qué no se concretó la venta..."
              rows="3"
            />
          </div>
        )}

        <div className="form-group">
          <label>AGREGAR EL CORREO DEL SUPERVISOR *</label>
          <input
            type="email"
            name="correoSupervisor"
            value={formData.correoSupervisor}
            onChange={handleInputChange}
            placeholder="supervisor@claro.com"
          />
        </div>

        <div className="form-group">
          <label>AGREGAR EL CORREO DEL ANALISTA Y CAPACITACIÓN *</label>
          <input
            type="email"
            name="correoAnalistaCapacitacion"
            value={formData.correoAnalistaCapacitacion}
            onChange={handleInputChange}
            placeholder="analista@claro.com"
          />
        </div>

        <div className="form-group">
          <label>APLICA RETROALIMENTACIÓN *</label>
          <div className="radio-group">
            {['SI', 'NO'].map(opcion => (
              <label key={opcion} className="radio-option">
                <input
                  type="radio"
                  name="aplicaRetroalimentacion"
                  value={opcion}
                  checked={formData.aplicaRetroalimentacion === opcion}
                  onChange={handleInputChange}
                />
                <span>{opcion}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPasoActual = () => {
    switch (pasoActual) {
      case 1: return renderPaso1()
      case 2: return renderPaso2()
      case 3: return renderPaso3()
      case 4: return renderPaso4()
      case 5: return renderPaso5()
      case 6: return renderPaso6()
      case 7: return renderPaso7()
      default: return renderPaso1()
    }
  }

  return (
    <div className="encuesta-monitoreo-overlay">
      <div className="encuesta-monitoreo-container">
        <div className="encuesta-header">
          <div className="encuesta-titulo">
            <img src="/partnerlogo.svg" alt="Claro" className="logo-claro" />
            <h2>PLANTILLA DE MONITOREO</h2>
          </div>
          <button className="btn-cerrar" onClick={onCerrar}>
            <Icon icon="mdi:close" style={{fontSize: '24px', color: 'white', display: 'block'}} />
            <span style={{position: 'absolute', color: 'white', fontSize: '20px', fontWeight: 'bold'}}>×</span>
          </button>
        </div>

        {renderBarraProgreso()}

        <div className="encuesta-content">
          {renderPasoActual()}
        </div>

        <div className="encuesta-navegacion">
          <button 
            className="btn-anterior" 
            onClick={anteriorPaso}
            disabled={pasoActual === 1}
          >
            <Icon icon="mdi:arrow-left" />
            ATRÁS
          </button>
          
          {pasoActual < totalPasos ? (
            <button className="btn-siguiente" onClick={siguientePaso}>
              SIGUIENTE
              <Icon icon="mdi:arrow-right" />
            </button>
          ) : (
            <button className="btn-finalizar" onClick={finalizarEncuesta}>
              <Icon icon="mdi:check" />
              FINALIZAR MONITOREO
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EncuestaMonitoreo