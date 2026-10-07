const fs = require('fs');
let content = fs.readFileSync('src/services/database.ts', 'utf8');
content = content.replace(/map\(r =>/g, 'map((r: any) =>');
content = content.replace(/categories\.forEach\(cat =>/g, 'categories.forEach((cat: any) =>');
fs.writeFileSync('src/services/database.ts', content);
