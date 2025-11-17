const fs = require('fs');
const path = require('path');

const nojekyllPath = path.join(__dirname, '../out/.nojekyll');

// Utwórz plik .nojekyll
fs.writeFileSync(nojekyllPath, '');
console.log('✅ Created .nojekyll file');