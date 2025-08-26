const fs = require('fs');
const path = 'package.json';
const txt = fs.readFileSync(path,'utf8');
const pkg = JSON.parse(txt);
const backup = `package.backup.${Date.now()}.json`;
fs.writeFileSync(backup, JSON.stringify(pkg, null, 2));

// Zet een schone, geldige Strapi v5 dependency-set
pkg.dependencies = {
  "@strapi/strapi": "^5.23.0",
  "@strapi/admin": "^5.23.0",
  "@strapi/plugin-cloud": "^5.23.0",
  "@strapi/plugin-users-permissions": "^5.23.0",
  "@strapi/plugin-upload": "^5.23.0",
  "@strapi/plugin-i18n": "^5.23.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "styled-components": "^6.1.19"
};

// Ruim evt. v4-strapi sporen uit devDependencies op
if (pkg.devDependencies) {
  for (const k of Object.keys(pkg.devDependencies)) {
    if (k.startsWith('@strapi/')) delete pkg.devDependencies[k];
  }
}

fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
console.log('✔ package.json hersteld. Backup:', backup);
