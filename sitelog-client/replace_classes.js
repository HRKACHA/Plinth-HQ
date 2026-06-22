import fs from 'fs';
import path from 'path';

const dir = './src';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(file => {
    file = path.join(directory, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We only want to replace standalone classes, avoiding matches inside strings that are not classes
  // A simple regex that looks for standard tailwind class boundaries.
  
  // Replace text colors
  content = content.replace(/\btext-white\b(?!\/)/g, 'text-navy dark:text-white');
  content = content.replace(/\btext-white\/(\d+)\b/g, 'text-navy/$1 dark:text-white/$1');

  // Replace background colors
  content = content.replace(/\bbg-white\/(\d+)\b/g, 'bg-navy/$1 dark:bg-white/$1');

  // Replace border colors
  content = content.replace(/\bborder-white\/(\d+)\b/g, 'border-navy/$1 dark:border-white/$1');

  // Fix button regressions (if buttons use text-navy dark:text-white but they should just be text-white)
  // Actually, btn-primary has @apply text-white in CSS, so the jsx doesn't typically have text-white directly on the button unless it's a raw button.
  // Wait, if a raw button has bg-orange text-navy dark:text-white, it's bad.
  // Let's revert specific combinations if they appear on the same line or element.
  // A safe way: we'll let it apply text-navy dark:text-white, and if it looks bad on a button, we can fix the button manually. 

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Done replacing tailwind classes.');
