
import React from 'react';
import { SunoResult, Language, AdvancedSettings, MasterPrompt } from '../types';
import CopyButton from './CopyButton';
import { Activity, Layers, Disc, Settings2, Share2, AlignLeft, Music2, Cpu, Mic2, Piano, Clock, KeyRound, Sparkles } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface ResultCardProps {
    result: SunoResult;
    language: Language;
    onRemix: (masterPrompt: MasterPrompt) => void;
}

const Tag: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${className}`}>
        {children}
    </span>
);

const LyricsView: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');

    return (
        <div className="daw-slot rounded font-mono text-xs h-64 overflow-y-auto custom-scrollbar leading-relaxed bg-[#050505] p-0">
            <div className="flex flex-col">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();
                    let type = 'lyric';
                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) type = 'tag';
                    else if (trimmed.startsWith('(') && trimmed.endsWith(')')) type = 'instruction';
                    else if (trimmed === '') type = 'empty';

                    return (
                        <div key={idx} className={`px-4 py-0.5 flex hover:bg-zinc-900/50 transition-colors ${type === 'tag' ? 'mt-3 mb-1' : ''}`}>
                            <span className="text-[9px] text-zinc-800 w-6 shrink-0 select-none text-right mr-3 pt-0.5">{idx + 1}</span>
                            <div className="flex-1 break-words">
                                {type === 'tag' && (
                                    <span className="text-amber-500 font-bold tracking-wider inline-flex items-center gap-2">
                                        <span className="w-1 h-1 bg-amber-500 rounded-full inline-block opacity-50"></span>
                                        {line}
                                    </span>
                                )}
                                {type === 'instruction' && (
                                    <span className="text-zinc-500 italic">
                                    // {line}
                                    </span>
                                )}
                                {type === 'lyric' && (
                                    <span className="text-zinc-300">
                                        {line}
                                    </span>
                                )}
                                {type === 'empty' && (
                                    <span className="h-2 block"></span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const AnalysisConsole: React.FC<{ analysis: SunoResult['analysis']; labels: any }> = ({ analysis, labels }) => {
    return (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 space-y-4 relative overflow-hidden backdrop-blur-md">
            {/* Header */}
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 pb-2 flex items-center gap-2">
                <Activity size={12} className="text-amber-500" />
                {labels.analysisReport}
            </h4>

            {/* Main Grid: Left (Stats/Chords) & Right (Texture/Instruments) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Music Theory Data */}
                <div className="space-y-4">
                    {/* Row 1: BPM / Time Sig */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-2.5 rounded group hover:border-cyan-500/30 transition-colors">
                            <div className="text-[9px] text-zinc-600 font-mono uppercase mb-1 flex items-center gap-1"><Clock size={10} /> {labels.bpmVibe}</div>
                            <div className="text-xl font-mono text-cyan-400 font-bold">{analysis.bpm}</div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 p-2.5 rounded group hover:border-pink-500/30 transition-colors">
                            <div className="text-[9px] text-zinc-600 font-mono uppercase mb-1 flex items-center gap-1"><MetronomeIcon size={10} /> {labels.timeSignature}</div>
                            <div className="text-lg font-mono text-pink-400 font-bold">{analysis.timeSignature}</div>
                        </div>
                    </div>

                    {/* Row 2: Key */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-2.5 rounded group hover:border-lime-500/30 transition-colors">
                        <div className="text-[9px] text-zinc-600 font-mono uppercase mb-1 flex items-center gap-1"><KeyRound size={10} /> {labels.keyScale}</div>
                        <div className="text-lg font-mono text-lime-400 font-bold truncate">{analysis.key}</div>
                    </div>

                    {/* Row 3: Chords (FULL WIDTH VISIBLE) */}
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded group hover:border-amber-500/30 transition-colors">
                        <div className="text-[9px] text-zinc-500 font-mono uppercase mb-1.5 flex items-center gap-1"><Piano size={10} /> {labels.chordProgression}</div>
                        <div className="text-xs font-mono text-zinc-200 leading-normal border-l-2 border-amber-600 pl-2">
                            {analysis.chordProgression}
                        </div>
                    </div>

                    {/* Row 4: Genre */}
                    <div className="pt-2">
                        <div className="text-[9px] text-zinc-600 font-mono uppercase mb-1 flex items-center gap-1"><Disc size={10} /> {labels.coreGenre}</div>
                        <div className="text-xs text-white font-bold">{analysis.genre}</div>
                    </div>
                </div>

                {/* Right Column: Texture & Instruments */}
                <div className="space-y-5">

                    <div className="space-y-2">
                        <div className="text-[9px] text-zinc-600 font-mono uppercase flex items-center gap-1"><Mic2 size={10} /> {labels.vocalTexture}</div>
                        <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/30 p-2 rounded border border-zinc-800/50">
                            {analysis.vocalTexture}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[9px] text-zinc-600 font-mono uppercase flex items-center gap-1"><Layers size={10} /> {labels.instrumentStems}</div>
                        <div className="flex flex-col gap-1.5">
                            {analysis.instruments.map((inst, i) => (
                                <div key={i} className="text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-1.5 rounded font-mono truncate flex items-center justify-between group hover:border-zinc-600 transition-colors">
                                    <span>{inst}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-cyan-500 transition-colors"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

const MetronomeIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 18v-8" />
        <path d="M6 18v-2" />
        <path d="M18 18v-4" />
    </svg>
)

const SettingsPanel: React.FC<{ settings: AdvancedSettings; labels: any }> = ({ settings, labels }) => {
    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 scanline-pattern z-0 pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-1 relative z-10">
                <Settings2 size={12} className="text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{labels.advancedOptions}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 relative z-10">
                <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-mono">{labels.vocalGender}</span>
                    <Tag className="bg-zinc-800 border-zinc-700 text-zinc-300">{settings.vocalGender}</Tag>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-mono">{labels.lyricsMode}</span>
                    <Tag className={`border-zinc-700 ${settings.lyricsMode === 'Manual' ? 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30' : 'bg-zinc-800 text-zinc-300'}`}>
                        {settings.lyricsMode}
                    </Tag>
                </div>
            </div>

            <div className="space-y-3 pt-1 relative z-10">
                {[
                    { label: labels.weirdness, value: settings.weirdness, color: 'bg-pink-500', textColor: 'text-pink-500' },
                    { label: labels.styleInfluence, value: settings.styleInfluence, color: 'bg-cyan-500', textColor: 'text-cyan-500' }
                ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                            <span>{item.label}</span>
                            <span className={item.textColor}>{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
                            <div
                                className={`absolute h-full ${item.color} opacity-80 shadow-[0_0_10px_currentColor]`}
                                style={{ width: `${item.value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ResultCard: React.FC<ResultCardProps> = ({ result, language, onRemix }) => {
    const { analysis, masterPrompt, variants } = result;
    const t = getTranslation(language);

    return (
        <div className="w-full space-y-6 animate-fade-in pb-12">

            {/* 1. Track Inspector (Master Prompt) */}
            <div className="bg-[#0c0c0e] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-600"></div>

                {/* Header Strip */}
                <div className="bg-zinc-900/80 border-b border-zinc-800 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-900/20 border border-amber-500/30 rounded flex items-center justify-center">
                            <Music2 className="text-amber-500" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-100 text-xl leading-none tracking-tight">{masterPrompt.title}</h3>
                            <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-1 block">MASTER TRACK // ORIGINAL_MIX</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex gap-2">
                            <span className="text-[10px] font-mono bg-black border border-zinc-800 px-2 py-1 rounded text-amber-500 shadow-inner">BPM: {analysis.bpm.split(' ')[0]}</span>
                            <span className="text-[10px] font-mono bg-black border border-zinc-800 px-2 py-1 rounded text-zinc-400 shadow-inner">{analysis.genre.split('/')[0]}</span>
                        </div>

                        <button
                            onClick={() => onRemix(masterPrompt)}
                            className="ml-auto md:ml-2 flex items-center gap-1.5 md:gap-2 bg-cyan-600 text-white shadow-[0_0_15px_-2px_rgba(6,182,212,0.5)] border-transparent md:bg-cyan-900/20 md:border md:border-cyan-700/30 md:text-cyan-400 md:shadow-none px-4 py-2 md:px-3 md:py-1.5 rounded-lg md:rounded text-xs md:text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 md:hover:scale-100 hover:bg-cyan-500 md:hover:bg-cyan-900/40"
                        >
                            <Sparkles className="w-3.5 h-3.5 md:w-3 md:h-3" />
                            {t.remixBtn}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3">
                    {/* Left: Data Editor */}
                    <div className="lg:col-span-2 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-[#09090b]">

                        {/* Style Prompt Block */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Disc size={12} /> {t.stylePrompt}
                                </span>
                                <CopyButton text={masterPrompt.styleDescription} label={t.copy} copiedLabel={t.copied} />
                            </div>
                            <div className="daw-slot rounded p-4 font-mono text-sm text-zinc-300 leading-relaxed">
                                <span className="text-zinc-600 select-none mr-2">$</span>
                                {masterPrompt.styleDescription}
                            </div>
                        </div>

                        {/* Lyrics Editor Block */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <AlignLeft size={12} /> {t.lyricsStructure}
                                </span>
                                <CopyButton text={masterPrompt.lyricsAndStructure} label={t.copyLyrics} copiedLabel={t.copied} />
                            </div>
                            <div className="relative group">
                                <LyricsView content={masterPrompt.lyricsAndStructure} />
                            </div>
                        </div>
                    </div>

                    {/* Right: Settings Rack */}
                    <div className="lg:col-span-1 bg-zinc-900/30 p-5 space-y-6">
                        {/* Analysis Console */}
                        <AnalysisConsole analysis={analysis} labels={t} />

                        {/* Settings */}
                        <SettingsPanel settings={masterPrompt.advancedSettings} labels={t} />

                        {/* Notes */}
                        <div className="bg-amber-900/10 border border-amber-700/20 p-3 rounded">
                            <p className="text-[10px] text-amber-600/80 italic leading-tight font-mono">
                        // {masterPrompt.settings}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Variants Grid (Preset Cards) */}
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                    <Share2 size={12} /> {t.generatedVariants}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {variants.map((variant, idx) => {
                        // Color Logic: 0=Cyan, 1=Magenta, 2=Lime
                        const accentColor = idx === 0 ? 'border-cyan-500/30 text-cyan-400' : idx === 1 ? 'border-pink-500/30 text-pink-400' : 'border-lime-500/30 text-lime-400';
                        const tagColor = idx === 0 ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : idx === 1 ? 'bg-pink-950 text-pink-400 border-pink-800' : 'bg-lime-950 text-lime-400 border-lime-800';

                        return (
                            <div key={idx} className={`group bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 transition-all rounded-lg p-4 flex flex-col h-full hover:bg-zinc-900 relative overflow-hidden`}>
                                <div className={`absolute top-0 left-0 w-full h-1 ${idx === 0 ? 'bg-cyan-600' : idx === 1 ? 'bg-pink-600' : 'bg-lime-600'} opacity-50`}></div>

                                <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2 border-dashed">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border ${tagColor}`}>
                                            {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                                        </span>
                                        <span className="text-xs font-bold text-zinc-300">{variant.name}</span>
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-600 uppercase">{idx === 0 ? 'Replica' : idx === 1 ? 'Cover' : 'Remix'}</span>
                                </div>

                                <h4 className={`font-bold text-sm mb-1 ${idx === 0 ? 'text-cyan-100' : idx === 1 ? 'text-pink-100' : 'text-lime-100'}`}>{variant.title}</h4>
                                <p className="text-[10px] text-zinc-500 mb-4 h-8 leading-tight overflow-hidden">{variant.description}</p>

                                <div className="daw-slot p-3 rounded mb-4 flex-1">
                                    <p className="font-mono text-[10px] text-zinc-400 leading-relaxed break-words">{variant.styleAdjustment}</p>
                                </div>

                                <div className="mt-auto space-y-2">
                                    <div className="flex gap-2 text-[9px] font-mono text-zinc-500">
                                        <div className="flex-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 flex justify-between">
                                            <span>Weirdness</span>
                                            <span className={idx === 0 ? 'text-cyan-500' : idx === 1 ? 'text-pink-500' : 'text-lime-500'}>{variant.advancedSettings.weirdness}%</span>
                                        </div>
                                        <div className="flex-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 flex justify-between">
                                            <span>Style</span>
                                            <span className={idx === 0 ? 'text-cyan-500' : idx === 1 ? 'text-pink-500' : 'text-lime-500'}>{variant.advancedSettings.styleInfluence}%</span>
                                        </div>
                                    </div>
                                    <CopyButton
                                        text={variant.styleAdjustment}
                                        label={t.copy}
                                        copiedLabel={t.copied}
                                        className="w-full justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
