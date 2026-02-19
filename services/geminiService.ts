
import { GoogleGenAI } from "@google/genai";

export const enhanceMarkdown = async (content: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Markdown expert. Please refine, clean up, and professionally format the following Markdown/HTML content. Fix broken syntax, improve structure, and ensure it's ready for high-quality PDF rendering. Return ONLY the refined markdown/html content without any code blocks or meta-commentary:
      
      ${content}`,
    });

    return response.text || content;
  } catch (error) {
    console.error("Gemini Enhancement Error:", error);
    return content;
  }
};
