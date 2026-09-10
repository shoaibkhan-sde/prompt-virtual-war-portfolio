const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) { 
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [...walk('client/src'), ...walk('server/src')];
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('err: any')) {
    content = content.replace(/catch\s*\(\s*err\s*:\s*any\s*\)/g, 'catch (err: unknown)');
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
}
console.log(`Replaced in ${count} files.`);
