import OpenAI from 'openai';
import { kv } from '@vercel/kv';
import { verifyUserToken } from './auth-middleware.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const PROMPT_TEMPLATES = [
    // Original prompt
    (userData) => `Based on the user's self-reflection, generate a purpose statement that embodies their unique strengths, core values, and aspirations. Here are the user's inputs:

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

The purpose statement should be 3 sentences long and start with "My purpose is to...
1. A mission-oriented statement that encapsulates the user's values and strengths.
2. How their unique qualities contribute to the world.
3. A call to action or guiding principle they can live by."`,

    // Story-based prompt
    (userData) => `Imagine you're crafting a hero's journey narrative. The protagonist (the user) has these remarkable qualities:

Their superpowers (strengths): ${userData.strengths.join(', ')}
Their guiding principles (values): ${userData.values.join(', ')}
Their defining moments: ${userData.reflectionAnswers[0]}
What energizes their spirit: ${userData.reflectionAnswers[1]}
Their desired legacy: ${userData.reflectionAnswers[2]}
Their unique gift to the world: ${userData.reflectionAnswers[3]}
The challenges they wish to solve: ${userData.needs.join(', ')}

Write their mission statement in 3 powerful sentences that begin with "My purpose is to..."
1. The hero's mission and what drives them
2. How their unique gifts serve the greater good
3. The daily promise they make to the world`,

    // Impact-focused prompt
    (userData) => `Let's create a purpose statement focused on maximum positive impact. Consider:

Impact Tools (Strengths): ${userData.strengths.join(', ')}
Core Principles (Values): ${userData.values.join(', ')}
Evidence of Impact (Proudest Moment): ${userData.reflectionAnswers[0]}
Energy Source: ${userData.reflectionAnswers[1]}
Desired Impact (Legacy): ${userData.reflectionAnswers[2]}
Unique Contribution: ${userData.reflectionAnswers[3]}
Target Areas for Change: ${userData.needs.join(', ')}

Create a purpose statement in 3 sentences starting with "My purpose is to..."
1. The primary impact you aim to create
2. How your unique combination of strengths and values enables this impact
3. The ripple effect you want your actions to have on the world`
];

function getNextPromptIndex(currentIndex, totalPrompts = PROMPT_TEMPLATES.length) {
    return (currentIndex + 1) % totalPrompts;
}

function formatPrompt(userData) {
    // Get the next prompt index
    const nextIndex = getNextPromptIndex(userData.lastUsedPromptIndex ?? -1);
    
    // Get the prompt template
    const promptTemplate = PROMPT_TEMPLATES[nextIndex];
    
    // Update the last used prompt index
    userData.lastUsedPromptIndex = nextIndex;
    
    // Return the formatted prompt
    return promptTemplate(userData);
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // User data is now available from middleware
        const { userId } = req.user;

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
        
        // Return purpose statement and the prompt index used
        return res.status(200).json({ 
            purposeStatement: purposeStatement.trim(),
            promptIndex: userData.lastUsedPromptIndex
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

// Wrap the handler with the auth middleware
export default verifyUserToken(handler); 