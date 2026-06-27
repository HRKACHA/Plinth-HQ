const fs = require("fs");
const path = require("path");

const replacements = {
  "â€¢": "•",
  "Â°": "°",
  "â†’": "→",
  "â† ": "←",
  "ðŸ“Š": "📊",
  "ðŸ“ ": "📋",
  "ðŸ‘¥": "👥",
  "ðŸ’¬": "💬",
  "ðŸ§±": "🧱",
  "ðŸ’°": "💰",
  "ðŸ —ï¸ ": "🏗️",
  "â “": "❓",
  "â€”": "—",
  "â€“": "–",
  "ðŸ‘‹": "👋",
  "ðŸš€": "🚀",
  "ðŸ’¡": "💡",
  "ðŸ”§": "🔧",
  "âœ…": "✅",
  "âš ": "⚠️"
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir("./src", function(filePath) {
  if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) {
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
