export async function analyzeMenuImage(file: File) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key no configurada. Por favor, agrega NEXT_PUBLIC_GEMINI_API_KEY a tu archivo .env.local');
  }

  console.log('Usando API Key:', apiKey ? 'Sí' : 'No');

  try {
    // Convertir la imagen a base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Extraer solo la parte base64 (sin el prefijo data:image/*;base64,)
    const base64Data = base64Image.split(',')[1];

    // Preparar el prompt
    const prompt = `Analiza esta imagen de un menú de comida y extrae la información de los platos disponibles. 

Responde SOLO con el texto del menú que ves en la imagen, incluyendo:
- Los días de la semana
- Las fechas (si aparecen)
- Los platos de comida para cada día

No agregues explicaciones adicionales, solo el contenido del menú tal como aparece en la imagen.`;

    // Enviar la imagen a la API de Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.2,
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de API:', response.status, errorText);
      throw new Error(`Error de API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Respuesta completa de la API:', JSON.stringify(data, null, 2));
    
    // Extraer el texto de la respuesta - probando múltiples estructuras posibles
    let responseText = null;
    
    // Estructura 1: con parts
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = data.candidates[0].content.parts[0].text.trim();
    }
    // Estructura 2: texto directo en content
    else if (data.candidates?.[0]?.content?.text) {
      responseText = data.candidates[0].content.text.trim();
    }
    // Estructura 3: texto directo en candidate
    else if (data.candidates?.[0]?.text) {
      responseText = data.candidates[0].text.trim();
    }
    
    console.log('Texto extraído:', responseText);
    
    if (!responseText) {
      console.error('Estructura de respuesta no reconocida:', data);
      throw new Error('No se pudo extraer información del menú. La respuesta de la API está vacía o tiene una estructura inesperada.');
    }
    
    // Devolver el texto de la respuesta directamente
    return { texto: responseText };
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    throw error;
  }
}
