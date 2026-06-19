const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      fileList = walk(path.join(dir, file), fileList);
    } else {
      if (file.endsWith('.jsx')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

const files = walk(dir);

let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('type="date"')) {
    // Determine relative path to GlassDatePicker
    const componentsDir = path.join(__dirname, 'src/components/common/GlassDatePicker');
    let relativePath = path.relative(path.dirname(file), componentsDir).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

    // We don't want to replace inside GlassDatePicker itself
    if (file.includes('GlassDatePicker.jsx')) continue;

    // Add import if not present
    if (!content.includes('GlassDatePicker')) {
      // Find the last import statement
      const importRegex = /^import\s+.*?;\s*$/gm;
      let lastImportIndex = 0;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastImportIndex = match.index + match[0].length;
      }
      
      const importStmt = `\nimport GlassDatePicker from '${relativePath}';`;
      if (lastImportIndex > 0) {
        content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
      } else {
        content = importStmt + '\n' + content;
      }
    }

    // Replace <input type="date" ... /> with <GlassDatePicker ... />
    // We need a robust regex to catch all attributes
    content = content.replace(/<input\s+([^>]*?)type="date"([^>]*?)\/?>/g, (match, before, after) => {
      // combine attributes, ignoring className if it just has "input-field" since GlassDatePicker handles that
      let attrs = before + after;
      // remove className="input-field" completely if it's there
      attrs = attrs.replace(/className="input-field(\s+[^"]*)?"/g, 'className="$1"');
      attrs = attrs.replace(/className='input-field(\s+[^']*)?'/g, "className='$1'");
      // clean up empty classNames
      attrs = attrs.replace(/className="\s*"/g, '');
      attrs = attrs.replace(/className='\s*'/g, '');

      return `<GlassDatePicker ${attrs.trim()} />`;
    });
    
    // Some instances might have type="date" after other attributes
    content = content.replace(/<input\s+type="date"([^>]*?)\/?>/g, (match, after) => {
      let attrs = after;
      attrs = attrs.replace(/className="input-field(\s+[^"]*)?"/g, 'className="$1"');
      attrs = attrs.replace(/className='input-field(\s+[^']*)?'/g, "className='$1'");
      attrs = attrs.replace(/className="\s*"/g, '');
      attrs = attrs.replace(/className='\s*'/g, '');
      return `<GlassDatePicker ${attrs.trim()} />`;
    });

    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Modified ${modifiedCount} files.`);
