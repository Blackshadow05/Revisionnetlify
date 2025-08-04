export async function uploadImageToOpenAI(file: File) {
  // Reexportamos la función de Gemini con el mismo nombre para mantener compatibilidad
  const { analyzeMenuImage } = await import('./gemini');
  return analyzeMenuImage(file);
}
