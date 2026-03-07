
export enum InputMode {
  AUDIO = 'AUDIO',
  URL = 'URL',
  TEXT = 'TEXT'
}

export type Language = 'en' | 'zh';
export type Theme = 'dark' | 'eye-care' | 'ivory';

export interface AnalysisReport {
  genre: string;
  elements: string; // Summary of elements
  bpm: string;
  structure: string;
  // New Professional Fields
  key: string; // e.g., C Minor
  timeSignature: string; // e.g., 4/4
  chordProgression: string; // e.g., ii-V-I
  instruments: string[]; // List of specific instruments
  vocalTexture: string; // e.g., Reverb-heavy, Auto-tuned
}

export interface AdvancedSettings {
  lyricsMode: "Manual" | "Auto";
  vocalGender: "Male" | "Female" | "Both";
  weirdness: number; // 0-100
  styleInfluence: number; // 0-100
}

export interface MasterPrompt {
  title: string;
  styleDescription: string;
  lyricsAndStructure: string;
  settings: string; // Legacy text summary
  advancedSettings: AdvancedSettings;
}

export interface Variant {
  name: string;
  title: string;
  description: string;
  styleAdjustment: string;
  structureChanges?: string;
  advancedSettings: AdvancedSettings;
}

export interface SunoResult {
  analysis: AnalysisReport;
  masterPrompt: MasterPrompt;
  variants: Variant[];
}

export interface RefineResult {
  title: string;
  styleDescription: string;
  lyricsAndStructure: string;
  advancedSettings: AdvancedSettings;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputMode: InputMode;
  inputSummary: string; // Truncated text or "Audio File"
  result: SunoResult;
}

export interface MessageState {
  role: 'user' | 'model' | 'system';
  content: string;
  isLoading?: boolean;
  result?: SunoResult;
}

// --- Remix Studio Types ---

export type RefineTask = 'general' | 'lyrics_polish' | 'production_update';

export interface ProductionSettings {
  moodColor?: string; // hex
  foley?: string[]; // e.g. ['rain', 'vinyl']
  mixing?: string; // e.g. 'hall'
}

export interface LyricsVersion {
  content: string;
  timestamp: number;
  note?: string;
}
