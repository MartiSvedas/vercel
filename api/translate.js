import axios from 'axios';

// Configuración de seguridad
const ALLOWED_ORIGINS = [
  'https://final-proyect-chat-traductor-ofdo6c.flutterflow.app',
  'https://app.flutterflow.io',
  'https://app.flutterflow.io/project/final-proyect-chat-traductor-ofdo6c?tab=apiConfig'// Opcional: añade otros dominios permitidos
];

export default async function handler(req, res) {
  // 🔒 Configuración CORS dinámica — asegurarse que siempre se aplica
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin);

   // Establece los encabezados CORS para todas las respuestas
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Si el origen no está permitido, simplemente no establezcas el encabezado Access-Control-Allow-Origin.
    // El navegador bloqueará la solicitud por sí mismo.
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    // ✅ Asegurarse de incluir todos los headers incluso en preflight
    return res.status(204).end();
  }
 // Si el origen no está permitido para la solicitud POST real, envía un 403 Forbidden.
  // Esta es una verificación redundante si el navegador bloquea correctamente el preflight, pero es buena para llamadas directas.
  if (!allowed) {
    return res.status(403).json({ error: 'Origin no permitido' });
  }
  // ❌ Rechazar métodos que no sean POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido',
      allowed_methods: ['POST']
    });
  }

  // 🛡️ Validación de entrada mejorada
  const { text, target_lang, source_lang = 'auto' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ 
      error: 'Parámetro "text" inválido o faltante',
      example: { text: "Hello", target_lang: "ES" }
    });
  }

  try {
    // ✨ Mejora: Limitar longitud del texto
    if (text.length > 5000) {
      return res.status(413).json({ 
        error: 'Texto demasiado largo',
        max_length: 5000
      });
    }

    // 🚀 Llamada a DeepL API optimizada
    const startTime = Date.now();
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      {
        text: [text], // Envía como array para mejor compatibilidad
        target_lang,
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          'Content-Type': 'application/json', // Mejor que x-www-form-urlencoded
          'User-Agent': 'FlutterFlow-DeepL-Proxy/1.0'
        },
        timeout: 10000 // 10 segundos timeout
      }
    );

    // ⏱️ Log de performance
    console.log(`Traducción completada en ${Date.now() - startTime}ms`);

    // 📦 Formatear respuesta consistentemente
    res.status(200).json({
      success: true,
      data: {
        translated_text: response.data.translations[0].text,
        detected_language: response.data.translations[0].detected_source_language,
        character_count: text.length
      },
      meta: {
        api: 'DeepL',
        version: 'v2'
      }
    });

  } catch (err) {
    // 🛠️ Manejo de errores mejorado
    console.error('Error en DeepL API:', {
      error: err.message,
      stack: err.stack,
      request: { text, target_lang, source_lang },
      response: err.response?.data
    });

    const statusCode = err.response?.status || 500;
    const errorData = err.response?.data || { 
      message: 'Error interno del servidor' 
    };

    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode,
        message: errorData.message || 'Error desconocido en la traducción',
        details: statusCode === 500 ? undefined : errorData // No exponer detalles en errores 500
      }
    });
  }
}
