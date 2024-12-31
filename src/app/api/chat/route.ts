import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { ChatMessage, Novel, RecommendationResponse } from '@/types/chat';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const novels = await kv.get('all_novels_test_v3') as Novel[];

    if (!novels || novels.length === 0) {
      return NextResponse.json({
        explanation: '😅 Oops! Our novel database seems to be empty at the moment. Please try again later! 📚',
        recommendations: [],
        preferences: {}
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful novel recommendation assistant. Your task is to recommend novels based on user preferences. 
          You should analyze the user's request and provide personalized recommendations from our database.
          Keep your explanations friendly and concise, focusing on why these novels match their preferences.`
        },
        ...messages as ChatMessage[],
      ],
      temperature: 0.7,
    });

    const userPreferences = completion.choices[0].message.content;

    // For now, return the first 3 novels as recommendations
    // TODO: Implement actual recommendation logic based on userPreferences
    const recommendations = novels.slice(0, 3);

    return NextResponse.json({
      explanation: userPreferences,
      recommendations,
      preferences: {}
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({
      explanation: '😅 Oops! Something went wrong. Please try again! 🔄',
      recommendations: [],
      preferences: {}
    }, { status: 500 });
  }
} 