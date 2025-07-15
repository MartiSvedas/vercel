import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { text, target_lang, source_lang = 'auto' } = req.body;

  if (!text || !target_lang) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      null,
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
          text,
          target_lang,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
}
