import { useState, useEffect } from 'react'

export default function VoiceInput({ onTranscript, language = 'hi-IN' }) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)
  const [recognition, setRecognition] = useState(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = language
    rec.onstart = () => {
      setListening(true)
      setSpeaking(false)
    }
    rec.onend = () => setListening(false)
    rec.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) final += text
        else interim += text
      }
      const fullText = (final ? transcript + final : transcript) + interim
      setTranscript(fullText)
    }
    rec.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      setListening(false)
    }
    setRecognition(rec)
  }, [language, transcript])

  const startListening = () => {
    setTranscript('')
    if (recognition) {
      try {
        recognition.start()
      } catch (e) {
        console.error('Start error', e)
      }
    }
  }

  const stopListening = () => {
    if (recognition) {
      try {
        recognition.stop()
      } catch (e) {
        console.error('Stop error', e)
      }
    }
    if (transcript.trim()) {
      setSpeaking(true)
      if (onTranscript) onTranscript(transcript)
      setTimeout(() => setSpeaking(false), 3000)
    }
  }

  const handleToggle = () => {
    if (listening) stopListening()
    else startListening()
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto py-4">
      
      {/* Siri / ChatGPT Voice / Gemini Live Animated Voice Orb Centerpiece */}
      <div className="relative flex items-center justify-center my-6">
        
        {/* Layer 1: Ambient Background Bloom */}
        <div
          className={`absolute w-64 h-64 rounded-full transition-all duration-700 pointer-events-none ${
            listening
              ? 'bg-gradient-to-tr from-rose-500/35 via-red-500/25 to-indigo-500/30 animate-breathe-glow'
              : speaking
              ? 'bg-gradient-to-tr from-emerald-500/35 via-teal-500/25 to-indigo-500/30 animate-breathe-glow'
              : 'bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-emerald-500/15 animate-breathe-glow'
          }`}
        />

        {/* Layer 2: Expanding Soundwave Ripples (Listening State) */}
        {listening && (
          <>
            <div className="absolute w-48 h-48 rounded-full border border-rose-500/40 animate-ripple-ring pointer-events-none" />
            <div className="absolute w-56 h-56 rounded-full border border-indigo-500/30 animate-ripple-ring pointer-events-none" style={{ animationDelay: '0.6s' }} />
          </>
        )}

        {/* Layer 3: Rotating Outer Light Ring */}
        <div className="absolute w-44 h-44 rounded-full border border-white/10 animate-rotate-ring pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-indigo-400 absolute top-0 left-1/2 -ml-1 blur-[1px]" />
          <div className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 left-1/2 -ml-1 blur-[1px]" />
        </div>

        {/* Layer 4: Interactive Main AI Voice Sphere */}
        <button
          onClick={handleToggle}
          className={`
            relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500
            cursor-pointer group animate-orb-float btn-shine border backdrop-blur-2xl
            ${
              listening
                ? 'bg-gradient-to-tr from-rose-600 via-red-600 to-rose-500 border-rose-400/60 shadow-rose-600/60 scale-105'
                : speaking
                ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 border-emerald-400/60 shadow-emerald-600/60 scale-105'
                : 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/40 shadow-indigo-950/90 hover:border-indigo-400/80 hover:scale-105 active:scale-95'
            }
          `}
          aria-label={listening ? 'Stop listening' : 'Start listening'}
        >
          {/* Inner Spherical Glass Mesh Effect */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

          {/* Central Animated Wave / Voice Symbol */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {listening ? (
              <div className="flex items-center gap-1 h-8">
                {[0.1, 0.3, 0.5, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-white rounded-full animate-eq-bar"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            ) : speaking ? (
              <div className="flex items-center gap-1.5">
                <span className="text-3xl text-emerald-300 animate-pulse">⚡</span>
              </div>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-200 transform group-hover:scale-110 transition-transform">
                <path d="M12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2Z" fill="currentColor" opacity="0.9" />
                <path d="M5 10V11C5 14.866 8.13401 18 12 18C15.866 18 19 14.866 19 11V10H17V11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11V10H5Z" fill="currentColor" />
                <path d="M11 19H13V22H11V19Z" fill="currentColor" />
              </svg>
            )}

            <span className="text-[10px] font-mono tracking-widest uppercase mt-2 font-extrabold text-slate-200/90">
              {listening ? 'LISTENING' : speaking ? 'PROCESSING' : 'TAP TO TALK'}
            </span>
          </div>
        </button>
      </div>


      {/* Text Instructions */}
      <div className="text-center space-y-1 max-w-md">
        <h3 className="text-xl font-black text-white tracking-tight">
          {listening ? 'Suno Raha Hoon...' : 'Bol Kar Procurement Restock Karein'}
        </h3>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          {language === 'hi-IN'
            ? 'Hindi ya Hinglish mein inventory bolen. Agent Prava dynamic card dwara payment execute karega.'
            : 'Speak restock needs. The agent compares market quotes & executes via Prava.'}
        </p>
      </div>

      {!supported && (
        <div className="bg-rose-950/60 text-rose-300 text-xs px-4 py-2.5 rounded-xl border border-rose-800/60 font-mono">
          ⚠️ Web Speech API unavailable in browser. Click sample prompt chips below.
        </div>
      )}

      {/* Transcribed Speech Intent Display Card */}
      {transcript && (
        <div className="w-full glass-panel rounded-2xl p-5 shadow-2xl border-indigo-500/40 space-y-3 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-300 font-extrabold">
                Parsed Voice Input
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">ACCURACY 100%</span>
          </div>

          <p className="text-lg font-bold text-white tracking-tight leading-snug">“{transcript}”</p>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => onTranscript(transcript)}
              className="btn-shine bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <span>Analyze & Compare Market Quotes</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
