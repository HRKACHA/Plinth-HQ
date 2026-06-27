import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function AnimatedHeroText({ staticText, rotatingPhrases, isAboutPage = false, className = "text-5xl md:text-7xl lg:text-8xl" }) {
  const [index, setIndex] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 3300); // 2.5s pause + 0.8s duration
    return () => clearInterval(interval);
  }, [rotatingPhrases.length]);

  // Spec:
  // Incoming: y: 100px (or 120px) -> 0, opacity: 0 -> 1, blur: 4px -> 0
  // Outgoing: y: 0 -> -100px (or -120px), opacity: 1 -> 0, blur: 0 -> 4px
  // ease: [0.22, 1, 0.36, 1], duration: 0.8 (About page requested 0.9)

  const duration = isAboutPage ? 0.9 : 0.8;
  const offset = isAboutPage ? 120 : 100;
  const isDark = theme === 'dark';
  const blurAmount = isDark ? 'blur(4px)' : 'blur(1px)';

  const variants = {
    enter: {
      y: offset,
      opacity: 0,
      filter: blurAmount,
    },
    center: {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: { duration, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
      y: -offset,
      opacity: 0,
      filter: blurAmount,
      transition: { duration, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const gradientStyle = {
    backgroundImage: isDark 
      ? 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.4) 100%)'
      : 'linear-gradient(180deg, #1a1f4e 0%, #3b4c8a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
  };

  // Find the longest phrase to prop open the container so it never jumps
  const longestPhrase = rotatingPhrases.reduce((a, b) => a.length > b.length ? a : b, "");

  return (
    <h1 className={`font-display font-bold tracking-tighter leading-[1.05] sm:leading-[1.1] ${className}`}>
      {staticText.split('\n').map((line, i) => (
        <span key={i} className="block pt-2 pb-4 -mt-2 -mb-4" style={gradientStyle}>{line}</span>
      ))}
      <span className="grid relative overflow-hidden mt-2 sm:mt-0 pt-2 pb-4 -mt-2 -mb-4">
        <span className="col-start-1 row-start-1 invisible pointer-events-none">
          {longestPhrase.split('\n').map((line, idx) => (
            <span key={idx} className="block pt-2 pb-4 -mt-2 -mb-4" style={gradientStyle}>{line}</span>
          ))}
        </span>
        <AnimatePresence>
          <motion.span
            key={index}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="col-start-1 row-start-1 block"
          >
            {rotatingPhrases[index].split('\n').map((line, idx) => (
              <span key={idx} className="block pt-2 pb-4 -mt-2 -mb-4" style={gradientStyle}>{line}</span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  );
}
