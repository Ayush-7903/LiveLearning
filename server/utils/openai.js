const { CohereClient } = require('cohere-ai');

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Improved JSON extraction and parsing
const parseJSONResponse = (text) => {
  try {
    // First, try parsing the entire response as JSON
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to extract JSON from the response
    console.log('Initial parse failed, attempting extraction...');
  }

  // Try different extraction methods
  const extractionMethods = [
    // Method 1: Look for JSON code blocks
    (text) => {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      return match ? match[1] : null;
    },
    
    // Method 2: Find the main JSON object
    (text) => {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      return (start !== -1 && end !== -1 && end > start) ? text.slice(start, end + 1) : null;
    },
    
    // Method 3: Look for JSON between specific markers
    (text) => {
      const patterns = [
        /JSON:\s*(\{[\s\S]*\})/,
        /Response:\s*(\{[\s\S]*\})/,
        /Output:\s*(\{[\s\S]*\})/
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  ];

  for (const method of extractionMethods) {
    const extracted = method(text);
    if (extracted) {
      try {
        // Clean the extracted JSON
        let cleaned = extracted
          .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Smart quotes to regular quotes
          .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Smart single quotes
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":') // Quote unquoted keys
          .replace(/:\s*'([^']*?)'/g, ': "$1"') // Convert single quotes to double quotes for values
          .trim();

        // Validate basic structure
        if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
          continue;
        }

        const parsed = JSON.parse(cleaned);
        console.log('Successfully extracted and parsed JSON');
        return parsed;
      } catch (parseError) {
        console.log(`Parsing attempt failed: ${parseError.message}`);
        continue;
      }
    }
  }

  throw new Error('Could not extract valid JSON from response');
};

// Validate and fix roadmap structure
const validateAndFixRoadmap = (roadmap, topic, level) => {
  // Ensure basic structure exists
  const validatedRoadmap = {
    title: roadmap?.title || `${topic} Learning Path`,
    description: roadmap?.description || `A structured approach to mastering ${topic} at ${level} level`,
    estimatedDuration: roadmap?.estimatedDuration || '4-6 weeks',
    steps: [],
    tags: Array.isArray(roadmap?.tags) ? roadmap.tags : [topic.toLowerCase(), level, 'learning', 'skills']
  };

  // Validate and fix steps
  if (roadmap?.steps && Array.isArray(roadmap.steps)) {
    roadmap.steps.forEach((step, index) => {
      if (step && typeof step === 'object') {
        const validatedStep = {
          title: step.title || `Step ${index + 1}`,
          description: step.description || `Learning step ${index + 1} for ${topic}`,
          resources: Array.isArray(step.resources) && step.resources.length > 0 
            ? step.resources 
            : ['Official documentation', 'Online tutorials'],
          estimatedTime: step.estimatedTime || '1 week'
        };
        validatedRoadmap.steps.push(validatedStep);
      }
    });
  }

  // Ensure minimum number of steps
  if (validatedRoadmap.steps.length < 5) {
    const defaultSteps = [
      {
        title: 'Foundation and Basics',
        description: `Learn the fundamental concepts of ${topic}`,
        resources: ['Official documentation', 'Introductory tutorials'],
        estimatedTime: '1 week',
      },
      {
        title: 'Core Concepts',
        description: `Dive deeper into the main principles of ${topic}`,
        resources: ['In-depth guides', 'Video courses'],
        estimatedTime: '1-2 weeks',
      },
      {
        title: 'Practical Application',
        description: `Apply your knowledge through hands-on projects`,
        resources: ['Project ideas', 'Code examples'],
        estimatedTime: '1-2 weeks',
      },
      {
        title: 'Advanced Topics',
        description: `Explore advanced concepts and best practices`,
        resources: ['Advanced guides', 'Expert articles'],
        estimatedTime: '1 week',
      },
      {
        title: 'Mastery and Practice',
        description: `Reinforce learning through continued practice`,
        resources: ['Practice problems', 'Community forums'],
        estimatedTime: 'Ongoing',
      },
    ];

    // Fill missing steps with defaults
    while (validatedRoadmap.steps.length < 5) {
      const defaultStep = defaultSteps[validatedRoadmap.steps.length];
      if (defaultStep) {
        validatedRoadmap.steps.push(defaultStep);
      }
    }
  }

  return validatedRoadmap;
};

// Validate and fix quiz structure
const validateAndFixQuiz = (quiz, topic, difficulty) => {
  const validatedQuiz = {
    topic: quiz?.topic || topic,
    difficulty: quiz?.difficulty || difficulty,
    questions: []
  };

  if (quiz?.questions && Array.isArray(quiz.questions)) {
    quiz.questions.forEach((question, index) => {
      if (question && typeof question === 'object') {
        const validatedQuestion = {
          question: question.question || `Question ${index + 1} about ${topic}`,
          options: Array.isArray(question.options) && question.options.length === 4 
            ? question.options 
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: typeof question.correctAnswer === 'number' && 
                        question.correctAnswer >= 0 && 
                        question.correctAnswer <= 3 
            ? question.correctAnswer 
            : 0,
          explanation: question.explanation || 'This is the correct answer based on the topic concepts.'
        };
        validatedQuiz.questions.push(validatedQuestion);
      }
    });
  }

  // Ensure at least one question
  if (validatedQuiz.questions.length === 0) {
    validatedQuiz.questions.push({
      question: `What is a key concept in ${topic}?`,
      options: ['Concept A', 'Concept B', 'Concept C', 'Option D'],
      correctAnswer: 0,
      explanation: 'This is a fundamental concept in the field.',
    });
  }

  return validatedQuiz;
};

// Reusable content generator for structured JSON output
const generateStructuredJSON = async (prompt, max_tokens = 2000) => {
  try {
    const response = await cohere.chat({
      model: 'command-r-plus',
      message: prompt,
      temperature: 0.3, // Even lower temperature for more consistent JSON
      maxTokens: max_tokens,
    });

    const text = response.text;
    console.log('Raw Cohere response length:', text.length);
    
    return parseJSONResponse(text);
  } catch (error) {
    console.error('Cohere API or parsing error:', error);
    throw error;
  }
};

const generateRoadmap = async (topic, level, userProfile = null) => {
  try {
    const profileContext = userProfile ? `
    User Profile:
    - Learning style: ${userProfile.learningStyle?.join(', ') || 'Not specified'}
    - Skill level: ${userProfile.skillLevel || level}
    - Study goals: ${userProfile.studyGoals || 'Not specified'}
    - Preferred topics: ${userProfile.preferredTopics?.join(', ') || 'Not specified'}
    ` : '';

    const prompt = `Create a learning roadmap for "${topic}" at ${level} level.

Return only a JSON object with this exact structure:
{
  "title": "Learning roadmap title",
  "description": "What the learner will achieve",
  "estimatedDuration": "6-8 weeks",
  "steps": [
    {
      "title": "Step name",
      "description": "What to learn and how",
      "resources": ["Resource 1", "Resource 2", "Resource 3"], // <-- Study materials
      "estimatedTime": "1-2 weeks"
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Requirements:
- Exactly 5-7 steps
- Each step must have title, description, resources array, and estimatedTime
- Include practical projects and hands-on exercises
- Provide specific, actionable resources (links, book titles, video courses, etc.)
- No text outside the JSON object`;

    const aiResponse = await generateStructuredJSON(prompt);
    return validateAndFixRoadmap(aiResponse, topic, level);
   console.log('✅ Raw AI roadmap response from Cohere:', JSON.stringify(aiResponse, null, 2));
  } catch (error) {
    console.error('Cohere roadmap generation error:', error);
    // Return a fully validated fallback roadmap
    return validateAndFixRoadmap({}, topic, level);
  }
};

const generateQuiz = async (topic, difficulty = 'medium', questionCount = 5, userProfile = null) => {
  try {
    const profileContext = userProfile ? `
    User Profile:
    - Learning style: ${userProfile.learningStyle?.join(', ') || 'balanced'}
    - Skill level: ${userProfile.skillLevel || 'intermediate'}
    ` : '';

    const prompt = `Create a ${difficulty} level quiz about "${topic}" with ${questionCount} questions.

${profileContext}

Return only a JSON object with this exact structure:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

Requirements:
- Each question must have question, options (4 items), correctAnswer (0-3), explanation
- Mix conceptual, practical, and scenario-based questions
- No text outside the JSON object`;

    const aiResponse = await generateStructuredJSON(prompt, 1500);
    return validateAndFixQuiz(aiResponse, topic, difficulty);
  } catch (error) {
    console.error('Cohere quiz generation error:', error);
    return validateAndFixQuiz({}, topic, difficulty);
  }
};

const explainAnswer = async (question, options, correctAnswer, userAnswer) => {
  try {
    const prompt = `A student answered incorrectly:

Question: ${question}
Options: ${options.map((o, i) => `${i + 1}. ${o}`).join(', ')}
Correct: ${correctAnswer + 1}. ${options[correctAnswer]}
Student chose: ${userAnswer + 1}. ${options[userAnswer]}

Provide a helpful explanation covering:
1. Why the correct answer is right
2. Why their answer was incorrect
3. A learning tip
4. How to avoid this mistake

Keep it encouraging and educational.`;

    const response = await cohere.chat({
      model: 'command-r-plus',
      message: prompt,
      temperature: 0.7,
      maxTokens: 600,
    });

    return response.text;
  } catch (error) {
    console.error('Cohere explanation error:', error);
    return 'Sorry, I couldn\'t generate the explanation right now. Please review the concepts again.';
  }
};

const questionObj = {
  question: "What is supervised learning?",
  options: ["A", "B", "C", "D"],
  correctAnswer: 0
}


module.exports = {
  generateRoadmap,
  generateQuiz,
  explainAnswer,
};