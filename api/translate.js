import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { text, target_lang } = req.body;

  if (!text || !target_lang) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      {
        text: [text],
        target_lang: target_lang
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ translation: response.data.translations[0] });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al traducir', details: error.response?.data || error.message });
  }
}
