import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { quizId, answers } = await request.json(); // answers: { [questionIndex]: selectedOptionIndex }

        const quiz = await db.quizDefinition.findUnique({
            where: { id: quizId }
        });

        if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

        const questions = JSON.parse(quiz.questions);
        let score = 0;

        // Calculate score
        questions.forEach((q: any) => {
            if (answers[q.index] === q.correct_index) {
                score++;
            }
        });

        // Save Attempt
        const attempt = await db.quizAttempt.create({
            data: {
                quizDefinitionId: quizId,
                score,
                totalQuestions: questions.length,
                answers: JSON.stringify(answers)
            }
        });

        return NextResponse.json(attempt);

    } catch (error) {
        return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
    }
}
