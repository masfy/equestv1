const API_URL = "https://script.google.com/macros/s/AKfycbxUl-uqFXvRpT0fNdB-foynLH-d4KjodsDsN1Th1iK8tLOEnZ927dVlXVWIDVtYEhJpTA/exec";

export const api = {
    // --- GET ---
    getAllData: async () => {
        try {
            const res = await fetch(`${API_URL}?action=getAllData`);
            const json = await res.json();
            if (json.status === 'success') return json.data;
            throw new Error(json.message || 'Failed to fetch data');
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    // --- POST (Generic) ---
    send: async (action, payload) => {
        try {
            console.log(`[API] Sending ${action}:`, payload);
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // GAS requirement
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            });
            console.log(`[API] Sent ${action} successfully (no-cors)`);
            return true;
        } catch (error) {
            console.error("API Send Error:", error);
            return false;
        }
    },

    // --- SPECIFIC ACTIONS ---
    saveSchool: (data) => api.send('saveSchool', data),

    saveStudent: (data) => api.send('saveStudent', data),
    deleteStudent: (id) => api.send('deleteStudent', { id }),

    saveClass: (data) => api.send('saveClass', data),
    deleteClass: (id) => api.send('deleteClass', { id }),

    saveSubject: (data) => api.send('saveSubject', data),
    deleteSubject: (id) => api.send('deleteSubject', { id }),

    saveQuestion: (data) => api.send('saveQuestion', data),
    saveQuestions: async (questions) => {
        // Use batch saving for efficiency
        return await api.send('saveQuestionsBatch', questions);
    },

    updateStudentStatus: async (token, nis, name, status) => {
        return await api.send('updateStudentStatus', {
            token,
            nis,
            name,
            status,
            timestamp: new Date().toISOString()
        });
    },

    getExamStatus: async () => {
        try {
            const response = await fetch(`${API_URL}?action=getExamStatus`);
            const json = await response.json();
            return json.status === 'success' ? json.data : null;
        } catch (e) {
            console.error("Error fetching exam status:", e);
            return null;
        }
    },
    getExamSessions: async (token) => {
        try {
            // Use GET for fetching sessions to bypass CORS opacity issues with POST
            const response = await fetch(`${API_URL}?action=getExamSessions&token=${token}`);
            const json = await response.json();
            return json.status === 'success' ? json.data : [];
        } catch (e) {
            console.error("Error fetching sessions:", e);
            return [];
        }
    },

    deleteQuestion: (id) => api.send('deleteQuestion', { id }),

    activateExam: (data) => api.send('activateExam', data),
    deactivateExam: () => api.send('deactivateExam', {}),

    submitExam: (data) => api.send('submitExam', data),
};
