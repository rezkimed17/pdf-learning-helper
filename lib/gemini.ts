import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        temperature: 0.2, // Low temperature for more deterministic JSON
    }
});

export const fileManager = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Just accessing the SDK, file manager is separate
// Actually, the FileManager is a separate class in the SDK.
import { GoogleAIFileManager } from "@google/generative-ai/server";

export const fileManagerClient = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');
