import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
  "â”€â”€": "──",
  "â• â• â• ": "═══",
  "â‚¹": "₹",
  "âœ“": "✓",
  "Â§": "§",
  "ðŸ“‹": "📋",
  "ðŸ“ ": "📝",
  "ðŸ —ï¸ ": "🏗️",
  "â “": "❓",
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir("./src", function(filePath) {
  if (filePath.endsWith(".js") || filePath.endsWith(".jsx") || filePath.endsWith(".css")) {
    let content = fs.readFileSync(filePath, "utf8");
    let original = content;
    for (let [bad, good] of Object.entries(replacements)) {
      content = content.split(bad).join(good);
    }
    if (content !== original) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log("Fixed: " + filePath);
    }
  }
});
console.log("Done.");
