/**
 * Админка: хиты кросса и места в заездах (редактируемые).
 * Расчёт мест — в admin-pairs (computeCrossPlacesFromHeats, ensureNextRounds).
 * Общая разметка сетки — heats-shared.js.
 */

function renderCross(rerenderTable) {
  const { getData, saveDataToStorage } = window.SnowContestAdminData;
  const { ensureNextRounds, computeCrossPlacesFromHeats } = window.SnowContestAdminPairs;
  const d = getData();

  if (d.crossHeats && typeof d.crossHeats === 'object') {
    ensureNextRounds(d);
    const computed = computeCrossPlacesFromHeats(d.crossHeats);
    for (const { athleteId, place } of computed) {
      const c = d.crossPlaces.find(x => x.athleteId === athleteId);
      if (c) c.place = place;
    }
    saveDataToStorage();
  }

  renderCrossHeats();
}

function renderCrossHeats() {
  const block = document.getElementById('crossHeatsBlock');
  if (!block) return;
  const { getData, saveDataToStorage } = window.SnowContestAdminData;
  const { escapeHtml } = window.SnowContestUI;
  const { ensureNextRounds, clearRoundsAfter } = window.SnowContestAdminPairs;
  const H = window.SnowContestHeatsShared;
  const labels = window.SnowContest.BOAT_CLASS_LABELS || {};
  const d = getData();
  let crossHeats = d.crossHeats;

  if (!crossHeats || typeof crossHeats !== 'object') {
    block.innerHTML = '<p class="no-data muted">Нажмите «Рассчитать рейтинг ЭТАПА 1 и сформировать хиты для кросса» после заполнения результатов пар.</p>';
    return;
  }
  ensureNextRounds(d);
  crossHeats = d.crossHeats;
  const athleteById = new Map((d.athletes || []).map(a => [a.id, a]));

  const parts = [];
  const classesToShow = H.getClassesToShow(crossHeats, labels);

  for (const boatClass of classesToShow) {
    const classHeats = crossHeats[boatClass];
    if (!classHeats) continue;
    const classLabel = escapeHtml(labels[boatClass] || boatClass);

    const bracketRounds = H.buildBracketRounds(classHeats, athleteById, H.ROUND_LABELS, escapeHtml, (heat, participants, sortedParticipants, athleteById, escapeHtml, roundKey, numHeatsInRound, hasNextRound) => {
      const n = participants.length;
      const maxPlace = n;
      const placeCounts = {};
      participants.forEach((p) => {
        const v = p.placeInHeat;
        if (v != null && v !== '') placeCounts[v] = (placeCounts[v] || 0) + 1;
      });
      const duplicatePlaces = new Set(Object.keys(placeCounts).filter(k => placeCounts[k] > 1).map(Number));
      const placesToAdvance = (n <= 2 && numHeatsInRound > 1) ? [1] : [1, 2];
      return sortedParticipants.map((p) => {
        const name = escapeHtml(athleteById.get(p.athleteId)?.displayName || p.athleteId);
        const placeVal = p.placeInHeat != null && p.placeInHeat !== '' ? Number(p.placeInHeat) : '';
        const isDuplicate = placeVal !== '' && duplicatePlaces.has(placeVal);
        const isEmpty = placeVal === '';
        const options = '<option value=""' + (placeVal === '' ? ' selected' : '') + '>—</option>' + Array.from({ length: maxPlace }, (_, i) => i + 1).map(num => `<option value="${num}"${num === placeVal ? ' selected' : ''}>${num}</option>`).join('');
        const errorClass = (isEmpty || isDuplicate) ? ' heat-place-error' : '';
        const advances = hasNextRound && placeVal !== '' && placesToAdvance.includes(placeVal);
        const rowClass = advances ? ' class="heat-row-advances-upper"' : '';
        return `<tr${rowClass} data-round-key="${escapeHtml(roundKey)}" data-heat-class="${escapeHtml(boatClass)}" data-heat-index="${heat.heatIndex}" data-athlete-id="${escapeHtml(p.athleteId)}">
          <td class="heat-row-num">${escapeHtml(p.athleteId)}</td>
          <td>${name}</td>
          <td><select class="heat-place-select${errorClass}" data-round-key="${escapeHtml(roundKey)}" data-heat-class="${escapeHtml(boatClass)}" data-heat-index="${heat.heatIndex}" data-athlete-id="${escapeHtml(p.athleteId)}">${options}</select></td>
        </tr>`;
      }).join('');
    });

    const bracketHtml = H.buildBracketHtml(bracketRounds, boatClass, escapeHtml);
    const filled = H.allHeatsFilled(classHeats);
    const withPlace = H.buildClassPlacesData(d.athletes || [], d.crossPlaces || [], boatClass);
    const classPlacesRowsHtml = H.buildClassPlacesRowsHtml(withPlace, escapeHtml);
    const classPlacesHtml = H.buildClassPlacesSection(classPlacesRowsHtml, filled, 'Заполните места во всех хитах, чтобы увидеть итоговые места в кроссе.');

    if (bracketRounds.length === 0) continue;
    parts.push(`
      <div class="cross-heats-class-block" data-heat-class="${escapeHtml(boatClass)}">
        <h3 class="cross-heats-class-heading">${classLabel}</h3>
        ${bracketHtml}
        ${classPlacesHtml}
      </div>
    `);
  }
  block.innerHTML = parts.length ? parts.join('') : '<p class="no-data muted">Хиты по классам не сформированы.</p>';

  block.querySelectorAll('.heat-place-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const boatClass = sel.dataset.heatClass;
      const roundKey = sel.dataset.roundKey;
      const heatIndex = parseInt(sel.dataset.heatIndex, 10);
      const athleteId = sel.dataset.athleteId;
      const placeInHeat = sel.value === '' ? null : parseInt(sel.value, 10);
      const classHeats = d.crossHeats && d.crossHeats[boatClass];
      if (!classHeats) return;
      const heats = classHeats[roundKey];
      const heat = heats && heats.find(h => h.heatIndex === heatIndex);
      if (heat) {
        if (heat.participants) {
          const p = heat.participants.find(x => x.athleteId === athleteId);
          if (p) p.placeInHeat = placeInHeat;
        } else {
          if (!heat.participants) heat.participants = (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
          const p = heat.participants.find(x => x.athleteId === athleteId);
          if (p) p.placeInHeat = placeInHeat;
        }
        clearRoundsAfter(classHeats, roundKey);
        saveDataToStorage();
        renderCross();
      }
    });
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminRenderCross = {
    renderCross,
    renderCrossHeats
  };
}
