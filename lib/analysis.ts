import { db } from './db';
import { geminiModel } from './gemini';
import { uploadToGemini } from './gemini-upload';
import { generateSafeJSON } from './json'; // Assuming I exported generateSafeJSON from lib/json.ts, wait I named it lib/json.ts in the previous step? Yes.

export async function processPdf(workspaceId: string) {
    console.log(`[Job] Processing PDF for workspace ${workspaceId}`);
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new Error('Workspace not found');

    try {
        // 1. Upload to Gemini
        await updateProgress(workspaceId, 'UPLOADING', 'Uploading PDF to Gemini...', 10);
        console.log(`[Job] Uploading file ${workspace.filePath} to Gemini...`);
        const geminiFile = await uploadToGemini(workspace.filePath);
        console.log(`[Job] Gemini file uploaded: ${geminiFile.uri}`);

        await db.workspace.update({
            where: { id: workspaceId },
            data: { geminiFileUri: geminiFile.uri }
        });

        // 2. Analyze & Plan
        await updateProgress(workspaceId, 'ANALYZING', 'Analyzing document structure...', 20);

        const planPrompt = `Analyze this document and propose a learning module structure.
    The goal is to break down the content into logical learning modules.
    
    Requirements:
    - Determine an appropriate number of modules based on length and complexity (e.g., 5-20).
    - Each module should cover a distinct topic or section.
    - Return a JSON object with this structure:
    {
      "module_count": number,
      "rationale": "string explanation of why this count was chosen",
      "modules": [
        {
          "index": number,
          "title": "string",
          "page_ranges": "string (e.g. '1-5')" 
        }
      ]
    }
    `;

        // We need to pass the file part to the model.
        // The google-generative-ai SDK handles file parts in the generateContent call.
        const planResult = await geminiModel.generateContent([
            { fileData: { mimeType: geminiFile.mimeType, fileUri: geminiFile.uri } },
            planPrompt
        ]);
        console.log('[Job] Plan generated.');

        const planText = planResult.response.text();
        // Use our safe parser
        // I need to make sure generateSafeJSON can handle the prompt with file.
        // Actually generateSafeJSON in my previous step took (model, prompt, schema).
        // I should probably just use the result I got here or refactor generateSafeJSON.
        // For now, let's just parse the text manually or use a helper that doesn't run the generation if I already have the result.
        // But generateSafeJSON runs the generation.
        // I'll quickly refactor generateSafeJSON or just copy the parseKey here.
        // Let's rely on a specific helper for planning that uses the file.

        // Let's implement a parsing helper directly here for now to avoid refactoring loop.
        let planData;
        try {
            planData = JSON.parse(planText.match(/```json\n([\s\S]*?)\n```/)?.[1] || planText);
        } catch (e) {
            console.warn("JSON parse failed, trying repair...");
            // Simple repair fallback (could utilize the one in lib/json.ts if exported properly)
            const repairPrompt = `Fix this JSON:\n${planText}`;
            const repairResult = await geminiModel.generateContent(repairPrompt);
            planData = JSON.parse(repairResult.response.text().match(/```json\n([\s\S]*?)\n```/)?.[1] || repairResult.response.text());
        }

        await db.workspace.update({
            where: { id: workspaceId },
            data: { moduleCount: planData.module_count }
        });

        // 3. Generate Modules
        const modules = planData.modules;
        const totalModules = modules.length;

        for (let i = 0; i < totalModules; i++) {
            const modPlan = modules[i];
            const percent = 30 + Math.floor((i / totalModules) * 60);
            await updateProgress(workspaceId, 'GENERATING_MODULES', `Generating module ${i + 1}/${totalModules}: ${modPlan.title}`, percent);

            const modulePrompt = `Generate content for learning module #${modPlan.index}: "${modPlan.title}".
        Focus on pages: ${modPlan.page_ranges}.
        
        Return JSON:
        {
          "summary": "3-5 sentences summary",
          "key_terms": ["term1", "term2", "term3", ...],
          "citations": [1, 5] (page numbers explicitly referenced, max 3)
        }`;

            // Generate content for this specific module
            // We can pass the file again (it's stateless request usually) or rely on context caching if we used it (not used here).
            // Passing the file uri again is cheap as it's a reference.
            const modResult = await geminiModel.generateContent([
                { fileData: { mimeType: geminiFile.mimeType, fileUri: geminiFile.uri } },
                modulePrompt
            ]);

            const modText = modResult.response.text();
            let modData;
            try {
                modData = JSON.parse(modText.match(/```json\n([\s\S]*?)\n```/)?.[1] || modText);
            } catch (e) {
                // Repair logic
                const repairPrompt = `Fix this JSON:\n${modText}`;
                const rResult = await geminiModel.generateContent(repairPrompt);
                modData = JSON.parse(rResult.response.text().match(/```json\n([\s\S]*?)\n```/)?.[1] || rResult.response.text());
            }

            await db.module.create({
                data: {
                    workspaceId,
                    index: modPlan.index,
                    title: modPlan.title,
                    summary: modData.summary,
                    keyTerms: JSON.stringify(modData.key_terms),
                    citations: JSON.stringify(modData.citations)
                }
            });
        }

        await updateProgress(workspaceId, 'COMPLETED', 'All processing finished successfully.', 100);
        await db.workspace.update({
            where: { id: workspaceId },
            data: { status: 'COMPLETED', progressPercent: 100 }
        });

    } catch (error) {
        console.error('Processing failed', error);
        await updateProgress(workspaceId, 'FAILED', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 0);
        await db.workspace.update({
            where: { id: workspaceId },
            data: { status: 'FAILED' }
        });
    }
}

async function updateProgress(workspaceId: string, stage: string, message: string, percent: number) {
    await db.workspace.update({
        where: { id: workspaceId },
        data: { processingStage: stage, progressPercent: percent }
    });

    await db.progressEvent.create({
        data: {
            workspaceId,
            stage,
            message,
            percent
        }
    });
}
