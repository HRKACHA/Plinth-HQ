import 'regenerator-runtime/runtime';
import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Languages } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' }
];

export default function VoiceInput({ onTranscript, placeholder = "Speak..." }) {
  const [lang, setLang] = useState('en-IN');
  const [showLangs, setShowLangs] = useState(false);
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return null; // Don't render anything if browser doesn't support it
  }

  const toggleListening = (e) => {
    e.preventDefault();
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: lang });
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowLangs(!showLangs)}
        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition text-gray-400 hover:text-white"
        title="Select Language"
      >
        <Languages className="w-4 h-4" />
      </button>

      {showLangs && (
        <div className="absolute bottom-full mb-2 left-0 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-2 flex flex-col gap-1 z-50">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLang(l.code); setShowLangs(false); }}
              className={`text-sm text-left px-3 py-1.5 rounded-md transition ${lang === l.code ? 'bg-orange/20 text-orange' : 'text-gray-300 hover:bg-gray-800'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={toggleListening}
        className={`p-2 rounded-lg transition-all flex items-center justify-center ${listening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white'}`}
        title={listening ? "Stop recording" : "Start recording"}
      >
        {listening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
      
      {listening && <span className="absolute -top-6 right-0 text-xs text-red-400 font-medium whitespace-nowrap">Listening in {LANGUAGES.find(l => l.code === lang)?.label.split(' ')[0]}...</span>}
    </div>
  );
}
