const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'PROJECT_DOCUMENTATION.md');
const ignoreNames = new Set(['node_modules', '.git', 'uploads', 'dist']);

function isBinaryFileSync(filePath) {
  const textChars = "\n\r\t\0";
  try {
    const buffer = fs.readFileSync(filePath);
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];
      if (char === 0) return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    if (ignoreNames.has(file)) return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function languageFromExt(name) {
  const ext = path.extname(name).toLowerCase();
  if (!ext) return '';
  const map = {
    '.js': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.sql': 'sql',
    '.css': 'css',
    '.html': 'html',
    '.yml': 'yaml',
    '.yaml': 'yaml'
  };
  return map[ext] || '';
}

function generate() {
  const files = walk(root).filter(p => !p.includes('PROJECT_DOCUMENTATION.md'));
  const relFiles = files.map(p => path.relative(root, p)).sort();

  let md = `# Project Documentation: ${path.basename(root)}\n\n`;
  md += `Generated on: ${new Date().toISOString()}\n\n`;

  md += '## File Index\n\n';
  relFiles.forEach(f => {
    md += `- ${f}\n`;
  });
  md += '\n---\n\n';

  for (const rel of relFiles) {
    const abs = path.join(root, rel);
    md += `## File: ${rel}\n\n`;
    try {
      if (isBinaryFileSync(abs)) {
        md += '_Binary or unreadable file not included._\n\n';
        continue;
      }
      const content = fs.readFileSync(abs, 'utf8');
      const lang = languageFromExt(rel);
      md += '```' + lang + '\n';
      md += content.replace(/```/g, '\`\`\`');
      md += '\n```\n\n';
    } catch (err) {
      md += `_Error reading file: ${err.message}_\n\n`;
    }
  }

  fs.writeFileSync(outFile, md, 'utf8');
  console.log('Wrote', outFile);
}

generate();
