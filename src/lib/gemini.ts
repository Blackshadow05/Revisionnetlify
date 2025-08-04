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
    const prompt = `Dime el menú de comida que contiene la imagen.`;

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
          maxOutputTokens: 1000,
          temperature: 0.4,
          topP: 1,
          topK: 32
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
    
    // Extraer el texto de la respuesta
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!responseText) {
      throw new Error('No se pudo extraer información del menú');
    }
    
    // Devolver el texto de la respuesta directamente
    return { texto: responseText };
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    throw error;
  }
}
