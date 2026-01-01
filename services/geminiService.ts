import { GoogleGenAI } from "@google/genai";

let ai: any = null;
try {
  const apiKey = process.env.API_KEY || '';
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenAI", e);
}

export const askGemini = async (prompt: string, contextCode: string): Promise<string> => {
  try {
    const fullPrompt = `
      Du bist ein Experte für Arduino, C++ und MIDI.
      
      Der Benutzer arbeitet an einem Projekt für einen RP2040 (Raspberry Pi Pico) MIDI-Controller, 
      der Infrarot-Signale (IR) in USB-MIDI-Befehle umwandelt.
      Er nutzt die Bibliotheken "Control Surface" und "IRremote".

      Hier ist der aktuell generierte Code Kontext:
      \`\`\`cpp
      ${contextCode}
      \`\`\`

      Frage des Benutzers: "${prompt}"

      Bitte antworte kurz, präzise und hilfreich auf Deutsch. Wenn Code-Änderungen nötig sind, erkläre sie.
    `;

    if (!ai) {
      return "AI ist nicht konfiguriert. Bitte setzen Sie den GEMINI_API_KEY.";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    return response.text || "Entschuldigung, ich konnte keine Antwort generieren.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fehler bei der Kommunikation mit der AI. Bitte überprüfe deinen API Key.";
  }
};