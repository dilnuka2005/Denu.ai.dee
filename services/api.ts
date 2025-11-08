
import { createClient, Provider } from '@supabase/supabase-js';
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, MessageSource, ChatMode, Attachment } from '../types';

// --- SERVICE INITIALIZATION ---

const SUPABASE_URL = 'https://auarltmtiutjcfrvvfix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YXJsdG10aXV0amNmcnZ2Zml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI1OTQsImV4cCI6MjA3ODA4ODU5NH0.JXeC9rOrUF2OExkFZIz5ywQJSDP2ht17CoY5QnqoP8I';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- CONSTANTS ---
const SYSTEM_INSTRUCTION_NORMAL = "You are DeeNU.Ai, a helpful and sophisticated AI assistant powered by Google, specializing in generating responses grounded in real-time search results. Keep your answers clear, concise, and professional. Use markdown for formatting.";
const SYSTEM_INSTRUCTION_PRO = "You are DeeNU.Ai Pro Mode (Flash), a creative and advanced AI assistant powered by Google. Respond thoughtfully and provide deep insights. Do NOT use external search tools. Use markdown for formatting.";
const SYSTEM_INSTRUCTION_DEEP = "You are DeeNU.Ai Pro (Deep Search), a highly advanced AI assistant. Your goal is to provide deep, comprehensive, and insightful answers, using Google Search results to gather extensive information. Synthesize findings, analyze deeply, and provide expert-level explanations.";
const SYSTEM_INSTRUCTION_CODE = "You are DeeNU.Ai Code Generator. Your response MUST ONLY contain the complete code block requested by the user, wrapped in appropriate language markdown (e.g., ```html, ```javascript). Provide NO additional conversational text, introductions, or explanations outside the code block.";


// --- AUTH FUNCTIONS ---

export const signInWithOAuth = async (provider: Provider) => {
    await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: window.location.href
        }
    });
};

export const signInAnonymously = async () => {
    return await supabase.auth.signInAnonymously();
};


// --- API FUNCTIONS ---

export const generateChatResponse = async (history: Message[], latestPrompt: string, mode: ChatMode, attachment?: Attachment): Promise<{ text: string, sources: MessageSource[] }> => {
    try {
        const historyParts = history.map(msg => ({
            role: msg.role as 'user' | 'model',
            parts: [{ text: msg.text }]
        }));

        const userParts = [];
        if (attachment?.type === 'image' && attachment.mimeType) {
            userParts.push({
                inlineData: {
                    mimeType: attachment.mimeType,
                    data: attachment.data
                }
            });
        }
        
        let promptText = latestPrompt;
        if (attachment?.type === 'text') {
            promptText = `Based on the following document content, please answer my question.\n\n---\nDOCUMENT: ${attachment.fileName}\n---\n${attachment.data}\n\n---\nQUESTION:\n---\n${latestPrompt}`;
        }
        userParts.push({ text: promptText });

        const contents = [...historyParts, { role: 'user', parts: userParts }];

        let tools;
        let systemInstructionText = SYSTEM_INSTRUCTION_PRO;

        if (mode === 'normal') {
            tools = [{ googleSearch: {} }];
            systemInstructionText = SYSTEM_INSTRUCTION_NORMAL;
        } else if (mode === 'deep') {
            tools = [{ googleSearch: {} }];
            systemInstructionText = SYSTEM_INSTRUCTION_DEEP;
        }

        // Fix: Moved `tools` inside the `config` object as per the Gemini API guidelines.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstructionText,
                tools,
            },
        });
        
        const text = response.text;
        let sources: MessageSource[] = [];

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata?.groundingChunks) {
            sources = groundingMetadata.groundingChunks
              .map((chunk: any) => ({
                uri: chunk.web?.uri,
                title: chunk.web?.title,
              }))
              .filter((source): source is MessageSource => !!source.uri);
        }

        return { text, sources };
    } catch (error) {
        console.error("Gemini API call failed:", error);
        return { text: `An error occurred: ${(error as Error).message}. Please check the console.`, sources: [] };
    }
};


export const generateCode = async (prompt: string, language: string): Promise<string> => {
    const fullPrompt = `Generate a complete, single-file code implementation for the following request in ${language}: ${prompt}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_CODE
            },
        });
        
        let cleanCode = response.text.trim();
        if (cleanCode.startsWith("```")) {
            cleanCode = cleanCode.substring(cleanCode.indexOf('\n') + 1);
        }
        if (cleanCode.endsWith("```")) {
            cleanCode = cleanCode.substring(0, cleanCode.lastIndexOf("```"));
        }
        return cleanCode.trim();

    } catch (error) {
        console.error("Gemini Code Gen failed:", error);
        return `Error generating code: ${(error as Error).message}`;
    }
};

export const generateTTSAudio = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;

    } catch (error) {
        console.error("TTS generation failed:", error);
        return null;
    }
};

// --- AUDIO UTILITIES for TTS ---

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const playAudio = async (base64Audio: string) => {
    try {
      const audioContext = new (window.AudioContext)({ sampleRate: 24000 });
      const rawAudioData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(rawAudioData, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Failed to play audio", e);
    }
};
