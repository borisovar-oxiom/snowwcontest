/**
 * Сводный модуль отрисовки админки: собирает рендеры по темам в один API.
 */

function renderAll(showMsg, rerenderTable) {
  window.SnowContestAdminData.syncFromData();
  window.SnowContestAdminRenderAthletes.renderAthletes(showMsg, rerenderTable);
  window.SnowContestAdminRenderQualification.renderQualification(showMsg, rerenderTable);
  window.SnowContestAdminRenderPairs.renderParallelPairs(rerenderTable);
  window.SnowContestAdminRenderCross.renderCross(rerenderTable);
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminRender = {
    setEditingId: (id) => window.SnowContestAdminRenderAthletes.setEditingId(id),
    getEditingId: () => window.SnowContestAdminRenderAthletes.getEditingId(),
    renderAthletes: (showMsg, rerenderTable) => window.SnowContestAdminRenderAthletes.renderAthletes(showMsg, rerenderTable),
    renderQualification: (showMsg, rerenderTable) => window.SnowContestAdminRenderQualification.renderQualification(showMsg, rerenderTable),
    renderParallelPairs: (rerenderTable) => window.SnowContestAdminRenderPairs.renderParallelPairs(rerenderTable),
    renderCross: (rerenderTable) => window.SnowContestAdminRenderCross.renderCross(rerenderTable),
    renderCrossHeats: () => window.SnowContestAdminRenderCross.renderCrossHeats(),
    renderAll
  };
}
