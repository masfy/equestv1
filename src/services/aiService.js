export const DEFAULT_AI_MODEL = 'gemini-2.5-flash';

const modelCacheByKey = new Map();

export const sanitizeModelId = (modelId) => {
    if (!modelId || typeof modelId !== 'string') return DEFAULT_AI_MODEL;
    const clean = modelId.trim().replace(/^models\//, '');
    if (!clean) return DEFAULT_AI_MODEL;
    const lower = clean.toLowerCase();
    // Upgrade otomatis model generasi lama yang sudah dihapus dari v1beta Google AI
    if (lower.includes('1.5') || lower.includes('1.0') || lower === 'gemini-pro' || lower === 'gemini-pro-vision') {
        return DEFAULT_AI_MODEL;
    }
    return clean;
};

const loadMammoth = () => {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.mammoth) {
            return resolve(window.mammoth);
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js';
        script.onload = () => resolve(window.mammoth);
        script.onerror = () => reject(new Error('Gagal memuat modul pembaca Word (.docx).'));
        document.head.appendChild(script);
    });
};

// Fallback ekstraktor XML .docx murni di browser jika CDN Mammoth terblokir
const extractDocxXmlFallback = async (arrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    // Cari Local File Header ZIP (0x04034b50) untuk "word/document.xml"
    let offset = 0;
    while (offset + 30 < bytes.length) {
        if (view.getUint32(offset, true) !== 0x04034b50) {
            offset++;
            continue;
        }
        const compression = view.getUint16(offset + 8, true);
        const compressedSize = view.getUint32(offset + 18, true);
        const fileNameLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);
        const nameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLen);
        const fileName = new TextDecoder().decode(nameBytes);
        const dataStart = offset + 30 + fileNameLen + extraLen;

        if (fileName === 'word/document.xml' && compressedSize > 0) {
            const rawSlice = bytes.slice(dataStart, dataStart + compressedSize);
            let xmlText = '';
            if (compression === 0) {
                xmlText = new TextDecoder().decode(rawSlice);
            } else if (compression === 8 && typeof DecompressionStream !== 'undefined') {
                const ds = new DecompressionStream('deflate-raw');
                const writer = ds.writable.getWriter();
                writer.write(rawSlice);
                writer.close();
                const decompressed = await new Response(ds.readable).arrayBuffer();
                xmlText = new TextDecoder().decode(decompressed);
            }
            if (xmlText) {
                return xmlText
                    .replace(/<\/w:p>/g, '\n')
                    .replace(/<\/w:tr>/g, '\n')
                    .replace(/<\/w:tc>/g, ' | ')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
            }
        }
        offset = dataStart + (compressedSize || 1);
    }
    return '';
};

export const extractWordDocumentText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const mammoth = await loadMammoth();
        const rawRes = await mammoth.extractRawText({ arrayBuffer });
        if (rawRes?.value && rawRes.value.trim().length > 10) {
            return rawRes.value.trim();
        }
    } catch (e) {
        console.warn('Mammoth fallback ke XML parser:', e);
    }
    const fallbackText = await extractDocxXmlFallback(arrayBuffer);
    if (fallbackText && fallbackText.length > 10) {
        return fallbackText;
    }
    throw new Error('Tidak dapat membaca isi file Word ini. Pastikan file berformat .docx (Word modern) atau simpan sebagai PDF terlebih dahulu.');
};

export const normalizeExtractedQuestions = (parsedArray) => {
    if (!Array.isArray(parsedArray)) {
        throw new Error('Format hasil AI bukan berupa daftar soal yang valid.');
    }
    return parsedArray
        .filter(m => m && typeof m === 'object')
        .map((m) => {
            let t = String(m.type || m.tipe || 'single').toLowerCase().trim();
            if (t.includes('short') || t.includes('isian')) t = 'short';
            else if (t.includes('essay') || t.includes('uraian')) t = 'essay';
            else if (t.includes('match') || t.includes('jodoh')) t = 'matching';
            else if (t.includes('bool') || t.includes('salah') || t.includes('benar')) t = 'boolean';
            else if (t.includes('multi') || t.includes('kompleks') || t.includes('mcma')) t = 'multiple';
            else t = 'single';

            let opts = Array.isArray(m.options || m.opsi || m.pilihan || m.jawaban_pilihan)
                ? (m.options || m.opsi || m.pilihan || m.jawaban_pilihan).map(o => String(o ?? '').replace(/^[A-Ea-e][\.\)]\s*/, '').trim())
                : [];

            if (t === 'boolean') {
                opts = ['Benar', 'Salah'];
            }

            let corrAns = String(m.correct ?? m.jawaban ?? m.kunci ?? m.kunci_jawaban ?? m.answer ?? '0').trim();

            if (t === 'single') {
                const cleanLetter = corrAns.replace(/^opsi\s+/i, '').replace(/[\.\)]$/, '').trim();
                if (/^[a-eA-E]$/.test(cleanLetter)) {
                    corrAns = String(cleanLetter.toUpperCase().charCodeAt(0) - 65);
                } else if (isNaN(Number(corrAns)) && opts.length > 0) {
                    const foundIdx = opts.findIndex(o => o.toLowerCase() === corrAns.toLowerCase());
                    corrAns = foundIdx >= 0 ? String(foundIdx) : '0';
                }
            } else if (t === 'multiple') {
                const rawList = Array.isArray(m.correct) ? m.correct.join(',') : corrAns;
                corrAns = rawList
                    .split(/[,;/\s]+/)
                    .map(c => {
                        const x = c.replace(/[\.\)]$/, '').trim();
                        if (/^[a-eA-E]$/.test(x)) return String(x.toUpperCase().charCodeAt(0) - 65);
                        if (/^\d+$/.test(x)) return x;
                        return '';
                    })
                    .filter(Boolean)
                    .join(',') || '0';
            } else if (t === 'boolean') {
                const low = corrAns.toLowerCase();
                if (low === '1' || low.includes('salah') || low === 'false' || low === 'b') corrAns = '1';
                else corrAns = '0';
            }

            const txt = String(m.text || m.pertanyaan || m.soal || '').trim();
            const ind = String(m.indicator || m.indikator || '').trim();
            const rawDif = String(m.difficulty || m.kesulitan || m.level || 'MOTS').toUpperCase();
            const dif = rawDif.includes('HOTS') ? 'HOTS' : rawDif.includes('LOTS') ? 'LOTS' : 'MOTS';

            return {
                type: t,
                options: opts,
                correct: corrAns,
                text: txt,
                indicator: ind,
                difficulty: dif,
                weight: Number(m.weight || m.bobot) || 10
            };
        })
        .filter(q => q.text.length > 0);
};

export const parseAiJsonArray = (rawText) => {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error('Respons AI kosong.');
    }
    let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        const direct = JSON.parse(cleaned);
        if (Array.isArray(direct)) return direct;
        if (direct && Array.isArray(direct.questions)) return direct.questions;
        if (direct && Array.isArray(direct.soal)) return direct.soal;
    } catch (_) {
        // Ekstrak blok array [...] jika terdapat teks pembuka/penutup dari AI
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            const sub = cleaned.slice(firstBracket, lastBracket + 1);
            return JSON.parse(sub);
        }
        throw new Error('Gagal mengurai format JSON soal dari AI. Coba ulangi proses ekstraksi.');
    }
    throw new Error('Format soal AI tidak sesuai standar array.');
};

export const aiService = {
    fetchAvailableModels: async (apiKey) => {
        if (!apiKey || !apiKey.trim()) {
            return { success: false, error: 'API Key tidak boleh kosong', models: [] };
        }
        try {
            const key = apiKey.trim();
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            const data = await res.json();

            if (data.error) {
                console.error('List Models Error:', data.error);
                return {
                    success: false,
                    error: data.error.message || 'API Key tidak valid atau kuota habis.',
                    models: []
                };
            }

            if (data.models && Array.isArray(data.models)) {
                const capable = data.models.filter(m => {
                    const id = (m.name || '').toLowerCase();
                    const supportsGen = m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent');
                    // Hanya ambil model teks/multimodal Gemini (hindari model khusus tts, image-generation, embedding, aqa, robotics)
                    const isExcluded = id.includes('tts') || id.includes('imagen') || id.includes('embedding') || id.includes('aqa') || id.includes('veo') || id.includes('bisheng') || id.includes('learnlm') || id.includes('1.5') || id.includes('1.0');
                    return supportsGen && id.includes('gemini') && !isExcluded;
                });

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

                const rankModel = (id) => {
                    const lower = id.toLowerCase();
                    if (lower === 'gemini-2.5-flash') return 1;
                    if (lower === 'gemini-2.0-flash') return 2;
                    if (lower === 'gemini-2.5-flash-lite') return 3;
                    if (lower.startsWith('gemini-2.5-flash') && !lower.includes('image')) return 4;
                    if (lower === 'gemini-2.5-pro') return 5;
                    if (lower.includes('2.5') && lower.includes('flash') && !lower.includes('image')) return 6;
                    if (lower.includes('2.0-flash') && !lower.includes('image')) return 7;
                    if (lower.includes('3') && lower.includes('flash')) return 8;
                    if (lower.includes('pro')) return 9;
                    return 15;
                };

                mapped.sort((a, b) => rankModel(a.id) - rankModel(b.id));
                if (mapped.length > 0) {
                    modelCacheByKey.set(key, mapped);
                }

                return {
                    success: true,
                    models: mapped
                };
            }

            return {
                success: false,
                error: 'Tidak ada model Gemini aktif yang ditemukan untuk API Key ini.',
                models: []
            };
        } catch (e) {
            console.error('Failed to fetch models', e);
            return {
                success: false,
                error: e.message || 'Gagal menghubungi server Google AI.',
                models: []
            };
        }
    },

    getValidModel: async (apiKey, preferredModel = null) => {
        const cleanPref = sanitizeModelId(preferredModel);
        if (!apiKey || !apiKey.trim()) return cleanPref;
        try {
            const key = apiKey.trim();
            let models = modelCacheByKey.get(key);
            if (!models || models.length === 0) {
                const result = await aiService.fetchAvailableModels(key);
                if (result.success && result.models.length > 0) {
                    models = result.models;
                }
            }
            if (models && models.length > 0) {
                if (preferredModel) {
                    const match = models.find(m => m.id === cleanPref);
                    if (match) return match.id;
                }
                return models[0].id;
            }
            return cleanPref;
        } catch (e) {
            return cleanPref;
        }
    },

    // Pemanggil pintar dengan Auto-Discovery Model & Auto-Fallback (Anti Error "model is not found")
    generateContentSmart: async ({ apiKey, preferredModel, contents }) => {
        if (!apiKey || !apiKey.trim()) {
            throw new Error('API Key Gemini belum diatur! Silakan isi API Key di Pengaturan Sekolah atau panel AI.');
        }
        const key = apiKey.trim();
        const initialModel = sanitizeModelId(preferredModel);

        // Susun kandidat model yang akan dicoba secara berurutan jika model pertama tidak tersedia
        let candidateIds = [initialModel];
        const cached = modelCacheByKey.get(key);
        if (cached && cached.length > 0) {
            cached.forEach(m => {
                if (!candidateIds.includes(m.id)) candidateIds.push(m.id);
            });
        } else {
            ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'].forEach(id => {
                if (!candidateIds.includes(id)) candidateIds.push(id);
            });
        }

        const tryGenerate = async (modelId) => {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.35
                    }
                })
            });
            const data = await res.json();
            return { ok: res.ok, status: res.status, data, modelId };
        };

        let lastErrorMsg = 'Gagal menghubungi Google Gemini API.';
        let fetchedLiveModels = Boolean(cached && cached.length > 0);

        for (let i = 0; i < candidateIds.length; i++) {
            const modelId = candidateIds[i];
            const attempt = await tryGenerate(modelId);

            if (attempt.ok && attempt.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return {
                    text: attempt.data.candidates[0].content.parts[0].text,
                    usedModel: modelId
                };
            }

            const errMsg = attempt.data?.error?.message || '';
            lastErrorMsg = errMsg || `Gagal pada model ${modelId}`;
            const errLower = errMsg.toLowerCase();

            // Jika API Key salah / tidak valid, langsung hentikan tanpa mencoba model lain
            if (errLower.includes('api key not valid') || errLower.includes('api_key_invalid')) {
                throw new Error('API Key Gemini tidak valid! Periksa kembali API Key dari Google AI Studio Anda.');
            }

            // Jika model tidak ditemukan (404) atau tidak didukung, panggil ListModels resmi dari Google untuk mencari model yang sah
            const isModelNotFoundOrQuota = attempt.status === 404 || attempt.status === 429 || errLower.includes('not found') || errLower.includes('not supported') || errLower.includes('deprecated');
            if (isModelNotFoundOrQuota && !fetchedLiveModels) {
                fetchedLiveModels = true;
                const discovered = await aiService.fetchAvailableModels(key);
                if (discovered.success && discovered.models.length > 0) {
                    discovered.models.forEach(m => {
                        if (!candidateIds.includes(m.id)) candidateIds.push(m.id);
                    });
                }
            } else if (!isModelNotFoundOrQuota) {
                // Error pada payload (misal file rusak / diblokir safety)
                throw new Error(lastErrorMsg);
            }
        }

        throw new Error(lastErrorMsg);
    },

    buildDocumentImportContents: async (rawFile, promptText) => {
        const fileName = (rawFile?.name || '').toLowerCase();
        const rawMime = (rawFile?.type || '').toLowerCase();

        // 1. File Word (.docx) -> Ekstrak teks murni terlebih dahulu karena Gemini inlineData tidak menerima MIME .docx
        if (fileName.endsWith('.docx') || rawMime.includes('wordprocessingml')) {
            const extractedText = await extractWordDocumentText(rawFile);
            return [{
                parts: [{
                    text: `${promptText}\n\n=== NASKAH DOKUMEN SOAL (.DOCX) ===\n${extractedText}`
                }]
            }];
        }

        // 2. File Word lama (.doc 97-2003)
        if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
            throw new Error('Format Word lama (.doc 97-2003) tidak dapat dibaca langsung. Silakan buka di Microsoft Word lalu pilih "Save As" menjadi ".docx" atau ".pdf" terlebih dahulu.');
        }

        // 3. File Teks / CSV / Markdown
        if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv') || rawMime.startsWith('text/')) {
            const textContent = await rawFile.text();
            return [{
                parts: [{
                    text: `${promptText}\n\n=== NASKAH DOKUMEN SOAL ===\n${textContent}`
                }]
            }];
        }

        // 4. File PDF atau Gambar (PNG/JPG/WEBP) -> Didukung penuh secara native oleh Gemini inlineData
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = String(reader.result || '');
                resolve(res.includes(',') ? res.split(',')[1] : res);
            };
            reader.onerror = () => reject(new Error('Gagal membaca file dokumen dari perangkat.'));
            reader.readAsDataURL(rawFile);
        });

        let mimeType = rawMime;
        if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (fileName.endsWith('.png')) mimeType = 'image/png';
        else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (fileName.endsWith('.webp')) mimeType = 'image/webp';
        else if (!mimeType) mimeType = 'application/pdf';

        return [{
            parts: [
                { text: promptText },
                { inlineData: { mimeType, data: base64Data } }
            ]
        }];
    }
};
