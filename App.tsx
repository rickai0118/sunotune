
import React, { useState, useEffect } from 'react';
import { InputMode, SunoResult, Language, Theme, MasterPrompt, HistoryItem } from './types';
import { generateSunoPrompt } from './services/geminiService';
import { saveToHistory } from './services/historyService';
import ResultCard from './components/ResultCard';
import AudioPlayer from './components/AudioPlayer';
import RemixStudio from './components/RemixStudio';
import HistoryDrawer from './components/HistoryDrawer';
import { Mic, Type, Upload, AlertCircle, Loader2, Music4, Globe, Sparkles, Command, Monitor, Minus, Plus, Library, Eye, EyeOff, Save, Link2, Palette } from 'lucide-react';
import { getTranslation } from './utils/translations';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [hasValidKey, setHasValidKey] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.AUDIO);
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SunoResult | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isDragging, setIsDragging] = useState(false);
  const [uiScale, setUiScale] = useState(100); // Percentage

  // API Key State
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const dailyLimit = 100; // Example daily limit value

  // Remix State
  const [isRemixing, setIsRemixing] = useState(false);
  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('suno_theme') as Theme) || 'dark';
  });

  // Initialize from env or localStorage if available
  useEffect(() => {
    // Check localStorage first
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && savedKey.length > 10 && savedKey !== 'PLACEHOLDER_API_KEY') {
      setApiKey(savedKey);
      setHasValidKey(true);
    } else if (process.env.API_KEY && process.env.API_KEY.length > 10 && process.env.API_KEY !== 'PLACEHOLDER_API_KEY') {
      setApiKey(process.env.API_KEY);
      setHasValidKey(true);
    }
  }, []);

  // Handle UI Scaling by adjusting root font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${(uiScale / 100) * 16}px`;
  }, [uiScale]);

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('suno_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [selectedFile]);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);

    // Validate API key
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setKeyError(t.keyRequired);
      return;
    }

    if (trimmedKey.length < 10) {
      setKeyError(t.invalidKey);
      return;
    }

    // Save to localStorage
    localStorage.setItem('gemini_api_key', trimmedKey);
    setHasValidKey(true);
  };

  const processFile = (file: File) => {
    const t = getTranslation(language);
    if (!file.type.startsWith('audio/')) {
      setError(t.invalidFile);
      return;
    }
    // No size limit check here as requested
    setSelectedFile(file);
    setError(null);
    setInputMode(InputMode.AUDIO); // Auto switch to audio mode
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!hasValidKey) return;
    const t = getTranslation(language);

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      let data: SunoResult;

      if (inputMode === InputMode.AUDIO) {
        if (!selectedFile) throw new Error(t.noFile);
        data = await generateSunoPrompt(apiKey, selectedFile, language);
        saveToHistory(data, InputMode.AUDIO, "");
      } else if (inputMode === InputMode.URL) {
        if (!inputUrl.trim()) throw new Error((t as any).noUrl || 'Please enter a valid music URL.');
        data = await generateSunoPrompt(apiKey, { url: inputUrl.trim() }, language);
        saveToHistory(data, InputMode.URL, inputUrl.trim());
      } else {
        if (!inputText.trim()) throw new Error(t.noText);
        data = await generateSunoPrompt(apiKey, inputText, language);
        saveToHistory(data, InputMode.TEXT, inputText);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryLoad = (item: HistoryItem) => {
    setResult(item.result);
    // Optionally restore text input mode if it was text
    if (item.inputMode === InputMode.TEXT && item.inputSummary !== "Audio Analysis") {
      setInputMode(InputMode.TEXT);
      setInputText(item.inputSummary);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'eye-care';
      if (prev === 'eye-care') return 'ivory';
      return 'dark';
    });
  };

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'eye-care' ? '🌿' : '☀️';
  const themeLabel = (t as any)[
    theme === 'dark' ? 'themeDark' : theme === 'eye-care' ? 'themeEyeCare' : 'themeIvory'
  ] || theme;

  const adjustScale = (delta: number) => {
    setUiScale(prev => Math.min(Math.max(prev + delta, 80), 120));
  };

  const handleRemixApply = (newPrompt: MasterPrompt) => {
    if (result) {
      setResult({
        ...result,
        masterPrompt: newPrompt
      });
      setIsRemixing(false);
    }
  };

  const t = getTranslation(language);

  // --- Auth Screen ---
  if (!hasValidKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black bg-grid-pattern">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4">
            <button onClick={toggleLanguage} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 rounded px-2 py-1">
              <Globe size={12} />
              {language === 'en' ? '中文' : 'EN'}
            </button>
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center shadow-lg shadow-black">
              <Music4 className="text-amber-500" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2 tracking-tight">{t.appTitle}</h1>
          <p className="text-center text-zinc-500 mb-8 text-sm">{t.keyInstruction}</p>

          <form onSubmit={handleKeySubmit} className="space-y-4 relative z-10">
            {/* API Key Input with Show/Hide Toggle */}
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-zinc-400 mb-2">{t.apiKeyLabel}</label>
              <div className="relative">
                <input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t.keyPlaceholder}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-white px-4 py-3 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono text-sm pr-12"
                />
                {/* Show/Hide Toggle */}
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  aria-label={showApiKey ? t.hideKey : t.showKey}
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Daily Limit Display */}
              <div className="text-xs text-zinc-600 mt-1 font-mono">
                {t.dailyLimit.replace('${daily_limit}', dailyLimit.toString())}
              </div>

              {/* Error Message */}
              {keyError && (
                <div className="bg-red-950/20 border-l-2 border-red-500 text-red-400 px-3 py-2 text-xs font-mono mt-2 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{keyError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!apiKey}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_-5px_rgba(217,119,6,0.5)] border border-amber-500/20 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {t.saveKey}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-700 mt-6 font-mono">
            SECURE_SESSION :: LOCAL_STORAGE_SAVED
          </p>
        </div>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-cyan-500/30 font-sans flex flex-col">
      {/* Remix Studio Overlay */}
      {isRemixing && result && (
        <RemixStudio
          apiKey={apiKey}
          initialPrompt={result.masterPrompt}
          language={language}
          onApply={handleRemixApply}
          onClose={() => setIsRemixing(false)}
        />
      )}

      {/* Library Drawer */}
      <HistoryDrawer
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoad={handleHistoryLoad}
        language={language}
      />

      {/* DAW Toolbar */}
      <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center shadow-inner">
              <Music4 className="text-amber-500" size={16} />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-zinc-100 leading-none">{t.appTitle}</h1>
              <span className="text-[10px] text-zinc-500 font-mono">v5.1.8_BUILD</span>
            </div>
          </div>
          <div className="h-6 w-px bg-zinc-800 mx-2 hidden sm:block"></div>
          {/* Scale Controls */}
          <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
            <button onClick={() => adjustScale(-5)} className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
              <Minus size={12} />
            </button>
            <div className="px-2 text-[10px] font-mono text-zinc-400 min-w-[3ch] text-center border-l border-r border-zinc-800">
              {uiScale}%
            </div>
            <button onClick={() => adjustScale(5)} className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500 font-mono mr-4">
            <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">GEMINI-3-FLASH</span>
            <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-cyan-500 shadow-[0_0_10px_-3px_rgba(6,182,212,0.3)]">ONLINE</span>
          </div>

          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-amber-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded transition-colors uppercase tracking-wider"
          >
            <Library size={12} />
            {t.libraryTitle.split(' ')[0]} {/* Show partial title on mobile */}
          </button>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2 py-1 rounded transition-colors uppercase tracking-wider"
          >
            <Globe size={12} />
            {language === 'en' ? 'EN' : '中'}
          </button>
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2 py-1 rounded transition-colors tracking-wider"
            title="Switch theme"
          >
            <span className="text-sm leading-none">{themeIcon}</span>
            <span className="hidden sm:inline uppercase">{themeLabel}</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg">
            <span className="text-xs font-bold text-zinc-400">U</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

        {/* LEFT COLUMN: Input Console (Sticky) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 h-fit lg:sticky lg:top-20 z-30 flex flex-col">

          {/* Control Panel Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Command size={14} className="text-amber-500" />
              {t.inputSource}
            </h2>
          </div>

          {/* Mode Toggle - Backlit Style */}
          <div className="bg-black/40 p-1 rounded-lg border border-zinc-800 flex relative shadow-inner shrink-0">
            <div
              className={`absolute top-1 bottom-1 w-[calc(33.333%-3px)] bg-zinc-800/80 rounded transition-all duration-300 ease-out border border-zinc-700/50 shadow-md ${inputMode === InputMode.AUDIO ? 'translate-x-0'
                : inputMode === InputMode.URL ? 'translate-x-[calc(100%+2px)]'
                  : 'translate-x-[calc(200%+4px)]'
                }`}
            />
            <button
              onClick={() => setInputMode(InputMode.AUDIO)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-bold z-10 transition-all ${inputMode === InputMode.AUDIO ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              <Mic size={13} /> {t.audioAnalysis}
            </button>
            <button
              onClick={() => setInputMode(InputMode.URL)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-bold z-10 transition-all ${inputMode === InputMode.URL ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              <Link2 size={13} /> {(t as any).urlAnalysis || 'URL'}
            </button>
            <button
              onClick={() => setInputMode(InputMode.TEXT)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-bold z-10 transition-all ${inputMode === InputMode.TEXT ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              <Type size={13} /> {t.textDescription}
            </button>
          </div>

          {/* Input Area (Dropzone / Textarea) - 9:16 Ratio */}
          <div
            className={`daw-slot rounded-xl overflow-hidden min-h-[600px] lg:aspect-[9/16] flex flex-col relative group transition-all duration-200 ${isDragging
              ? 'border-amber-500/50 shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]'
              : 'border-zinc-800'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

            {isDragging && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-20 h-20 rounded-full border-2 border-amber-500 flex items-center justify-center mb-4 animate-bounce">
                  <Upload size={32} className="text-amber-500" />
                </div>
                <p className="text-sm font-bold text-amber-500 tracking-widest uppercase">Drop Audio File</p>
              </div>
            )}

            {inputMode === InputMode.AUDIO ? (
              <>
                {selectedFile && audioUrl ? (
                  <div className="flex-1 flex flex-col p-2 h-full">
                    <AudioPlayer
                      src={audioUrl}
                      fileName={selectedFile.name}
                      onRemove={() => setSelectedFile(null)}
                      statusLabel={t.readyToAnalyze}
                      language={language}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center transition-colors">
                    <input
                      type="file"
                      id="audio-upload"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="audio-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-4 group/label">
                      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg group-hover/label:border-amber-500/50 group-hover/label:text-amber-500 group-hover/label:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] transition-all duration-300">
                        <Upload size={28} className="text-zinc-500 group-hover/label:text-amber-400 transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-zinc-300 text-sm tracking-wide">
                          {t.uploadTitle}
                        </p>
                        <p className="text-[10px] text-zinc-600 uppercase font-mono">{t.uploadSubtitle}</p>
                      </div>
                    </label>
                  </div>
                )}
              </>
            ) : inputMode === InputMode.URL ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border border-cyan-800/40 flex items-center justify-center shadow-lg shadow-cyan-900/10 mb-5">
                  <Link2 size={28} className="text-cyan-400" />
                </div>
                <p className="text-xs text-zinc-300 font-medium mb-3">
                  {(t as any).urlAnalysis || 'URL Analysis'}
                </p>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder={(t as any).urlPlaceholder || 'Paste a YouTube or SoundCloud link here...'}
                  className="w-full bg-zinc-900/70 border border-zinc-700 text-white px-4 py-3 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-500 font-mono text-sm"
                />
                <p className="text-[11px] mt-3 font-mono">
                  <span className="text-emerald-400">✓</span><span className="text-zinc-300"> YouTube · SoundCloud · Direct URL</span>
                  <span className="text-zinc-600 mx-1.5">|</span>
                  <span className="text-red-400">✗</span><span className="text-zinc-400"> Spotify · Apple Music</span>
                </p>
              </div>
            ) : (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.textPlaceholder}
                className="w-full h-full bg-transparent border-none focus:ring-0 text-zinc-300 placeholder:text-zinc-600 resize-none p-5 font-mono text-xs leading-relaxed"
              />
            )}
          </div>

          {/* Error Console */}
          {error && (
            <div className="bg-red-950/20 border-l-2 border-red-500 text-red-400 px-3 py-2 text-xs font-mono flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Action Button - Orange Bar Style */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || (inputMode === InputMode.AUDIO && !selectedFile) || (inputMode === InputMode.URL && !inputUrl.trim()) || (inputMode === InputMode.TEXT && !inputText)}
            className="w-full relative group overflow-hidden bg-amber-600 hover:bg-amber-500 text-white font-bold py-5 rounded-lg shadow-[0_4px_0_0_rgb(146,64,14),0_0_20px_-5px_rgba(217,119,6,0.3)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-zinc-800 disabled:text-zinc-500 shrink-0 border border-amber-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span className="uppercase tracking-widest text-xs font-mono font-bold">{t.analyzingBtn}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-white drop-shadow-md" />
                <span className="uppercase tracking-widest text-xs font-mono font-bold">{t.generateBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Results Monitor */}
        <div className="lg:col-span-8 xl:col-span-9">
          {result ? (
            <ResultCard
              result={result}
              language={language}
              onRemix={() => setIsRemixing(true)}
            />
          ) : (
            <div className="h-[600px] lg:h-auto lg:aspect-video flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10 text-zinc-700 space-y-4">
              <div className="w-24 h-24 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-full"></div>
                <Monitor size={40} className="text-zinc-800" />
              </div>
              <div className="text-center">
                <p className="font-bold text-zinc-500 uppercase tracking-widest text-sm">{t.emptyStateTitle}</p>
                <p className="text-xs font-mono opacity-50 mt-2 max-w-xs mx-auto leading-relaxed">{t.emptyStateDesc}</p>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;
