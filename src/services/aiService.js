
export const aiService = {
    getValidModel: async (apiKey) => {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await res.json();

            if (data.error) {
                console.error("List Models Error:", data.error);
                return null;
            }

            if (data.models) {
                // Filter for models that support generateContent
                const capableModels = data.models.filter(m =>
                    m.supportedGenerationMethods &&
                    m.supportedGenerationMethods.includes('generateContent')
                );

                // Priority list
                const priorities = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro'];

                for (const pref of priorities) {
                    const found = capableModels.find(m => m.name.includes(pref));
                    if (found) return found.name.replace('models/', '');
                }

                // Fallback to the first available capable model
                if (capableModels.length > 0) {
                    return capableModels[0].name.replace('models/', '');
                }
            }
            return 'gemini-pro'; // Ultimate fallback
        } catch (e) {
            console.error("Failed to list models", e);
            return 'gemini-pro';
        }
    },

    generateQuestions: async (apiKey, config) => {
        const { topic, counts, contextDist, cognitiveDist } = config;

        // 1. Get a valid model dynamically
        const modelName = await aiService.getValidModel(apiKey);
        if (!modelName) {
            throw new Error("Gagal menemukan model AI yang valid untuk API Key ini. Pastikan API Key benar.");
        }
        console.log("Using AI Model:", modelName);

        const prompt = `
        You are an expert teacher and exam creator. Create a JSON array of exam questions based on the following strict requirements:

        **Topic**: ${topic}

        **Quantity & Types**:
        - ${counts.mcma} questions of type 'mcma' (Multiple Correct Multiple Answer).
        - ${counts.complex} questions of type 'complex' (True/False statements).
        - ${counts.single} questions of type 'single' (Standard Multiple Choice with 1 correct answer).

        **Context Distribution**:
        - ${contextDist.math}% Mathematical/Theoretical problems.
        - ${contextDist.daily}% Daily Life/Real-world application problems.

        **Cognitive Level Distribution**:
        - ${cognitiveDist.knowledge}% Knowledge & Understanding (C1-C2).
        - ${cognitiveDist.application}% Application (C3).
        - ${cognitiveDist.reasoning}% Reasoning/Analysis (C4-C6).

        **Output Format (JSON Array of Objects)**:
        Each object must have:
        - \`text\`: String (The question text).
        - \`type\`: String ('single', 'mcma', or 'complex').
        - \`options\`: 
            - For 'single'/'mcma': Array of 4 strings (A, B, C, D).
            - For 'complex': Array of 4 statements (Strings).
        - \`correct\`:
            - For 'single': Integer (0-3) indicating the index of the correct option.
            - For 'mcma': Array of Integers (e.g., [0, 2]) indicating indices of correct options.
            - For 'complex': Array of Booleans (e.g., [true, false, true, false]) corresponding to the statements.
        - \`tags\`: Array of strings (e.g., ["C3", "Daily Life"]).

        **IMPORTANT**: 
        - Return ONLY the raw JSON array. No markdown formatting, no code blocks, no explanation.
        - Ensure the JSON is valid and parsable.
        - Language: Indonesian (Bahasa Indonesia).
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await response.json();

            console.log("AI API Response:", data); // Debug log

            if (data.error) {
                throw new Error(data.error.message || "Terjadi kesalahan pada AI API.");
            }

            if (!data.candidates || data.candidates.length === 0) {
                // Check if it's a safety block
                if (data.promptFeedback && data.promptFeedback.blockReason) {
                    throw new Error(`Konten diblokir: ${data.promptFeedback.blockReason}`);
                }
                throw new Error("Tidak ada respon dari AI. Coba ganti topik atau kurangi jumlah soal.");
            }

            let rawText = data.candidates[0].content.parts[0].text;

            // Clean up markdown if present
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            const questions = JSON.parse(rawText);

            // Add IDs
            return questions.map(q => ({
                ...q,
                id: Date.now() + Math.random(),
                stimulus: null // AI currently doesn't generate images
            }));

        } catch (error) {
            console.error("AI Generation Error:", error);
            throw error;
        }
    }
};
