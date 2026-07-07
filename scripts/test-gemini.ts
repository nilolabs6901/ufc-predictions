import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY;
console.log('GOOGLE_AI_API_KEY present:', !!apiKey);
console.log('Key starts with:', apiKey?.substring(0, 10));

if (!apiKey) {
  console.log('No API key found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 100,
      },
    });

    console.log('Calling Gemini 2.5 Flash...');
    const result = await model.generateContent('Say hello in JSON format: {"message": "hello"}');
    console.log('Response:', result.response.text());
    console.log('Success!');
  } catch (error: unknown) {
    console.error('Gemini error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  }
}

test();
