/**
 * Общие UI-хелперы: бейджи классов, экранирование HTML, тосты сообщений.
 */

function badge(cls) {
  const c = { 'К1М': 'badge-k1m', 'К1Ж': 'badge-k1w', 'П1М': 'badge-p1m', 'П1Ж': 'badge-p1w' }[cls] || '';
  return `<span class="badge ${c}">${cls}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let msgTimer = null;

function hideMsg(msgElId) {
  const el = document.getElementById(msgElId || 'msg');
  if (!el) return;
  if (msgTimer) {
    clearTimeout(msgTimer);
    msgTimer = null;
  }
  el.style.display = 'none';
}

function showMsg(text, isError, msgElId) {
  const el = document.getElementById(msgElId || 'msg');
  if (!el) return;
  if (msgTimer) {
    clearTimeout(msgTimer);
    msgTimer = null;
  }

  const textEl = document.createElement('span');
  textEl.className = 'msg-text';
  textEl.textContent = text;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'msg-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Закрыть сообщение');
  closeBtn.addEventListener('click', () => hideMsg(msgElId));

  el.replaceChildren(textEl, closeBtn);
  el.className = 'msg toast ' + (isError ? 'error' : 'success');
  el.style.display = 'flex';

  if (!isError) {
    msgTimer = setTimeout(() => hideMsg(msgElId), 4000);
  }
}

if (typeof window !== 'undefined') {
  window.SnowContestUI = {
    badge,
    escapeHtml,
    showMsg,
    hideMsg
  };
}
