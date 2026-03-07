
import { GoogleGenAI, Type } from "@google/genai";
import { SunoResult, Language, MasterPrompt, RefineResult, RefineTask, ProductionSettings } from "../types";

// The System Prompt provided by the user, adapted for JSON output
const SYSTEM_PROMPT = `
# Role
You are the "Lead Prompt Engineer" specializing in music theory, sound engineering, and Suno AI (V3.5/V4/V5) logic. Your core ability is to analyze music (or descriptions) and deconstruct them into structured instructions that Suno V5 understands perfectly.

# Task
1.  **Deep Analysis**: Analyze Genre, BPM, Key/Scale, Time Signature, Chord Progression, Specific Instruments, Vocal Texture, and Structure.
2.  **Master Prompt**: Generate a prompt to reproduce the original vibe, including specific V5 settings.
3.  **Lyrics Generation**: CRITICAL. You MUST output FULL LYRICS in the 'lyricsAndStructure' field. 
    - If input is Audio: Transcribe the lyrics (or write creative fitting lyrics if it's instrumental/unclear). 
    - If input is Text Description: GENERATE creative, rhyming, complete lyrics that fit the theme and genre.
    - Always use structure tags: [Verse], [Chorus], [Bridge], etc.
    - ENRICH lyrics with Performance Tags like [Whisper], [Belting], [Rap Flow], [Guitar Solo] within the lyrics block.
4.  **Title Generation**: Create a creative title for the song based on its mood/lyrics.
5.  **Variants**: Generate 3 specific variants (Replica, Cover, Evolution).

# Knowledge Base (Suno V5 Rules)
-   **Style Prompts**: English only, comma-separated. Include Genre, Fusion, BPM, Instruments, Vibe, Vocal type. Max ~120 chars.
-   **Structure Tags**: [Intro], [Verse], [Chorus], [Pre-Chorus], [Bridge], [Solo], [Outro], [End].
-   **Weirdness (0-100)**: Controls creativity/chaos. 20-40 is standard pop; 50-70 is artistic; 80+ is experimental.
-   **Style Influence (0-100)**: How strictly to follow the style prompt. 50 is balanced. Higher values ignore lyrics rhythm to follow style more.
-   **Vocal Gender**: Male/Female.

# Output Format
You MUST output strictly in JSON format matching the schema provided. Do not include markdown code blocks.
`;

const REFINE_SYSTEM_PROMPT = `
# Role
You are "Studio B", a specialized AI assistant for Remixing, Localizing, and Producing Suno V5 Prompts.

# Knowledge Base (Production Rack)
When the user provides Production Settings (Mood Color, Foley, Mixing), interpret them as follows:
- **Colors**:
  - Red: Aggressive, High Energy, Passionate, Hot.
  - Blue: Melancholic, Cinematic, Sad, Cold, Spacious.
  - Green: Organic, Folk, Acoustic, Nature, Earthy.
  - Purple: Dreamy, Ethereal, Synthwave, Psychedelic, Mystery.
  - Yellow: Happy, Upbeat, Pop, Bright, Sunny.
  - Zinc/Black: Industrial, Dark, Heavy, Gritty, Lo-fi.
- **Foley**: Add specific sounds like (Rain), (Vinyl Crackle), (City Ambience) to the Style or as tags in Lyrics.
- **Mixing**: Add terms like "Hall Reverb", "Dry Vocals", "Lo-fi Filter" to Style.

# Task Types
1. **General**: Standard chat instruction.
2. **Lyrics Polish**: The user has edited lyrics manually. Your job is to FIX RHYME SCHEMES, METER, and FLOW without changing the meaning. Ensure valid structure tags.
3. **Production Update**: Apply the provided Mood/Foley/Mixing settings to the 'styleDescription' and add relevant Performance Tags (e.g. [Sad Vocal]) to lyrics.

# Output
Return ONLY the updated fields in JSON.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        genre: { type: Type.STRING, description: "Core genres, e.g., J-Pop / Future Bass" },
        elements: { type: Type.STRING, description: "Summary of key vibes and elements" },
        bpm: { type: Type.STRING, description: "BPM value only, e.g., 128" },
        structure: { type: Type.STRING, description: "Brief overview of structure" },
        key: { type: Type.STRING, description: "Musical Key and Scale, e.g., C Minor, F# Major" },
        timeSignature: { type: Type.STRING, description: "Time Signature, e.g., 4/4, 6/8, 12/8" },
        chordProgression: { type: Type.STRING, description: "Common chord progression or harmonic feel, e.g., ii-V-I, Dark Modal" },
        instruments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of distinct instruments identified (e.g. ['Distorted Guitar', '808', 'Violin'])" },
        vocalTexture: { type: Type.STRING, description: "Description of vocal timbre/processing, e.g., Breath, Auto-tuned, Operatic" },
      },
      required: ["genre", "elements", "bpm", "structure", "key", "timeSignature", "chordProgression", "instruments", "vocalTexture"],
    },
    masterPrompt: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative title for this song" },
        styleDescription: { type: Type.STRING, description: "The precise Style Prompt for Suno" },
        lyricsAndStructure: { type: Type.STRING, description: "THE FULL LYRICS content with structure tags like [Verse], [Chorus]. Do NOT just list tags. Write actual lyrics. Ensure each line is separated by a newline character." },
        settings: { type: Type.STRING, description: "Brief text summary of settings" },
        advancedSettings: {
          type: Type.OBJECT,
          properties: {
            lyricsMode: { type: Type.STRING, enum: ["Manual", "Auto"], description: "Manual if lyrics provided, Auto otherwise" },
            vocalGender: { type: Type.STRING, enum: ["Male", "Female", "Both"], description: "Suggested vocal gender" },
            weirdness: { type: Type.INTEGER, description: "Suggested Weirdness percentage (0-100)" },
            styleInfluence: { type: Type.INTEGER, description: "Suggested Style Influence percentage (0-100)" },
          },
          required: ["lyricsMode", "vocalGender", "weirdness", "styleInfluence"],
        },
      },
      required: ["title", "styleDescription", "lyricsAndStructure", "settings", "advancedSettings"],
    },
    variants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of variant (Replica, Cover, or Evolution)" },
          title: { type: Type.STRING, description: "Unique title for this variant" },
          description: { type: Type.STRING, description: "Goal of this variant" },
          styleAdjustment: { type: Type.STRING, description: "The modified Style Prompt" },
          structureChanges: { type: Type.STRING, description: "Any structural changes if applicable" },
          advancedSettings: {
            type: Type.OBJECT,
            properties: {
              lyricsMode: { type: Type.STRING, enum: ["Manual", "Auto"] },
              vocalGender: { type: Type.STRING, enum: ["Male", "Female", "Both"] },
              weirdness: { type: Type.INTEGER },
              styleInfluence: { type: Type.INTEGER },
            },
            required: ["lyricsMode", "vocalGender", "weirdness", "styleInfluence"],
          },
        },
        required: ["name", "title", "description", "styleAdjustment", "advancedSettings"],
      },
    },
  },
  required: ["analysis", "masterPrompt", "variants"],
};

const REFINE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Updated creative title" },
    styleDescription: { type: Type.STRING, description: "Updated Style Prompt adapted for language/genre" },
    lyricsAndStructure: { type: Type.STRING, description: "Rewritten full lyrics with structure tags. Ensure proper rhyming in target language." },
    advancedSettings: {
      type: Type.OBJECT,
      properties: {
        lyricsMode: { type: Type.STRING, enum: ["Manual", "Auto"] },
        vocalGender: { type: Type.STRING, enum: ["Male", "Female", "Both"] },
        weirdness: { type: Type.INTEGER },
        styleInfluence: { type: Type.INTEGER },
      },
      required: ["lyricsMode", "vocalGender", "weirdness", "styleInfluence"],
    },
  },
  required: ["title", "styleDescription", "lyricsAndStructure", "advancedSettings"]
}

// Unsupported URL patterns (paywalled / auth-required services)
const BLOCKED_URL_PATTERNS = [
  { pattern: /spotify\.com/i, name: 'Spotify' },
  { pattern: /music\.apple\.com/i, name: 'Apple Music' },
  { pattern: /tidal\.com/i, name: 'Tidal' },
  { pattern: /deezer\.com/i, name: 'Deezer' },
  { pattern: /music\.amazon/i, name: 'Amazon Music' },
];

const validateMusicUrl = (url: string): void => {
  const blocked = BLOCKED_URL_PATTERNS.find(b => b.pattern.test(url));
  if (blocked) {
    throw new Error(
      `${blocked.name} links are behind a paywall and cannot be analyzed directly. Please use YouTube, SoundCloud, or a direct audio file URL instead.`
    );
  }
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format. Please enter a valid URL.');
  }
};

export const generateSunoPrompt = async (
  apiKey: string,
  input: string | File | { url: string },
  language: Language = 'en'
): Promise<SunoResult> => {
  if (!apiKey) throw new Error("API Key is required");

  // Validate URL before calling API
  if (typeof input === 'object' && 'url' in input) {
    validateMusicUrl(input.url);
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  const langInstruction = language === 'zh'
    ? "Output 'analysis' fields (genre, elements, key, chordProgression, instruments, vocalTexture, structure), 'variants.description', 'variants.structureChanges' and ALL 'title' fields in Simplified Chinese. 'masterPrompt.styleDescription' and 'variants.styleAdjustment' MUST remain in English. Lyrics tags keep English [Verse]. If generating new lyrics, write them in Chinese."
    : "Output all descriptions and analysis in English. If generating new lyrics, write them in English.";

  const parts: any[] = [];

  if (input instanceof File) {
    const base64Data = await fileToBase64(input);
    parts.push({
      inlineData: {
        mimeType: input.type,
        data: base64Data,
      },
    });
    parts.push({
      text: `Analyze this audio file and generate a Suno V5 prompt structure. ${langInstruction}. IMPORTANT: You MUST generate/transcribe FULL LYRICS in the 'lyricsAndStructure' field. Do not leave it empty or just with tags.`
    });
  } else if (typeof input === 'object' && 'url' in input) {
    // URL mode: use fileData with fileUri
    parts.push({
      fileData: {
        fileUri: input.url,
      },
    });
    parts.push({
      text: `Analyze the audio from this URL and generate a Suno V5 prompt structure. ${langInstruction}. IMPORTANT: You MUST generate/transcribe FULL LYRICS in the 'lyricsAndStructure' field. Do not leave it empty or just with tags.`
    });
  } else {
    parts.push({
      text: `Analyze this description/lyrics and generate a Suno V5 prompt structure: "${input}". ${langInstruction}. IMPORTANT: You MUST generate creative FULL LYRICS in the 'lyricsAndStructure' field based on the theme. Do not leave it empty.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: parts,
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.6,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as SunoResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const refineSunoPrompt = async (
  apiKey: string,
  currentPrompt: MasterPrompt,
  instruction: string,
  taskType: RefineTask = 'general',
  productionSettings?: ProductionSettings
): Promise<RefineResult> => {
  if (!apiKey) throw new Error("API Key is required");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  let taskInstruction = "";
  if (taskType === 'lyrics_polish') {
    taskInstruction = "TASK: Polish the lyrics provided below. Fix flow, meter, and rhymes while keeping the original meaning. Ensure valid Suno structure tags.";
  } else if (taskType === 'production_update') {
    taskInstruction = `TASK: Update the vibe based on these production settings: 
        Mood Color: ${productionSettings?.moodColor || 'None'}
        Foley: ${productionSettings?.foley?.join(', ') || 'None'}
        Mixing: ${productionSettings?.mixing || 'None'}
        Interpret these settings into the Style Prompt and add relevant tags to lyrics.`;
  } else {
    taskInstruction = `TASK: Follow User Instruction: "${instruction}"`;
  }

  const userPrompt = `
    CURRENT PROMPT DATA:
    Title: ${currentPrompt.title}
    Style: ${currentPrompt.styleDescription}
    Lyrics: ${currentPrompt.lyricsAndStructure}
    Settings: ${JSON.stringify(currentPrompt.advancedSettings)}

    ${taskInstruction}

    Refine the data above.
    `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{ text: userPrompt }],
      },
      config: {
        systemInstruction: REFINE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: REFINE_SCHEMA,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as RefineResult;
  } catch (error) {
    console.error("Gemini Refine API Error:", error);
    throw error;
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
