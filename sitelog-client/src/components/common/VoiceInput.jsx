import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Languages } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' }
];

export default function VoiceInput({ onTranscript, onStart }) {
  const [lang, setLang] = useState('en-US');
  const [showLangs, setShowLangs] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const onTranscriptRef = useRef(onTranscript);
  const onStartRef = useRef(onStart);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onStartRef.current = onStart;
  }, [onTranscript, onStart]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false; // STRICTLY FALSE: This absolutely prevents Android from rapidly firing overlapping progress updates.
      
      recognitionRef.current.onresult = (event) => {
        let finalStr = '';
        for (let i = 0; i < event.results.length; ++i) {
          // Since interimResults is false, all results are guaranteed final sentences.
          finalStr += event.results[i][0].transcript;
        }
        if (onTranscriptRef.current) {
          onTranscriptRef.current(finalStr);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error: ", event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone permission denied! Please allow microphone access in your browser settings.");
        } else if (event.error !== 'no-speech') {
          alert("Speech Error: " + event.error);
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
  }, []); // Empty dependency array prevents accidental unmounts!

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
        if (onStartRef.current) onStartRef.current();
        recognitionRef.current.lang = lang;
        try {
          finalTranscriptRef.current = ''; // Reset final transcript on new session
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
    return null;
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
        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] text-red-500 font-bold whitespace-nowrap uppercase tracking-wider bg-black/90 backdrop-blur-md px-2 py-0.5 rounded border border-red-500/30 shadow-lg z-[100]">
          Listening
        </span>
      )}
    </div>
  );
}
