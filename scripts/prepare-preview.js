const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../out');
const targetDir = path.join(outDir, 'myvillagebus-web');

console.log('📦 Przygotowywanie preview...');

if (!fs.existsSync(outDir)) {
  console.error('❌ Folder out/ nie istnieje. Uruchom najpierw npm run build');
  process.exit(1);
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  console.log('🗑️  Usunięto stary folder preview');
}

fs.mkdirSync(targetDir, { recursive: true });

const items = fs.readdirSync(outDir);
let fileCount = 0;

items.forEach(item => {
  if (item === 'myvillagebus-web') return;
  
  const srcPath = path.join(outDir, item);
  const destPath = path.join(targetDir, item);
  
  fs.cpSync(srcPath, destPath, { recursive: true });
  fileCount++;
});

console.log(`✅ Skopiowano ${fileCount} elementów do out/myvillagebus-web/`);
console.log('');
console.log('🚀 Uruchom serwer: npx serve@latest out -p 3000');
console.log('🌐 Otwórz: http://localhost:3000/myvillagebus-web/');