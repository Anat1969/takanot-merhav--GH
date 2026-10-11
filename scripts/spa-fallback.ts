// GitHub Pages מחזיר 404.html לכתובת שלא קיימת. עותק של index.html שומר על האפליקציה גם אז.
import { copyFileSync, existsSync } from 'node:fs';

if (!existsSync('dist/index.html')) {
  console.error('dist/index.html חסר. האם vite build רץ?');
  process.exit(1);
}
copyFileSync('dist/index.html', 'dist/404.html');
console.log('✓ dist/404.html');
