import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // border-white/5 -> border-black/5 dark:border-white/5
    content = content.replace(/border border-white\/5(?! dark)/g, 'border border-black/5 dark:border-white/5');

    // from-white/5 to-transparent -> from-black/5 dark:from-white/5 to-transparent
    content = content.replace(/from-white\/5 to-transparent/g, 'from-black/5 dark:from-white/5 to-transparent');

    // via-white/10 -> via-white/40 dark:via-white/10
    content = content.replace(/via-white\/10/g, 'via-white/40 dark:via-white/10');

    // shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_2px_16px_rgba(255,255,255,0.02)]
    // Replace inset with 0.4 for light mode, etc
    content = content.replace(/inset_0_2px_16px_rgba\(255,255,255,0\.02\)/g, 'inset_0_2px_16px_rgba(255,255,255,0.6)');

    if (original !== content) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
