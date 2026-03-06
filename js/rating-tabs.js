/**
 * Управление вкладками на странице рейтингов.
 */

function showTab(tabId, subId) {
  document.querySelectorAll('.tab-panel').forEach(p => { p.style.display = 'none'; });
  document.querySelectorAll('#tabsToolbar button').forEach(b => {
    b.classList.toggle('secondary', b.dataset.tab !== tabId);
  });
  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.style.display = 'block';
  const hash = subId ? `${tabId}-${subId}` : tabId;
  if (location.hash.slice(1) !== hash) {
    history.replaceState(null, '', location.pathname + location.search + '#' + hash);
  }
  if (subId) {
    const el = document.getElementById('final-' + subId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function isTabVisible(tabId) {
  const btn = document.querySelector(`#tabsToolbar button[data-tab="${tabId}"]`);
  return btn && btn.style.display !== 'none';
}

function parseHash() {
  const { TAB_IDS } = window.SnowContestConstants;
  const h = (location.hash || '').replace(/^#/, '').trim();
  if (!h) return null;
  const parts = h.split('-');
  if (parts[0] === 'final' && parts.length === 2) {
    return { tabId: 'final', subId: parts[1] };
  }
  if (TAB_IDS.includes(h)) return { tabId: h, subId: null };
  if (TAB_IDS.includes(parts[0])) return { tabId: parts[0], subId: null };
  return null;
}

function applyHashTab(parsed) {
  if (!parsed || !isTabVisible(parsed.tabId)) return false;
  showTab(parsed.tabId, parsed.subId);
  return true;
}

function configureTabs(publication) {
  const qualificationReady = (publication.athletes || []).length > 0;
  const pairsReady = (publication.parallelPairs || []).length > 0;
  const stage1Ready = (publication.stage1 || []).length > 0;
  const heatsReady = stage1Ready && publication.crossHeats && typeof publication.crossHeats === 'object' && Object.keys(publication.crossHeats).length > 0;
  const finalReady = (publication.finalResults || []).length > 0;

  const setVisible = (tabId, isVisible) => {
    const btn = document.querySelector(`#tabsToolbar button[data-tab="${tabId}"]`);
    if (btn) btn.style.display = isVisible ? '' : 'none';
  };

  setVisible('qualification', qualificationReady);
  setVisible('pairs', pairsReady);
  setVisible('stage1', stage1Ready);
  setVisible('heats', heatsReady);
  setVisible('final', finalReady);

  if (qualificationReady) return 'qualification';
  if (pairsReady) return 'pairs';
  if (stage1Ready) return 'stage1';
  if (heatsReady) return 'heats';
  if (finalReady) return 'final';
  return null;
}

if (typeof window !== 'undefined') {
  window.SnowContestRatingTabs = {
    showTab,
    isTabVisible,
    parseHash,
    applyHashTab,
    configureTabs
  };
}
