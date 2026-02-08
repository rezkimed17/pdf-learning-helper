export function parseJSON<T>(text: string): T {
    try {
        // First try direct parse
        return JSON.parse(text);
    } catch (e) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonBlock = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        if (jsonBlock) {
            try {
                return JSON.parse(jsonBlock[1]);
            } catch (e2) {
                // Failed inside block
            }
        }

        // Attempt basic repair (very simple, relying mostly on the prompt)
        // For a real prod app, use a library like 'json-repair' or 'parse-json'
        // or re-prompt the LLM. 
        // Here we will throw and let the caller handle retry/repair prompt.
        throw new Error('Failed to parse JSON');
    }
}

export async function generateSafeJSON<T>(
    model: any,
    prompt: string,
    schemaDescription: string
): Promise<T> {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        return parseJSON<T>(text);
    } catch (e) {
        console.warn('JSON parse failed, attempting repair prompt...');
        // Retry with a repair prompt
        const repairPrompt = `The previous response was not valid JSON. Please fix it and return ONLY the raw JSON object, no markdown.
    
    Previous response:
    ${text.slice(0, 1000)}...
    
    Expected schema:
    ${schemaDescription}`;

        const repairResult = await model.generateContent(repairPrompt);
        const repairText = repairResult.response.text();
        return parseJSON<T>(repairText);
    }
}
