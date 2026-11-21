export const aiService = {
    fetchAvailableModels: async (apiKey) => {
        if (!apiKey || !apiKey.trim()) {
            return { success: false, error: "API Key tidak boleh kosong", models: [] };
        }
        try {
            const key = apiKey.trim();
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const data = await res.json();

            if (data.error) {
                console.error("List Models Error:", data.error);
                return {
                    success: false,
                    error: data.error.message || "API Key tidak valid atau kuota habis.",
                    models: []
                };
            }

            if (data.models && Array.isArray(data.models)) {
                // Filter models that support generateContent
                const capable = data.models.filter(m =>
                    m.supportedGenerationMethods &&
                    m.supportedGenerationMethods.includes('generateContent')
                );

                const mapped = capable.map(m => {
                    const cleanId = m.name.replace(/^models\//, '');
                    return {
                        id: cleanId,
                        name: m.displayName || cleanId,
                        description: m.description || '',
                        isFlash: cleanId.toLowerCase().includes('flash'),
                        isPro: cleanId.toLowerCase().includes('pro'),
                    };
                });

                // Priority ranking
                const rankModel = (id) => {
                    const lower = id.toLowerCase();
                    if (lower.includes('2.0-flash')) return 1;
                    if (lower.includes('1.5-flash')) return 2;
                    if (lower.includes('2.5-flash')) return 3;
                    if (lower.includes('2.0-pro')) return 4;
                    if (lower.includes('1.5-pro')) return 5;
                    if (lower.includes('pro')) return 6;
                    return 10;
                };

                mapped.sort((a, b) => rankModel(a.id) - rankModel(b.id));

                return {
                    success: true,
                    models: mapped
                };
            }

            return {
                success: false,
                error: "Tidak ada model yang ditemukan untuk API Key ini.",
                models: []
            };
        } catch (e) {
            console.error("Failed to fetch models", e);
            return {
                success: false,
                error: e.message || "Gagal menghubungi server Google AI.",
                models: []
            };
        }
    },

    getValidModel: async (apiKey, preferredModel = null) => {
        if (!apiKey || !apiKey.trim()) return 'gemini-1.5-flash';
        try {
            const result = await aiService.fetchAvailableModels(apiKey);
            if (result.success && result.models.length > 0) {
                if (preferredModel) {
                    const match = result.models.find(m => m.id === preferredModel);
                    if (match) return match.id;
                }
                return result.models[0].id;
            }
            return preferredModel || 'gemini-1.5-flash';
        } catch (e) {
            console.error("Failed in getValidModel", e);
            return preferredModel || 'gemini-1.5-flash';
        }
    },

    generateQuestions: async (apiKey, config) => {
        const { topic, counts, contextDist, cognitiveDist, model = 'gemini-1.5-flash' } = config;

        // Verify or fallback model dynamically
        const modelName = await aiService.getValidModel(apiKey, model);
        console.log("Using AI Model:", modelName);

        const prompt = `
        You are an expert teacher and exam creator. Create a JSON array of exam questions based on the following strict requirements:

        **Topic**: ${topic}

        **Quantity & Types**:
        - ${counts.mcma || 0} questions of type 'mcma' (Multiple Correct Multiple Answer).
        - ${counts.complex || 0} questions of type 'complex' (True/False statements).
        - ${counts.single || 0} questions of type 'single' (Standard Multiple Choice with 1 correct answer).

        **Context Distribution**:
        - ${contextDist?.math || 50}% Mathematical/Theoretical problems.
        - ${contextDist?.daily || 50}% Daily Life/Real-world application problems.

        **Cognitive Level Distribution**:
        - ${cognitiveDist?.knowledge || 30}% Knowledge & Understanding (C1-C2).
        - ${cognitiveDist?.application || 50}% Application (C3).
        - ${cognitiveDist?.reasoning || 20}% Reasoning/Analysis (C4-C6).

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

            if (data.error) {
                throw new Error(data.error.message || "Terjadi kesalahan pada AI API.");
            }

            if (!data.candidates || data.candidates.length === 0) {
                if (data.promptFeedback && data.promptFeedback.blockReason) {
                    throw new Error(`Konten diblokir: ${data.promptFeedback.blockReason}`);
                }
                throw new Error("Tidak ada respon dari AI. Coba ganti topik atau kurangi jumlah soal.");
            }

            let rawText = data.candidates[0].content.parts[0].text;
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            const questions = JSON.parse(rawText);

            return questions.map(q => ({
                ...q,
                id: Date.now() + Math.random(),
                stimulus: null
            }));

        } catch (error) {
            console.error("AI Generation Error:", error);
            throw error;
        }
    }
};
