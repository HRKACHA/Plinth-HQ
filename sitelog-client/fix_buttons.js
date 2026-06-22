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

  // Find cases where text-navy dark:text-white is used alongside a solid button background and revert to just text-white
  // Solid button backgrounds in this app: bg-orange, bg-blue-, bg-red-, bg-emerald-, bg-danger, bg-success, bg-gradient-to-

  // We can do this with regex: if a line contains both a strong background AND text-navy dark:text-white, 
  // replace text-navy dark:text-white with text-white
  const strongBgRegex = /\b(bg-orange|bg-blue-[4567]00|bg-red-[4567]00|bg-emerald-[4567]00|bg-danger|bg-success|bg-gradient-to-[rblt]|btn-primary|btn-danger|bg-\[#\w+\])/;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (strongBgRegex.test(lines[i]) && lines[i].includes('text-navy dark:text-white')) {
      lines[i] = lines[i].replace(/text-navy dark:text-white/g, 'text-white');
    }
  }
  content = lines.join('\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Done fixing button text colors.');
