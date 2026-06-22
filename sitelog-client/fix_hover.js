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

  // Fix hover background
  content = content.replace(/hover:bg-navy\/5 dark:bg-white\/5/g, 'hover:bg-navy/5 dark:hover:bg-white/5');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Fixed hover backgrounds!');
