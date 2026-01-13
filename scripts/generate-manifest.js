const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../public/manifest.template.json');
const outputPath = path.join(__dirname, '../public/manifest.json');

console.log('📝 Generowanie manifest.json...');

if (!fs.existsSync(templatePath)) {
  console.error('❌ Nie znaleziono public/manifest.template.json');
  process.exit(1);
}

let template = fs.readFileSync(templatePath, 'utf-8');
const manifest = template.replace(/\{\{BASE_PATH\}\}/g, '');

fs.writeFileSync(outputPath, manifest, 'utf-8');
console.log('✅ Wygenerowano manifest.json');