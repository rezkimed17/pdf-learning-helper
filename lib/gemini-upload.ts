import { fileManagerClient } from './gemini';
import { FileState } from '@google/generative-ai/server';

export async function uploadToGemini(filePath: string, mimeType: string = 'application/pdf') {
    try {
        const uploadResponse = await fileManagerClient.uploadFile(filePath, {
            mimeType,
            displayName: filePath.split('/').pop(),
        });

        const fileUri = uploadResponse.file.uri;
        console.log(`Uploaded file to Gemini: ${fileUri}`);

        // Wait for processing to complete
        let file = await fileManagerClient.getFile(uploadResponse.file.name);
        while (file.state === FileState.PROCESSING) {
            console.log('Waiting for file processing...');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManagerClient.getFile(uploadResponse.file.name);
        }

        if (file.state === FileState.FAILED) {
            throw new Error('Gemini file processing failed');
        }

        console.log(`File processing complete: ${file.uri}`);
        return file;
    } catch (error) {
        console.error('Error uploading to Gemini:', error);
        throw error;
    }
}
