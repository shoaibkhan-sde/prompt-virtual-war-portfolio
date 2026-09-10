const fs = require('fs');

const replacements = [
  {
    file: 'client/src/pages/OpsWorkspacePage.tsx',
    find: 'const pMap: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };',
    replace: 'const pMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };'
  },
  {
    file: 'client/src/pages/OpsWorkspacePage.tsx',
    find: 'const dataPoint: any = { time: t.toLocaleTimeString([], { hour: \'2-digit\', minute: \'2-digit\' }) };',
    replace: 'const dataPoint: Record<string, string | number> = { time: t.toLocaleTimeString([], { hour: \'2-digit\', minute: \'2-digit\' }) };'
  },
  {
    file: 'client/src/pages/Home.tsx',
    find: 'let crowdData: any[] = [];',
    replace: 'let crowdData: CrowdZone[] = [];'
  },
  {
    file: 'client/src/pages/Home.tsx',
    find: 'let incData: any[] = [];',
    replace: 'let incData: Incident[] = [];'
  },
  {
    file: 'client/src/pages/Home.tsx',
    find: '.forEach((card: any) => {',
    replace: '.forEach((card: Element) => {'
  },
  {
    file: 'client/src/pages/Home.tsx',
    find: 'const animateCount = (el: any) => {',
    replace: 'const animateCount = (el: HTMLElement) => {'
  },
  {
    file: 'client/src/pages/Home.tsx',
    find: '.forEach((b: any) => {',
    replace: '.forEach((b: Element) => {'
  },
  {
    file: 'client/src/pages/VisualizerPage.tsx',
    find: 'const defaults: any = {',
    replace: 'const defaults: Record<string, string | number> = {'
  },
  {
    file: 'server/src/db.ts',
    find: 'sessionDoc.messages.map((m: any) =>',
    replace: 'sessionDoc.messages.map((m: { role: string; text: string }) =>'
  },
  {
    file: 'server/src/index.ts',
    find: 'app.use((err: any, req: express.Request',
    replace: 'app.use((err: unknown, req: express.Request'
  }
];

let totalReplacements = 0;
for (const req of replacements) {
  try {
    const filePath = req.file;
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(req.find)) {
      content = content.replaceAll(req.find, req.replace);
      fs.writeFileSync(filePath, content, 'utf8');
      totalReplacements++;
      console.log(`Replaced in ${filePath}`);
    } else {
      console.log(`Could not find target in ${filePath}`);
    }
  } catch (e) {
    console.error(`Error with ${req.file}: ${e.message}`);
  }
}
console.log(`Total specific replacements: ${totalReplacements}`);
