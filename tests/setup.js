/**
 * Подключает глобальные скрипты SnowContest.Web в jsdom (window).
 * Порядок: constants → contest-calculator → qualification-format → storage → ui
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(__dirname, '..', 'js');

function runScript(name, windowObj) {
  const filePath = path.join(jsDir, `${name}.js`);
  const code = fs.readFileSync(filePath, 'utf8');
  new Function('window', code)(windowObj);
}

runScript('constants', globalThis.window);
runScript('contest-calculator', globalThis.window);
runScript('qualification-format', globalThis.window);
runScript('storage', globalThis.window);
runScript('ui', globalThis.window);
runScript('heats-shared', globalThis.window);
runScript('admin-data', globalThis.window);
runScript('admin-qualification', globalThis.window);
runScript('admin-pairs', globalThis.window);
runScript('pair-render', globalThis.window);
runScript('admin-render-pairs', globalThis.window);
