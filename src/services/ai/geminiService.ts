import type { SupportedLanguage } from '../../types';

export interface PatientAIContext {
  patientName?: string;
  condition?: string;
  prescribedBy?: string;
  currentExercises?: { name: string; targetAngle: number; reps: number }[];
  recentPainLevel?: number;
  recentAdherence?: number;
  language?: SupportedLanguage | string;
}

export interface ChatMessageHistory {
  role: 'user' | 'model';
  text: string;
}

export const GEMINI_STORAGE_KEY = 'pysiosaathi_gemini_api_key';

class GeminiAIService {
  private activeApiKey: string | null = null;
  private workingModel: string | null = null;
  private lastErrorMessage: string | null = null;
  private candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro',
  ];

  constructor() {
    this.refreshApiKey();
  }

  public refreshApiKey(): string | null {
    // 1. Check runtime localStorage override
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(GEMINI_STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        this.activeApiKey = stored.trim();
        return this.activeApiKey;
      }
    }

    // 2. Check Vite environment variable
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
      this.activeApiKey = envKey.trim();
      return this.activeApiKey;
    }

    this.activeApiKey = null;
    return null;
  }

  public getApiKey(): string | null {
    if (!this.activeApiKey) {
      this.refreshApiKey();
    }
    return this.activeApiKey;
  }

  public setApiKey(key: string): void {
    const cleanKey = key.trim();
    if (typeof window !== 'undefined') {
      if (cleanKey) {
        localStorage.setItem(GEMINI_STORAGE_KEY, cleanKey);
      } else {
        localStorage.removeItem(GEMINI_STORAGE_KEY);
      }
    }
    this.activeApiKey = cleanKey || null;
    this.workingModel = null;
    this.lastErrorMessage = null;
  }

  public hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  public getLastError(): string | null {
    return this.lastErrorMessage;
  }

  public async discoverWorkingModel(key: string): Promise<string | null> {
    if (this.workingModel) return this.workingModel;

    // 1. Probe candidate models directly with a lightweight prompt
    for (const model of this.candidateModels) {
      try {
        const probeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(probeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });

        if (res.ok) {
          this.workingModel = model;
          this.lastErrorMessage = null;
          return model;
        }
      } catch {
        // try next candidate
      }
    }

    // 2. Try querying ListModels endpoint
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
      const res = await fetch(listUrl);
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''));

        const preferred = this.candidateModels.find((cand) => available.includes(cand));
        if (preferred) {
          this.workingModel = preferred;
          this.lastErrorMessage = null;
          return preferred;
        }
        if (available.length > 0) {
          this.workingModel = available[0];
          this.lastErrorMessage = null;
          return available[0];
        }
      }
    } catch {
      // ignore
    }

    return null;
  }

  public async testConnection(candidateKey?: string): Promise<{ success: boolean; message: string; model?: string }> {
    const key = candidateKey?.trim() || this.getApiKey();
    if (!key) {
      return { success: false, message: 'No Gemini API key provided.' };
    }

    const workingModel = await this.discoverWorkingModel(key);
    if (!workingModel) {
      const isLikelyNotStudioKey = !key.startsWith('AIza');
      const hint = isLikelyNotStudioKey
        ? ' Note: Standard Google AI Studio keys typically start with "AIzaSy...". Make sure you create a key at https://aistudio.google.com/app/apikey.'
        : '';
      return {
        success: false,
        message: `Could not verify Gemini model access with this key.${hint}`,
      };
    }

    return {
      success: true,
      message: `Connected successfully to Gemini (${workingModel})!`,
      model: workingModel,
    };
  }

  private buildSystemInstruction(context: PatientAIContext, langName: string): string {
    const patientName = context.patientName || 'Patient';
    const condition = context.condition || 'Post-ACL Reconstruction (Week 6 Rehabilitation)';
    const prescribedBy = context.prescribedBy || 'Dr. Priya Desai, MPT';
    const recentPain = context.recentPainLevel !== undefined ? `${context.recentPainLevel}/10 VAS` : 'Mild (2/10 VAS)';
    const adherence = context.recentAdherence !== undefined ? `${context.recentAdherence}%` : '88%';

    return `You are Pysiosaathi (फिजियोसाथी), an empathetic, professional, evidence-based AI Rehabilitation & Physiotherapy Assistant.
You are interacting with a patient who is practicing clinician-prescribed rehabilitation exercises at home using camera-based movement feedback.

PATIENT CLINICAL CONTEXT:
- Patient Name: ${patientName}
- Rehabilitation Diagnosis: ${condition}
- Prescribing Clinician: ${prescribedBy}
- Recent Pain Level: ${recentPain}
- Exercise Adherence: ${adherence}
- Assigned Protocol: Seated Knee Extension (Target: 165° Extension) and Standing Shoulder Abduction (Target: 90° Abduction)

STRICT CLINICAL SAFETY RULES:
1. EMERGENCY SYMPTOMS: If the patient reports acute red-flag medical emergencies (e.g., severe chest pain, difficulty breathing, blackout/fainting, sudden numbness/paralysis, loss of bowel or bladder control, suspected blood clots), IMMEDIATELY tell them to call Emergency Services (112 in India) or visit the nearest emergency room.
2. NO MEDICAL DIAGNOSIS: Do not fabricate new diagnoses or speculate on tissue pathology. Always reinforce that you assist with rehabilitation education, proper movement pacing, and clinician-prescribed adherence.
3. PRESCRIBED TARGETS: Never tell a patient to exceed or alter their clinician's prescribed range of motion or repetition targets without consulting ${prescribedBy}.
4. PAIN MANAGEMENT: Never instruct a patient to push through sharp, catching, or stabbing joint pain. Teach the difference between normal mild muscle fatigue versus joint pain that requires stopping.
5. RECOVERY HYGIENE: Offer safe, practical self-care advice: appropriate ice application (15-20 min with a barrier for acute warmth/swelling within 24-48 hrs), warm compress for tight muscles prior to stretching, gentle elevation, adequate hydration, and recording sensations in their post-session recovery check-in.
6. TONE & FORMAT: Be warm, respectful, concise, and reassuring. Structure your answers with clear bullet points or short paragraphs for easy reading on mobile devices.
7. LANGUAGE REQUIREMENT: You MUST formulate your entire response naturally and accurately in ${langName}. Use culturally appropriate, accessible phrasing.`;
  }

  public async generateResponse(
    history: ChatMessageHistory[],
    userMessage: string,
    context: PatientAIContext,
    targetLanguage: SupportedLanguage | string = 'en'
  ): Promise<string> {
    const apiKey = this.getApiKey();

    const langMap: Record<string, string> = {
      en: 'English (Indian healthcare context)',
      hi: 'Hindi (हिंदी)',
      kn: 'Kannada (ಕನ್ನಡ)',
      te: 'Telugu (తెలుగు)',
      bn: 'Bengali (বাংলা)',
    };
    const langKey = (targetLanguage || 'en').split('-')[0];
    const languageName = langMap[langKey] || 'English';

    // If no API key configured, use intelligent clinical fallback
    if (!apiKey) {
      return this.getLocalClinicalFallback(userMessage, targetLanguage, context);
    }

    try {
      const model = await this.discoverWorkingModel(apiKey);
      if (!model) {
        this.lastErrorMessage = 'Gemini API models not accessible with current key';
        return this.getLocalClinicalFallback(userMessage, targetLanguage, context);
      }

      const systemInstruction = this.buildSystemInstruction(context, languageName);

      // Build Gemini contents array
      const contents = [];

      // Add relevant previous messages (up to last 6 for context continuity)
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.35,
            topP: 0.9,
            maxOutputTokens: 850,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `Gemini API returned status ${res.status}`;
        console.warn('Gemini API call failed:', errorMsg);
        this.lastErrorMessage = errorMsg;

        // Clean medical fallback WITHOUT leaking internal technical errors into user chat
        return this.getLocalClinicalFallback(userMessage, targetLanguage, context);
      }

      this.lastErrorMessage = null;
      const data = await res.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        return this.getLocalClinicalFallback(userMessage, targetLanguage, context);
      }

      return generatedText.trim();
    } catch (err: unknown) {
      console.error('Error invoking Gemini API:', err);
      this.lastErrorMessage = err instanceof Error ? err.message : 'Network error';
      return this.getLocalClinicalFallback(userMessage, targetLanguage, context);
    }
  }

  public getLocalClinicalFallback(
    userText: string,
    lang: SupportedLanguage | string,
    context: PatientAIContext
  ): string {
    const lower = userText.toLowerCase().trim();
    const l = (lang || 'en').split('-')[0];
    const name = context.patientName ? ` ${context.patientName}` : '';
    const doctor = context.prescribedBy || 'your physiotherapist';

    // 1. Greetings & Salutations (e.g. "hi", "hello", "hey", "namaste")
    const isGreeting =
      /^(hi|hello|hey|heya|howdy|good\s*(morning|afternoon|evening)|sup|greetings)\b/i.test(lower) ||
      ['नमस्ते', 'हलो', 'ಹಲೋ', 'ನಮಸ್ಕಾರ', 'హలో', 'నమస్కారం', 'নমস্কার', 'হ্যালো'].some((g) => lower.includes(g));

    if (isGreeting) {
      switch (l) {
        case 'hi':
          return `नमस्ते${name}! मैं आपका फिजियोसाथी (Pysiosaathi) AI पुनर्वास सहायक हूँ। मैं आपके निर्धारित व्यायाम, जोड़ों की गतिशीलता, बर्फ/गर्मी के उपयोग और रिकवरी से जुड़े प्रश्नों में सहायता कर सकता हूँ। आज मैं आपकी क्या मदद करूँ?`;
        case 'kn':
          return `ನಮಸ್ಕಾರ${name}! ನಾನು ನಿಮ್ಮ ಫಿಸಿಯೋಸಾಥಿ (Pysiosaathi) ಪುನರ್ವಸತಿ ಸಹಾಯಕ. ನಿಮ್ಮ ವ್ಯಾಯಾಮಗಳು, ವಿಶ್ರಾಂತಿ, ನೋವು ನಿರ್ವಹಣೆ ಮತ್ತು ಚೇತರಿಕೆಯ ಕುರಿತು ಮಾರ್ಗದರ್ಶನ ನೀಡಬಲ್ಲೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`;
        case 'te':
          return `నమస్కారం${name}! నేను మీ ఫిజియోసాథి (Pysiosaathi) పునరావాస సహాయకుడిని. మీ వ్యాయామాలు, ఐసింగ్ విధానాలు మరియు రికవరీ సంబంధిత ప్రశ్నలకు సహాయం చేయగలను. ఈరోజు మీకు ఎలా సహాయపడగలను?`;
        case 'bn':
          return `নমস্কার${name}! আমি আপনার ফিজিওসাথী (Pysiosaathi) পুনর্বাসন সহকারী। আমি আপনার ব্যায়াম, জয়েন্টের সচলতা এবং রিকভারি নির্দেশিকা সংক্রান্ত যেকোনো প্রশ্নের উত্তর দিতে পারি। আজ আপনাকে কীভাবে সাহায্য করতে পারি?`;
        default:
          return `Hello${name}! I am your Pysiosaathi Rehabilitation Assistant. I'm here to support your recovery for ${context.condition || 'your rehabilitation journey'}. I can answer questions about your prescribed movements, safe repetition pacing, icing vs heat protocols, and joint recovery hygiene. How can I assist you today?`;
      }
    }

    // 2. Ice / Cold Therapy vs Heat
    if (
      lower.includes('ice') ||
      lower.includes('heat') ||
      lower.includes('cold') ||
      lower.includes('बर्फ') ||
      lower.includes('मంచు') ||
      lower.includes('ಹಿಮ') ||
      lower.includes('বরফ')
    ) {
      switch (l) {
        case 'hi':
          return 'बर्फ (Cold compress) का उपयोग व्यायाम के बाद की सूजन, जलन या तीखे दर्द के लिए पहले 24-48 घंटों में 15-20 मिनट के लिए करें। हमेशा बर्फ और त्वचा के बीच पतला कपड़ा रखें। हल्की गर्माहट (Heat) केवल स्ट्रेचिंग से पहले मांसपेशियों को ढीला करने के लिए उपयुक्त होती है।';
        case 'kn':
          return 'ವ್ಯಾಯಾಮದ ನಂತರ ಬಿಸಿ ಅಥವಾ ಊತವಿದ್ದರೆ 15-20 ನಿಮಿಷಗಳ ಕಾಲ ಐಸ್ ಪ್ಯಾಕ್ (ಹಿಮ) ಹಚ್ಚಿ. ಐಸ್ ಮತ್ತು ಚರ್ಮದ ನಡುವೆ ಬಟ್ಟೆ ಇರಲಿ. ಸ್ನಾಯು ಬಿಗಿತ ಸಡಿಲಗೊಳಿಸಲು ವ್ಯಾಯಾಮಕ್ಕೂ ಮುನ್ನ ಬೆಚ್ಚಗಿನ ಶಾಖ ನೀಡಬಹುದು.';
        case 'te':
          return 'వ్యాయామం తర్వాత వాపు లేదా తీవ్రమైన నొప్పి ఉన్నప్పుడు 15-20 నిమిషాలు ఐస్ ప్యాక్ ఉపయోగించండి. చర్మంపై నేరుగా ఐస్ పెట్టకుండా ఒక వస్త్రం ఉంచండి. కండరాల దృఢత్వాన్ని తగ్గించడానికి సాగదీయడానికి ముందు తేలికపాటి వేడి మంచిది.';
        case 'bn':
          return 'ব্যায়ামের পর প্রদাহ, ফোলা বা ব্যথার জন্য ১৫-২০ মিনিট বরফের সেঁক দেওয়া ভালো। বরফ এবং ত্বকের মাঝে সুতির কাপড় রাখবেন। স্ট্রেচিংয়ের আগে পেশি শিথিল করতে হালকা গরম সেঁক দেওয়া যেতে পারে।';
        default:
          return 'Cold therapy (ice) is recommended for acute post-exercise swelling or localized heat within the first 24–48 hours for 15–20 minutes with a cloth barrier. Moist heat is best reserved for tight, non-inflamed muscles prior to gentle range-of-motion work.';
      }
    }

    // 3. Repetitions / Sets / Movement Targets
    if (
      lower.includes('rep') ||
      lower.includes('set') ||
      lower.includes('count') ||
      lower.includes('target') ||
      lower.includes('गिनती') ||
      lower.includes('ಸಂಖ್ಯೆ') ||
      lower.includes('పునరావృతం') ||
      lower.includes('পুনরাবৃত্তি')
    ) {
      switch (l) {
        case 'hi':
          return `पुनर्वास में व्यायाम की गुणवत्ता और सही कोण (Range of Motion) दोहराव की संख्या से अधिक महत्वपूर्ण है। आपके डॉक्टर द्वारा 10 दोहराव प्रति सेट (लक्ष्य 165° विस्तार) निर्धारित हैं। यदि तीखा दर्द महसूस हो, तो तुरंत रुकें।`;
        case 'kn':
          return `ವ್ಯಾಯಾಮದ ನಿಖರತೆ ಪುನರಾವರ್ತನೆಗಳ ಸಂಖ್ಯೆಗಿಂತ ಮುಖ್ಯ. ನಿಮ್ಮ ಚಿಕಿತ್ಸಕರು ಸೂಚಿಸಿದ ಗುರಿಯನ್ನು ನಿಧಾನವಾಗಿ ತಲುಪಿ. ಚೂಪಾದ ನೋವು ಬಂದರೆ ತಕ್ಷಣ ನಿಲ್ಲಿಸಿ ನಿಮ್ಮ ರಿಕವರಿ ಚೆಕ್-ಇನ್‌ನಲ್ಲಿ ದಾಖಲಿಸಿ.`;
        case 'te':
          return `పునరావాసంలో కదలిక యొక్క నాణ్యత పునరావృతాల సంఖ్య కంటే చాలా ముఖ్యం. మీ డాక్టర్ సూచించిన 165° కోణాన్ని సరిగ్గా సాధించడానికి ప్రయత్నించండి. పదునైన నొప్పి వస్తే వెంటనే ఆపండి.`;
        case 'bn':
          return `ব্যায়ামে পুনরাবৃত্তির সংখ্যার চেয়ে সঠিক অঙ্গবিন্যাস ও নিয়ন্ত্রিত গতি বেশি গুরুত্বপূর্ণ। ধারালো ব্যথা অনুভব করলে অবিলম্বে থেমে যান এবং রিকভারি লগে লিপিবদ্ধ করুন।`;
        default:
          return `Movement quality and joint biomechanics are far more critical than raw repetition counts. For ${context.condition || 'your recovery'}, aim for smooth, controlled movement up to your clinician's prescribed target (165° for Knee Extension). If sharp pain occurs, pause and log it in your recovery check-in.`;
      }
    }

    // 4. Pain, Soreness, or Swelling
    if (
      lower.includes('pain') ||
      lower.includes('sore') ||
      lower.includes('hurt') ||
      lower.includes('swell') ||
      lower.includes('दर्द') ||
      lower.includes('ನೋವು') ||
      lower.includes('నొప్పి') ||
      lower.includes('ব্যথা')
    ) {
      switch (l) {
        case 'hi':
          return `व्यायाम के बाद हल्की मांसपेशियों की थकान सामान्य है (1-3/10 VAS)। यदि आपको जोड़ों में तेज या तीखा दर्द महसूस हो, तो तुरंत व्यायाम रोकें। जोड़ को ऊपर उठाएं, 15 मिनट बर्फ लगाएं। यदि दर्द 48 घंटों से अधिक बना रहे, तो अपने डॉक्टर (${doctor}) से संपर्क करें।`;
        case 'kn':
          return `ಸ್ನಾಯುಗಳಲ್ಲಿನ ಸೌಮ್ಯ ಆಯಾಸ ಸಾಮಾನ್ಯ. ಆದರೆ ಕೀಲುಗಳಲ್ಲಿ ತೀಕ್ಷ್ಣ ನೋವು ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ವ್ಯಾಯಾಮ ನಿಲ್ಲಿಸಿ. 15 ನಿಮಿಷ ಐಸ್ ಹಚ್ಚಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ. ನೋವು ಮುಂದುವರಿದರೆ ನಿಮ್ಮ ವೈದ್ಯರನ್ನು (${doctor}) ಸಂಪರ್ಕಿಸಿ.`;
        case 'te':
          return `వ్యాయామం తర్వాత స్వల్ప కండరాల అలసట సహజం. అయితే కీళ్లలో పదునైన నొప్పి వస్తే వెంటనే ఆపండి. 15 నిమిషాలు ఐస్ ప్యాక్ ఉంచి విశ్రాంతి తీసుకోండి. నొప్పి తగ్గకపోతే మీ ఫిజియోథెరపిస్ట్ (${doctor})ను సంప్రదించండి.`;
        case 'bn':
          return `ব্যায়ামের পর হালকা পেশির ক্লান্তি স্বাভাবিক। তবে হাঁটু বা সন্ধিস্থলে তীব্র ব্যথা হলে সাথে সাথে ব্যায়াম বন্ধ করুন। ১৫ মিনিট বরফের সেঁক দিন। ব্যথা স্থায়ী হলে আপনার চিকিৎসকের (${doctor}) পরামর্শ নিন।`;
        default:
          return `Mild muscle fatigue (1–3/10 VAS) is a normal part of tissue adaptation. However, sharp, catching, or stabbing joint pain is a signal to stop immediately. Elevate the limb, apply ice for 15 minutes, and record this in your Recovery Check-in. If discomfort persists beyond 48 hours, notify ${doctor}.`;
      }
    }

    // 5. General Fallback
    switch (l) {
      case 'hi':
        return `व्यायाम के बाद जोड़ को थोड़ा ऊंचा (elevate) रखें, आवश्यकतानुसार 15 मिनट ठंडा सेक लगाएं और पर्याप्त पानी पिएं। अपने निर्धारित सत्र पूरे करने के बाद रिकवरी चेक-इन जरूर दर्ज करें। यदि कोई विशेष परेशानी हो, तो अपने फिजियोथेरेपिस्ट (${doctor}) से परामर्श करें।`;
      case 'kn':
        return `ವ್ಯಾಯಾಮದ ನಂತರ ಲಘು ವಿಶ್ರಾಂತಿ ನೀಡಿ. ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ದಿನದ ವ್ಯಾಯಾಮ ಮುಗಿದ ನಂತರ ರಿಕವರಿ ಚೆಕ್-ಇನ್ ದಾಖಲಿಸಿ. ಸಂದೇಹಗಳಿದ್ದರೆ ನಿಮ್ಮ ಚಿಕಿತ್ಸಕರನ್ನು (${doctor}) ಸಂಪರ್ಕಿಸಿ.`;
      case 'te':
        return `వ్యాయామం తర్వాత కాసేపు విశ్రాంతి తీసుకోండి, తగినంత నీరు త్రాగండి మరియు మీ రికవరీ చెక్-ఇన్‌ను పూర్తి చేయండి. ఏవైనా సమస్యలుంటే మీ ఫిజియోథెరపిస్ట్ (${doctor})ను సంప్రదించండి.`;
      case 'bn':
        return `ব্যায়ামের পর আক্রান্ত অংশটি বিশ্রামে রাখুন এবং পর্যাপ্ত পানি পান করুন। সেশন শেষ হলে রিকভারি চেক-ইন পূরণ করুন। কোনো অসুবিধা হলে আপনার ফিজিওথেরাপিস্টের (${doctor}) পরামর্শ নিন।`;
      default:
        return `For standard rehabilitation recovery, ensure proper hydration, gentle limb elevation, and resting the joint after each session. Always listen to your body and complete your daily Recovery Check-in. If discomfort persists or you experience sharp pain, please notify ${doctor}.`;
    }
  }
}

export const geminiService = new GeminiAIService();
