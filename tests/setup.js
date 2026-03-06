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
// Функция escapeHtml объявлена в ui.js как глобальная, и на неё ссылаются другие модули
// (например, heats-shared.js) по имени. В среде тестов new Function создаёт её в замыкании,
// поэтому пробрасываем её явно в глобальную область видимости.
if (globalThis.window.SnowContestUI && typeof globalThis.window.SnowContestUI.escapeHtml === 'function') {
  // eslint-disable-next-line no-undef
  globalThis.escapeHtml = globalThis.window.SnowContestUI.escapeHtml;
}
runScript('heats-shared', globalThis.window);
runScript('admin-data', globalThis.window);
runScript('admin-qualification', globalThis.window);
runScript('cross-logic', globalThis.window);
runScript('admin-pairs', globalThis.window);
runScript('pair-render', globalThis.window);
runScript('admin-render-pairs', globalThis.window);
