import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Languages } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' }
];

export default function VoiceInput({ onTranscript, onStart }) {
  const [lang, setLang] = useState('en-IN');
  const [showLangs, setShowLangs] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (onTranscript) onTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error: ", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone permission denied! Please allow microphone access in your browser settings.");
        }
        setListening(false);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  // Update language dynamically if changed while not listening
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  const toggleListening = (e) => {
    e.preventDefault();
    if (listening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setListening(false);
    } else {
      if (recognitionRef.current) {
        if (onStart) onStart();
        recognitionRef.current.lang = lang;
        try {
          recognitionRef.current.start();
          setListening(true);
        } catch (err) {
          console.error("Failed to start speech recognition", err);
        }
      } else {
        alert("Your browser does not support Speech Recognition.");
      }
    }
  };

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    return null; // Don't render if not supported
  }

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
        <div className="absolute bottom-full mb-2 right-0 sm:left-0 sm:right-auto bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-2 flex flex-col gap-1 z-50">
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
      
      {listening && (
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs text-red-400 font-medium whitespace-nowrap">
          Listening...
        </span>
      )}
    </div>
  );
}
