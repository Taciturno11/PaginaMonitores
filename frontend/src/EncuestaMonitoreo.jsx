import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import html2pdf from 'html2pdf.js'
import './EncuestaMonitoreo.css'

function EncuestaMonitoreo({ llamada, usuario, onCerrar }) {
  const [pasoActual, setPasoActual] = useState(1)
  const [pestañaActivaPaso3, setPestañaActivaPaso3] = useState('saluda')
  const [pestañaActivaPaso4, setPestañaActivaPaso4] = useState('informacion')
  const [pestañaActivaPaso5, setPestañaActivaPaso5] = useState('gestion')
  const [pestañaActivaPaso7, setPestañaActivaPaso7] = useState('cierre')
  const [mostrarOtrosProveedores, setMostrarOtrosProveedores] = useState(false)
  const [errorValidacion, setErrorValidacion] = useState('')
  const [mostrarResumen, setMostrarResumen] = useState(false)
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
    console.log('👤 EncuestaMonitoreo - usuario recibido:', usuario)
    
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

      // Mapear nombre del monitor a las opciones disponibles de analista
      const mapearAnalistaCalidad = (nombreCompleto) => {
        if (!nombreCompleto) return ''
        
        const nombreCompletoUpper = nombreCompleto.toUpperCase()
        console.log('🔍 Buscando analista para:', nombreCompletoUpper)
        
        // Mapeo de nombres completos a opciones disponibles
        const mapeoAnalistas = {
          'ANDREA MORELIA TEJEDA SALINAS': 'Romina Herrera',
          'EVELYN BETZABETH VILLA ARAMBURU': 'Evelyn villa',
          'JEANPAUL AGUILAR PEREZ': 'Jean Paul Aguilar',
          'JEAN PAUL AGUILAR PEREZ': 'Jean Paul Aguilar',
          'YADHIRA MARGARITA VASQUEZ PAREDES': 'Stephany Salazar',
          'EMMANUEL ALEJANDRO LAVIN GUERRA': 'Enmanuel Lavin',
          'EMMANUEL ALEJANDRO LAVIN': 'Enmanuel Lavin',
          'JHAIR GONZALES': 'Jhair Gonzales'
        }
        
        // Buscar coincidencia exacta
        if (mapeoAnalistas[nombreCompletoUpper]) {
          console.log('✅ Coincidencia exacta:', mapeoAnalistas[nombreCompletoUpper])
          return mapeoAnalistas[nombreCompletoUpper]
        }
        
        // Buscar coincidencia parcial por nombre y apellido paterno
        for (const [nombreCompletoBD, analista] of Object.entries(mapeoAnalistas)) {
          const partesBD = nombreCompletoBD.split(' ')
          const partesUsuario = nombreCompletoUpper.split(' ')
          
          // Comparar primer nombre y primer apellido
          if (partesBD.length >= 2 && partesUsuario.length >= 2) {
            if (partesBD[0] === partesUsuario[0] && partesBD[1] === partesUsuario[1]) {
              console.log('✅ Coincidencia parcial:', analista)
              return analista
            }
          }
        }
        
        console.log('⚠️ No se encontró coincidencia')
        return ''
      }

      setFormData(prev => ({
        ...prev,
        // Paso 1: Datos Generales
        proveedor: 'PARTNER', // Siempre PARTNER por defecto
        analistaCalidad: usuario?.nombre || '', // Mostrar nombre completo del monitor
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
        proveedor: 'PARTNER',
        analistaCalidad: usuario?.nombre || '',
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
  }, [llamada, usuario])

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

  // Auto-completar novedades críticas cuando se llega al módulo 7
  useEffect(() => {
    if (pasoActual === 7 && !formData.novedadesCriticas) {
      const modulosConFallo = []
      
      // Verificar módulo 3 (PENC)
      const modulos3 = [formData.pencSaluda, formData.pencEscucha, formData.pencFormulas]
      let tieneNo3 = false
      modulos3.forEach(modulo => {
        if (modulo) {
          Object.values(modulo).forEach(valor => {
            if (valor === 'NO') tieneNo3 = true
          })
        }
      })
      if (tieneNo3) modulosConFallo.push('Módulo 3 - PENC (Protocolos y Buenas Prácticas)')
      
      // Verificar módulo 4 (PEC-UF)
      const modulos4 = [formData.pecInformacion, formData.pecProceso, formData.pecActitud, formData.pecCalidad]
      let tieneNo4 = false
      modulos4.forEach(modulo => {
        if (modulo) {
          Object.values(modulo).forEach(valor => {
            if (valor === 'NO') tieneNo4 = true
          })
        }
      })
      if (tieneNo4) modulosConFallo.push('Módulo 4 - PEC-UF (Precisión Errores Críticos Usuario Final)')
      
      // Verificar módulo 5 (PEC-NEG)
      const modulos5 = [formData.pecGestionalComercial, formData.pecValidacionesCRM]
      let tieneNo5 = false
      modulos5.forEach(modulo => {
        if (modulo) {
          Object.values(modulo).forEach(valor => {
            if (valor === 'NO') tieneNo5 = true
          })
        }
      })
      if (tieneNo5) modulosConFallo.push('Módulo 5 - PEC-NEG (Precisión Errores Críticos del Negocio)')
      
      // Verificar módulo 6 (PEC CUM)
      const modulo6 = formData.pecManejoInfo
      let tieneNo6 = false
      if (modulo6) {
        Object.values(modulo6).forEach(valor => {
          if (valor === 'NO') tieneNo6 = true
        })
      }
      if (tieneNo6) modulosConFallo.push('Módulo 6 - PEC CUM (Manejo de Información Confidencial)')
      
      // Si hay módulos con fallo, generar el texto
      if (modulosConFallo.length > 0) {
        const texto = modulosConFallo.map(modulo => `- ${modulo}: `).join('\n') + '\n\nPor favor detalle cada novedad encontrada.'
        setFormData(prev => ({
          ...prev,
          novedadesCriticas: texto
        }))
      }
    }
  }, [pasoActual, formData.pencSaluda, formData.pencEscucha, formData.pencFormulas, formData.pecInformacion, formData.pecProceso, formData.pecActitud, formData.pecCalidad, formData.pecGestionalComercial, formData.pecValidacionesCRM, formData.pecManejoInfo, formData.novedadesCriticas])

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

  // Función para calcular la nota del módulo 3
  const calcularNotaModulo3 = () => {
    const modulos3 = [
      formData.pencSaluda,
      formData.pencEscucha,
      formData.pencFormulas
    ]
    
    let totalItems = 0
    let cumplidos = 0
    
    modulos3.forEach(modulo => {
      if (modulo) {
        Object.values(modulo).forEach(valor => {
          if (valor && valor !== '') {
            totalItems++
            if (valor === 'SI') {
              cumplidos++
            }
          }
        })
      }
    })
    
    if (totalItems === 0) return null
    
    const porcentaje = (cumplidos / totalItems) * 100
    return {
      porcentaje: Math.round(porcentaje),
      cumplidos,
      totalItems
    }
  }

  // Función para calcular la nota del módulo 4 (con lógica especial: 1 NO = 0%)
  const calcularNotaModulo4 = () => {
    const modulos4 = [
      formData.pecInformacion,
      formData.pecProceso,
      formData.pecActitud,
      formData.pecCalidad
    ]
    
    let totalItems = 0
    let cumplidos = 0
    let tieneNo = false
    
    modulos4.forEach(modulo => {
      if (modulo) {
        Object.values(modulo).forEach(valor => {
          if (valor && valor !== '') {
            totalItems++
            if (valor === 'SI') {
              cumplidos++
            } else if (valor === 'NO') {
              tieneNo = true
            }
          }
        })
      }
    })
    
    if (totalItems === 0) return null
    
    // Si hay al menos un "NO", la nota es 0%
    if (tieneNo) {
      return {
        porcentaje: 0,
        cumplidos: 0,
        totalItems
      }
    }
    
    const porcentaje = (cumplidos / totalItems) * 100
    return {
      porcentaje: Math.round(porcentaje),
      cumplidos,
      totalItems
    }
  }

  // Función para calcular la nota del módulo 5 (con lógica especial: 1 NO = 0%)
  const calcularNotaModulo5 = () => {
    const modulos5 = [
      formData.pecGestionalComercial,
      formData.pecValidacionesCRM
    ]
    
    let totalItems = 0
    let cumplidos = 0
    let tieneNo = false
    
    modulos5.forEach(modulo => {
      if (modulo) {
        Object.values(modulo).forEach(valor => {
          if (valor && valor !== '') {
            totalItems++
            if (valor === 'SI') {
              cumplidos++
            } else if (valor === 'NO') {
              tieneNo = true
            }
          }
        })
      }
    })
    
    if (totalItems === 0) return null
    
    // Si hay al menos un "NO", la nota es 0%
    if (tieneNo) {
      return {
        porcentaje: 0,
        cumplidos: 0,
        totalItems
      }
    }
    
    const porcentaje = (cumplidos / totalItems) * 100
    return {
      porcentaje: Math.round(porcentaje),
      cumplidos,
      totalItems
    }
  }

  // Función para calcular la nota del módulo 6 (con lógica especial: 1 NO = 0%)
  const calcularNotaModulo6 = () => {
    const modulo6 = formData.pecManejoInfo
    
    if (!modulo6) return null
    
    let totalItems = 0
    let cumplidos = 0
    let tieneNo = false
    
    Object.values(modulo6).forEach(valor => {
      if (valor && valor !== '') {
        totalItems++
        if (valor === 'SI') {
          cumplidos++
        } else if (valor === 'NO') {
          tieneNo = true
        }
      }
    })
    
    if (totalItems === 0) return null
    
    // Si hay al menos un "NO", la nota es 0%
    if (tieneNo) {
      return {
        porcentaje: 0,
        cumplidos: 0,
        totalItems
      }
    }
    
    const porcentaje = (cumplidos / totalItems) * 100
    return {
      porcentaje: Math.round(porcentaje),
      cumplidos,
      totalItems
    }
  }

  // Funciones de validación por módulo
  const validarModulo1 = () => {
    const camposRequeridos = [
      formData.proveedor,
      formData.analistaCalidad,
      formData.idInteraccion,
      formData.telefono,
      formData.fechaLlamada,
      formData.fechaMonitoreo,
      formData.duracionLlamada,
      formData.nombreAsesor,
      formData.usuarioAsesor
    ]
    return camposRequeridos.every(campo => campo && campo !== '')
  }

  const validarModulo2 = () => {
    const camposRequeridos = [
      formData.tipoGestion,
      formData.campanasOutbound,
      formData.tipoMonitoreo,
      formData.productoOfertado
    ]
    return camposRequeridos.every(campo => campo && campo !== '')
  }

  const validarModulo3 = () => {
    const submodulos = [
      formData.pencSaluda,
      formData.pencEscucha,
      formData.pencFormulas
    ]
    
    return submodulos.every(submodulo => {
      if (!submodulo) return false
      return Object.values(submodulo).every(valor => valor && valor !== '')
    })
  }

  const validarModulo4 = () => {
    const submodulos = [
      formData.pecInformacion,
      formData.pecProceso,
      formData.pecActitud,
      formData.pecCalidad
    ]
    
    return submodulos.every(submodulo => {
      if (!submodulo) return false
      return Object.values(submodulo).every(valor => valor && valor !== '')
    })
  }

  const validarModulo5 = () => {
    const submodulos = [
      formData.pecGestionalComercial,
      formData.pecValidacionesCRM
    ]
    
    return submodulos.every(submodulo => {
      if (!submodulo) return false
      return Object.values(submodulo).every(valor => valor && valor !== '')
    })
  }

  const validarModulo6 = () => {
    const submodulo = formData.pecManejoInfo
    if (!submodulo) return false
    return Object.values(submodulo).every(valor => valor && valor !== '')
  }

  const validarModulo7 = () => {
    const camposRequeridos = [
      formData.novedadesCriticas,
      formData.correoSupervisor,
      formData.correoAnalistaCapacitacion,
      formData.aplicaRetroalimentacion
    ]
    
    const generoOrdenValidado = formData.generoOrden && 
      Object.values(formData.generoOrden).every(valor => valor && valor !== '')
    
    return camposRequeridos.every(campo => campo && campo !== '') && generoOrdenValidado
  }

  const validarModuloActual = () => {
    switch (pasoActual) {
      case 1: return validarModulo1()
      case 2: return validarModulo2()
      case 3: return validarModulo3()
      case 4: return validarModulo4()
      case 5: return validarModulo5()
      case 6: return validarModulo6()
      case 7: return validarModulo7()
      default: return true
    }
  }

  const siguientePaso = () => {
    if (!validarModuloActual()) {
      setErrorValidacion('Por favor complete todos los campos requeridos del módulo actual antes de continuar.')
      return
    }
    
    setErrorValidacion('')
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
    setMostrarResumen(true)
  }

  const descargarPDF = () => {
    const notaModulo3 = calcularNotaModulo3()
    const notaModulo4 = calcularNotaModulo4()
    const notaModulo5 = calcularNotaModulo5()
    const notaModulo6 = calcularNotaModulo6()
    
    // Obtener ítems con baja nota para cada módulo
    const itemsModulo3 = obtenerItemsBajaNota(3, [
      formData.pencSaluda,
      formData.pencEscucha,
      formData.pencFormulas
    ], [
      { saludaDespide: 'Saluda / Se despide', scriptEstablecido: 'Script establecido' },
      { desconcentracion: 'Desconcentración', evitaEspaciosBlanco: 'Evita espacios en Blanco', interrupciones: 'Interrupciones' },
      { personalizaLlamada: 'Personaliza la llamada', seguridadLlamada: 'Seguridad en la llamada', amabilidadEmpatia: 'Amabilidad y empatía', buenTonoVoz: 'Buen tono de voz/vocabulario/tecnicismos' }
    ])
    
    const itemsModulo4 = obtenerItemsBajaNota(4, [
      formData.pecInformacion,
      formData.pecProceso,
      formData.pecActitud,
      formData.pecCalidad
    ], [
      { informacionCorrecta: 'Información correcta/completa del producto ofrecido' },
      { procesoCoordinacion: 'Correcto proceso de coordinación', verificacionDocumentos: 'Verificación de documentos', reglasOrtografia: 'Cumple con reglas ortografías y sintaxis en la redacción', procesoBiometrico: 'Cumple con el proceso biométrico', revisionScripter: 'Asesor realizó la revisión del scripter sugerido del cic' },
      { mantieneAtencion: 'Mantiene la atención del cliente en la llamada', llamadaIncompleta: 'Llamada incompleta/corte de llamada', canalAbierto: 'Canal abierto' },
      { solicitaEspera: 'Solicita y agradece la Espera', tiempoEspera: 'Tiempo de Espera y uso del hold (1:15)' }
    ])
    
    const itemsModulo5 = obtenerItemsBajaNota(5, [
      formData.pecGestionalComercial,
      formData.pecValidacionesCRM
    ], [
      { seguimientoGestion: 'Seguimiento Gestión', validacionDatos: 'Validación Datos', validaCobertura: 'Valida Cobertura', sondeaNecesidades: 'Sondea Necesidades', ofrecimientoAcorde: 'Ofrecimiento Acorde', ofrecimientoEscalonado: 'Ofrecimiento Escalonado', rebateObjeciones: 'Rebate Objeciones', despejaDudas: 'Despeja Dudas', ofrecimientoPromocion: 'Ofrecimiento Promoción', incentivaBaja: 'Incentiva Baja', procedimientoURL: 'Procedimiento URL' },
      { registroCRMOne: 'Registro CRM One', registroCRMVentas: 'Registro CRM Ventas', registroCodigoConclusion: 'Registro Código Conclusión' }
    ])
    
    const itemsModulo6 = obtenerItemsBajaNota(6, [formData.pecManejoInfo], [{
      validaIdentidad: 'Valida Identidad',
      resumenVenta: 'Resumen de Venta',
      mencionaPermanencia: 'Menciona Permanencia',
      confirmaAceptacion: 'Confirma Aceptación',
      indicaGrabacion: 'Indica Grabación',
      tratamientoDatos: 'Tratamiento de Datos',
      pausaSegura: 'Pausa Segura',
      solicitaPermiso: 'Solicita Permiso'
    }])
    
    const notas = [
      { modulo: 'Módulo 3 - PENC', nota: notaModulo3, items: itemsModulo3 },
      { modulo: 'Módulo 4 - PEC-UF', nota: notaModulo4, items: itemsModulo4 },
      { modulo: 'Módulo 5 - PEC-NEG', nota: notaModulo5, items: itemsModulo5 },
      { modulo: 'Módulo 6 - PEC CUM', nota: notaModulo6, items: itemsModulo6 }
    ]
    
    // Crear contenido HTML para el PDF
    const contenidoHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4caf50; text-align: center; margin-bottom: 30px;">
          RESUMEN DE MONITOREO
        </h1>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
            Información General
          </h2>
          <p><strong>Asesor:</strong> ${formData.nombreAsesor}</p>
          <p><strong>Usuario Asesor:</strong> ${formData.usuarioAsesor}</p>
          <p><strong>ID Interacción:</strong> ${formData.idInteraccion}</p>
          <p><strong>Teléfono:</strong> ${formData.telefono}</p>
          <p><strong>Fecha Llamada:</strong> ${formData.fechaLlamada}</p>
          <p><strong>Fecha Monitoreo:</strong> ${formData.fechaMonitoreo}</p>
          <p><strong>Duración:</strong> ${formData.duracionLlamada}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
            Resumen de Notas
          </h2>
          ${notas.map(item => item.nota ? `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
              <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                <span style="font-weight: 600;">${item.modulo}</span>
                <span style="background-color: ${item.nota.porcentaje >= 80 ? '#4caf50' : item.nota.porcentaje >= 60 ? '#ff9800' : '#f44336'}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
                  ${item.nota.porcentaje}%
                </span>
              </div>
              ${item.items.length > 0 ? `
                <div style="margin-top: 10px; padding: 10px; background-color: #fff3e0; border-left: 3px solid #ff9800;">
                  <div style="font-size: 11px; font-weight: 600; color: #e65100; margin-bottom: 8px;">Ítems con baja nota:</div>
                  ${item.items.map(itemBaja => `
                    <div style="display: flex; align-items: center; padding: 4px 0; font-size: 12px;">
                      <span style="margin-right: 8px;">${itemBaja.valor === 'NO' ? '✗' : '?'}</span>
                      <span style="flex: 1;">${itemBaja.etiqueta}</span>
                      <span style="background-color: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">${itemBaja.valor}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : '').join('')}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
            Retroalimentación
          </h2>
          <div style="background-color: #f9fafb; border: 1px solid #ddd; border-radius: 6px; padding: 15px; white-space: pre-wrap;">
            ${formData.novedadesCriticas || 'No se registró retroalimentación'}
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          <p>Generado el ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    `
    
    // Configuración para html2pdf
    const opciones = {
      margin: 1,
      filename: `monitoreo_${formData.idInteraccion || 'reporte'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    
    // Generar PDF
    html2pdf().set(opciones).from(contenidoHTML).save()
  }

  const cerrarResumen = () => {
    setMostrarResumen(false)
    onCerrar()
  }

  const renderBarraProgreso = () => {
    const porcentajeBarra = ((pasoActual - 1) / (totalPasos - 1)) * 100
    const notaModulo3 = calcularNotaModulo3()
    const notaModulo4 = calcularNotaModulo4()
    const notaModulo5 = calcularNotaModulo5()
    const notaModulo6 = calcularNotaModulo6()
    
    const nombresModulos = [
      'Datos Generales',
      'Clasificación',
      'PENC',
      'PEC-UF',
      'PEC-NEG',
      'PEC CUM',
      'Cierre'
    ]
    
    return (
      <div className="barra-progreso">
        <div className="progreso-info">
          <span className="paso-actual">{nombresModulos[pasoActual - 1]}</span>
          <span className="porcentaje">{Math.round((pasoActual / totalPasos) * 100)}%</span>
        </div>
        
        <div className="barra-contenedor-mejorada">
          <div className="barra-linea">
          <div 
              className="barra-progreso-llenado" 
              style={{ width: `${porcentajeBarra}%` }}
          ></div>
        </div>
          
          <div className="indicadores-modulos">
            {Array.from({ length: totalPasos }, (_, i) => {
              const numeroModulo = i + 1
              const esActual = numeroModulo === pasoActual
              const estaCompletado = numeroModulo < pasoActual
              
              // Obtener la nota del módulo correspondiente
              let nota = null
              if (numeroModulo === 3) nota = notaModulo3
              else if (numeroModulo === 4) nota = notaModulo4
              else if (numeroModulo === 5) nota = notaModulo5
              else if (numeroModulo === 6) nota = notaModulo6
              
              return (
                <div key={numeroModulo} className="indicador-modulo-container">
                  {/* Nota encima del indicador si corresponde */}
                  {nota && (
                    <div 
                      className="nota-indicador" 
                      style={{
                        backgroundColor: nota.porcentaje >= 80 ? '#4caf50' : nota.porcentaje >= 60 ? '#ff9800' : '#f44336'
                      }}
                    >
                      {nota.porcentaje}%
            </div>
                  )}
                  
                  {/* Número del módulo */}
                  <div 
                    className={`indicador-modulo ${esActual ? 'actual' : ''} ${estaCompletado ? 'completado' : ''}`}
                  >
                    {numeroModulo}
                  </div>
                  
                  {/* Etiqueta del módulo */}
                  <div className="etiqueta-modulo">{nombresModulos[i]}</div>
                </div>
              )
            })}
          </div>
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
            <label className="radio-option">
              <input
                type="radio"
                name="proveedor"
                value="PARTNER"
                checked={formData.proveedor === 'PARTNER'}
                onChange={handleInputChange}
              />
              <span>PARTNER</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="proveedor"
                value="other"
                checked={formData.proveedor !== 'PARTNER'}
                onChange={() => {
                  setMostrarOtrosProveedores(true)
                }}
              />
              <span>+ Proveedores</span>
            </label>
          </div>
        </div>

        {/* Popup de Proveedores */}
        {mostrarOtrosProveedores && (
          <div className="proveedores-popup-overlay" onClick={() => setMostrarOtrosProveedores(false)}>
            <div className="proveedores-popup-container" onClick={(e) => e.stopPropagation()}>
              <div className="proveedores-popup-header">
                <h3>Seleccione un Proveedor</h3>
                <button className="proveedores-popup-cerrar" onClick={() => setMostrarOtrosProveedores(false)}>
                  <Icon icon="mdi:close" />
                </button>
              </div>
              <div className="proveedores-popup-content">
                {['ACC', 'CANTEC', 'PABELPE', 'ORVILACA', 'RECUPERA', 'GNP', 'BRM'].map(proveedor => (
                  <label key={proveedor} className="proveedores-popup-option">
                    <input
                      type="radio"
                      name="proveedor"
                      value={proveedor}
                      checked={formData.proveedor === proveedor}
                      onChange={(e) => {
                        handleInputChange(e)
                        setMostrarOtrosProveedores(false)
                      }}
                    />
                    <span>{proveedor}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Analista de Calidad *</label>
          <input
            type="text"
            name="analistaCalidad"
            value={formData.analistaCalidad}
            readOnly
            style={{ 
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#f9f9f9',
              cursor: 'not-allowed'
            }}
          />
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

        <div className="form-group" style={{ marginTop: '-21px' }}>
          <label>Nombre del Asesor (APELLIDOS Y NOMBRES MAYUSCULA SIN TILDE) *</label>
          <input
            type="text"
            name="nombreAsesor"
            value={formData.nombreAsesor}
            onChange={handleInputChange}
            placeholder="APELLIDOS Y NOMBRES"
            style={{ 
              textTransform: 'uppercase'
            }}
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
          <div className="radio-group radio-group-grid">
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
            <div className="radio-group radio-group-grid">
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
          <div className="radio-group radio-group-grid">
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
      
      {/* Menú de pestañas */}
      <div className="pestañas-menu">
        <button 
          className={`pestaña-btn ${pestañaActivaPaso7 === 'cierre' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso7('cierre')}
        >
          <Icon icon="mdi:clipboard-text" style={{marginRight: '8px'}} />
          Cierre y Observaciones
        </button>
        <button 
          className={`pestaña-btn ${pestañaActivaPaso7 === 'orden' ? 'activa' : ''}`}
          onClick={() => setPestañaActivaPaso7('orden')}
        >
          <Icon icon="mdi:file-document-edit" style={{marginRight: '8px'}} />
          Generación de Orden
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="pestaña-contenido">
        {pestañaActivaPaso7 === 'cierre' && (
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
              <div className="radio-group radio-group-grid">
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
        )}

        {pestañaActivaPaso7 === 'orden' && (
          <div className="form-grid">
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
          </div>
        )}
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

  // Función para obtener los ítems con baja nota (NO o NA) de un módulo
  const obtenerItemsBajaNota = (modulo, submodulos, etiquetas) => {
    const itemsBajaNota = []
    
    if (!submodulos || !Array.isArray(submodulos)) return itemsBajaNota
    
    submodulos.forEach((submodulo, subIndex) => {
      if (submodulo) {
        Object.entries(submodulo).forEach(([key, valor]) => {
          if (valor === 'NO' || valor === 'NA') {
            const etiqueta = etiquetas[subIndex]?.[key] || key
            itemsBajaNota.push({ etiqueta, valor })
          }
        })
      }
    })
    
    return itemsBajaNota
  }

  const renderResumen = () => {
    const notaModulo3 = calcularNotaModulo3()
    const notaModulo4 = calcularNotaModulo4()
    const notaModulo5 = calcularNotaModulo5()
    const notaModulo6 = calcularNotaModulo6()
    
    // Obtener ítems con baja nota para cada módulo
    const itemsModulo3 = obtenerItemsBajaNota(3, [
      formData.pencSaluda,
      formData.pencEscucha,
      formData.pencFormulas
    ], [
      { saludaDespide: 'Saluda / Se despide', scriptEstablecido: 'Script establecido' },
      { desconcentracion: 'Desconcentración', evitaEspaciosBlanco: 'Evita espacios en Blanco', interrupciones: 'Interrupciones' },
      { personalizaLlamada: 'Personaliza la llamada', seguridadLlamada: 'Seguridad en la llamada', amabilidadEmpatia: 'Amabilidad y empatía', buenTonoVoz: 'Buen tono de voz/vocabulario/tecnicismos' }
    ])
    
    const itemsModulo4 = obtenerItemsBajaNota(4, [
      formData.pecInformacion,
      formData.pecProceso,
      formData.pecActitud,
      formData.pecCalidad
    ], [
      { informacionCorrecta: 'Información correcta/completa del producto ofrecido' },
      { procesoCoordinacion: 'Correcto proceso de coordinación', verificacionDocumentos: 'Verificación de documentos', reglasOrtografia: 'Cumple con reglas ortografías y sintaxis en la redacción', procesoBiometrico: 'Cumple con el proceso biométrico', revisionScripter: 'Asesor realizó la revisión del scripter sugerido del cic' },
      { mantieneAtencion: 'Mantiene la atención del cliente en la llamada', llamadaIncompleta: 'Llamada incompleta/corte de llamada', canalAbierto: 'Canal abierto' },
      { solicitaEspera: 'Solicita y agradece la Espera', tiempoEspera: 'Tiempo de Espera y uso del hold (1:15)' }
    ])
    
    const itemsModulo5 = obtenerItemsBajaNota(5, [
      formData.pecGestionalComercial,
      formData.pecValidacionesCRM
    ], [
      { seguimientoGestion: 'Seguimiento Gestión', validacionDatos: 'Validación Datos', validaCobertura: 'Valida Cobertura', sondeaNecesidades: 'Sondea Necesidades', ofrecimientoAcorde: 'Ofrecimiento Acorde', ofrecimientoEscalonado: 'Ofrecimiento Escalonado', rebateObjeciones: 'Rebate Objeciones', despejaDudas: 'Despeja Dudas', ofrecimientoPromocion: 'Ofrecimiento Promoción', incentivaBaja: 'Incentiva Baja', procedimientoURL: 'Procedimiento URL' },
      { registroCRMOne: 'Registro CRM One', registroCRMVentas: 'Registro CRM Ventas', registroCodigoConclusion: 'Registro Código Conclusión' }
    ])
    
    const itemsModulo6 = obtenerItemsBajaNota(6, [formData.pecManejoInfo], [{
      validaIdentidad: 'Valida Identidad',
      resumenVenta: 'Resumen de Venta',
      mencionaPermanencia: 'Menciona Permanencia',
      confirmaAceptacion: 'Confirma Aceptación',
      indicaGrabacion: 'Indica Grabación',
      tratamientoDatos: 'Tratamiento de Datos',
      pausaSegura: 'Pausa Segura',
      solicitaPermiso: 'Solicita Permiso'
    }])
    
    const notas = [
      { modulo: 'Módulo 3 - PENC', nota: notaModulo3, items: itemsModulo3 },
      { modulo: 'Módulo 4 - PEC-UF', nota: notaModulo4, items: itemsModulo4 },
      { modulo: 'Módulo 5 - PEC-NEG', nota: notaModulo5, items: itemsModulo5 },
      { modulo: 'Módulo 6 - PEC CUM', nota: notaModulo6, items: itemsModulo6 }
    ]
    
    return (
      <div className="resumen-final">
        <div className="resumen-header">
          <Icon icon="mdi:check-circle" className="resumen-icon-success" />
          <h2>Monitoreo Finalizado</h2>
        </div>
        
        <div className="resumen-content">
          <div className="resumen-notas">
            <h3>Resumen de Notas</h3>
            {notas.map((item, index) => (
              item.nota && (
                <div key={index} className="nota-modulo-completo">
                  <div className="nota-item">
                    <span className="nota-modulo-nombre">{item.modulo}</span>
                    <span 
                      className="nota-modulo-valor"
                      style={{
                        backgroundColor: item.nota.porcentaje >= 80 ? '#4caf50' : item.nota.porcentaje >= 60 ? '#ff9800' : '#f44336',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      {item.nota.porcentaje}%
                    </span>
                  </div>
                  {item.items.length > 0 && (
                    <div className="items-baja-nota">
                      <div className="items-baja-nota-titulo">Ítems con baja nota:</div>
                      {item.items.map((itemBaja, idx) => (
                        <div key={idx} className="item-baja-nota-item">
                          <Icon icon={itemBaja.valor === 'NO' ? 'mdi:close-circle' : 'mdi:help-circle'} 
                            style={{ color: itemBaja.valor === 'NO' ? '#f44336' : '#ff9800', marginRight: '8px' }} 
                          />
                          <span>{itemBaja.etiqueta}</span>
                          <span className="item-baja-nota-valor">{itemBaja.valor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
          
          <div className="resumen-retroalimentacion">
            <h3>Retroalimentación</h3>
            <div className="retroalimentacion-texto">
              {formData.novedadesCriticas || 'No se registró retroalimentación'}
            </div>
          </div>
        </div>
        
        <div className="resumen-footer">
          <button className="btn-descargar" onClick={descargarPDF}>
            <Icon icon="mdi:download" />
            Descargar PDF
          </button>
          <button className="btn-cerrar-resumen" onClick={cerrarResumen}>
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="encuesta-monitoreo-overlay">
      <div className="encuesta-monitoreo-container">
        {mostrarResumen ? (
          renderResumen()
        ) : (
          <>
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

            {/* Popup de Error de Validación */}
            {errorValidacion && (
              <div className="popup-overlay" onClick={() => setErrorValidacion('')}>
                <div className="popup-error" onClick={(e) => e.stopPropagation()}>
                  <div className="popup-header">
                    <Icon icon="mdi:alert-circle" className="popup-icon" />
                    <h3>Campos Incompletos</h3>
                  </div>
                  <div className="popup-body">
                    <p>{errorValidacion}</p>
                  </div>
                  <div className="popup-footer">
                    <button className="btn-popup" onClick={() => setErrorValidacion('')}>
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default EncuestaMonitoreo