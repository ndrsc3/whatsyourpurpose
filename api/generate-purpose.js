import OpenAI from 'openai';
import { kv } from '@vercel/kv';
import { verifyAccessToken } from '../utils/jwt.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function formatPrompt(userData) {
    return `Based on the following information about a person, generate a clear, inspiring, and actionable purpose statement that reflects their values, strengths, and aspirations:

Core Values: ${userData.values.join(', ')}

Key Strengths: ${userData.strengths.join(', ')}

Personal Reflections:
1. Proudest moment: ${userData.reflectionAnswers[0]}
2. Activities that energize them: ${userData.reflectionAnswers[1]}
3. How they wish to be known: ${userData.reflectionAnswers[2]}
4. Their unique contribution: ${userData.reflectionAnswers[3]}

Human Needs They Want to Address: ${userData.needs.join(', ')}

Generate a purpose statement that:
1. Incorporates their core values and strengths
2. Reflects their personal reflections
3. Addresses the human needs they care about
4. Is specific yet adaptable
5. Is inspiring and actionable

The purpose statement should be 2-3 sentences long and start with "My purpose is to..."`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyAccessToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { userId } = decoded;

        // Get user data from request
        const userData = req.body;
        
        // Validate required data
        if (!userData.values || !userData.strengths || !userData.reflectionAnswers || !userData.needs) {
            return res.status(400).json({ error: 'Missing required user data' });
        }

        // Generate purpose statement
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a purpose coach helping people discover their life purpose. Generate clear, inspiring, and actionable purpose statements."
                },
                {
                    role: "user",
                    content: formatPrompt(userData)
                }
            ],
            max_tokens: 200,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0.3,
            presence_penalty: 0.3
        });

        const purposeStatement = completion.choices[0].message.content;
        
        // Return just the purpose statement as a string
        return res.status(200).json({ 
            purposeStatement: purposeStatement.trim()
        });

    } catch (error) {
        console.error('Purpose Generation Error:', {
            message: error.message,
            stack: error.stack,
            data: error.response?.data
        });
        
        return res.status(500).json({ 
            error: 'Failed to generate purpose statement',
            details: error.message 
        });
    }
} 