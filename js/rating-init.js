/**
 * Инициализация страницы рейтингов: загрузка публикации, вкладки, рендер, хэш.
 */

function initRatingPage() {
  const publication = window.SnowContestStorage.getPublication();
  const noResults = document.getElementById('noResults');
  const { configureTabs, showTab, parseHash, applyHashTab } = window.SnowContestRatingTabs;
  const { renderQualification, renderPairs, renderStage1, renderHeats, renderFinal } = window.SnowContestRatingRender;

  const firstTab = publication ? configureTabs(publication) : null;
  if (!publication || !firstTab) {
    noResults.style.display = 'block';
    document.querySelectorAll('.tab-panel').forEach(p => { p.style.display = 'none'; });
    const toolbar = document.getElementById('tabsToolbar');
    if (toolbar) toolbar.style.display = 'none';
    return;
  }

  noResults.style.display = 'none';
  document.getElementById('tabsToolbar').style.display = 'flex';
  renderQualification(publication);
  renderPairs(publication);
  renderStage1(publication);
  renderHeats(publication);
  renderFinal(publication);

  const parsed = parseHash();
  if (!applyHashTab(parsed)) {
    showTab(firstTab);
  }
}

function bindRatingEvents() {
  document.querySelectorAll('#tabsToolbar button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => window.SnowContestRatingTabs.showTab(btn.dataset.tab));
  });

  window.addEventListener('hashchange', () => {
    const publication = window.SnowContestStorage.getPublication();
    if (!publication) return;
    const parsed = window.SnowContestRatingTabs.parseHash();
    window.SnowContestRatingTabs.applyHashTab(parsed);
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestRatingInit = {
    initRatingPage,
    bindRatingEvents
  };
}
