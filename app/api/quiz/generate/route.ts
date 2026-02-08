import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { geminiModel } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { workspaceId, moduleId } = await request.json();

        const module = await db.module.findUnique({
            where: { id: moduleId },
            include: { workspace: true }
        });

        if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

        // Generate Quiz
        const prompt = `Generate a 5-question multiple choice quiz for the learning module: "${module.title}".
    Summary of module: "${module.summary}"
    Key terms: ${module.keyTerms}
    
    Constraint:
    - 4 options per question.
    - 1 correct answer.
    - Include a brief explanation for the correct answer.
    - Return JSON only.
    
    JSON Format:
    {
      "questions": [
        {
          "index": 1,
          "prompt": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0, // 0-3
          "explanation": "Why this is correct",
          "cited_page": number // optional, related page
        }
      ]
    }`;

        // Pass file context if available? 
        // We can, or just rely on the summary/terms. 
        // Ideally we pass the file to get better questions grounded in text.
        // Let's passed the file if uri exists.
        let parts: any[] = [prompt];
        if (module.workspace.geminiFileUri) {
            parts = [
                { fileData: { mimeType: 'application/pdf', fileUri: module.workspace.geminiFileUri } },
                prompt
            ];
        }

        const result = await geminiModel.generateContent(parts);
        const text = result.response.text();
        let data;
        try {
            data = JSON.parse(text.match(/```json\n([\s\S]*?)\n```/)?.[1] || text);
        } catch (e) {
            // Repair
            const repairPrompt = `Fix this JSON:\n${text}`;
            const repairRes = await geminiModel.generateContent(repairPrompt);
            data = JSON.parse(repairRes.response.text().match(/```json\n([\s\S]*?)\n```/)?.[1] || repairRes.response.text());
        }

        // Save Quiz Definition
        const quiz = await db.quizDefinition.create({
            data: {
                workspaceId,
                moduleId,
                questions: JSON.stringify(data.questions)
            }
        });

        return NextResponse.json(quiz);

    } catch (error) {
        console.error('Quiz generation error:', error);
        return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
    }
}
