const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      fileList = walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.jsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix the syntax error from the previous regex where `=>` got split into `= />`
  content = content.replace(/<GlassDatePicker(.*?onChange=\{\s*\(?e\)?\s*)=\s*\/>(.*?\/>)/g, '<GlassDatePicker$1=>$2');
  
  // Remove className="input-field"
  content = content.replace(/<GlassDatePicker([^>]*?)className="input-field\s*"([^>]*?)\/>/g, '<GlassDatePicker$1$2/>');
  content = content.replace(/<GlassDatePicker([^>]*?)className='input-field\s*'([^>]*?)\/>/g, '<GlassDatePicker$1$2/>');
  content = content.replace(/<GlassDatePicker([^>]*?)className="input-field(\s+.*?)"([^>]*?)\/>/g, '<GlassDatePicker$1className="$2"$3/>');
  content = content.replace(/<GlassDatePicker([^>]*?)className='input-field(\s+.*?)'([^>]*?)\/>/g, '<GlassDatePicker$1className=\'$2\'$3/>');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
