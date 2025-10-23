# Integración de Audio con ICBM

## Estado Actual
- ✅ Reproductor de audio implementado
- ✅ Contenedor UI diseñado
- ⏳ Pendiente: Integración con ICBM

## Ubicación del Audio

### Audio de Prueba
Coloca tu archivo de audio de prueba en:
```
frontend/public/audio/test-audio.mp3
```

### Formatos Soportados
- MP3: `/audio/test-audio.mp3`
- WAV: `/audio/test-audio.wav`
- OGG: `/audio/test-audio.ogg`

## Estructura del Proyecto

```
frontend/
├── public/
│   └── audio/
│       ├── README.md
│       └── test-audio.mp3  ← Coloca aquí tu audio de prueba
└── src/
    ├── App.jsx  ← Reproductor implementado aquí
    └── App.css  ← Estilos del reproductor
```

## Próximos Pasos para ICBM

Cuando estés listo para integrar con ICBM:

1. **Crear endpoint en backend** (`backend/server.js`):
   ```javascript
   app.get('/api/audio/:idLlamada', async (req, res) => {
     const { idLlamada } = req.params;
     // Lógica para obtener audio desde ICBM
     // Retornar URL o stream del audio
   });
   ```

2. **Modificar App.jsx**:
   ```javascript
   // Cambiar de:
   <source src="/audio/test-audio.mp3" type="audio/mpeg" />
   
   // A:
   <source src={`/api/audio/${llamada.ID_Largo}`} type="audio/mpeg" />
   ```

3. **Campos adicionales en la llamada**:
   - Agregar campo `urlAudio` en la respuesta del backend
   - O usar el `ID_Largo` para buscar el audio dinámicamente

## Diseño del Reproductor

- **Ubicación**: Justo debajo del título "Detalle de la Llamada"
- **Estilo**: Contenedor con gradiente morado
- **Controles**: Play, pause, barra de progreso, volumen
- **Responsive**: Se adapta al ancho del contenedor

## Notas

- El reproductor aparecerá automáticamente cuando haya una llamada
- Actualmente usa un audio de prueba estático
- Listo para integrar con ICBM cuando esté disponible

