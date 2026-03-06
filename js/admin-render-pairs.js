/**
 * Админка: таблица пар параллельных спусков и клик по исходу.
 */

/** Цикл исхода при клике: победа → этот НФ → сброс. Если уже стоит победитель (A или B), клик по противнику выставляет ему НФ. */
function getNextOutcomeForClick(currentOutcome, side) {
  if (side === 'A') {
    if (!currentOutcome) return 'A_WIN';
    if (currentOutcome === 'A_WIN') return 'B_WIN';
    if (currentOutcome === 'B_WIN') return 'A_DNF';
    if (currentOutcome === 'A_DNF') return null;
    if (currentOutcome === 'BOTH_DNF') return null;
    if (currentOutcome === 'B_DNF') return 'BOTH_DNF';
    return null;
  } else {
    if (!currentOutcome) return 'B_WIN';
    if (currentOutcome === 'B_WIN') return 'A_WIN';
    if (currentOutcome === 'A_WIN') return 'B_DNF';
    if (currentOutcome === 'B_DNF') return null;
    if (currentOutcome === 'BOTH_DNF') return null;
    if (currentOutcome === 'A_DNF') return 'BOTH_DNF';
    return null;
  }
}

function renderParallelPairs(rerenderTable) {
  const tbody = document.getElementById('parallelPairsBody');
  const { getData } = window.SnowContestAdminData;
  const { athleteLabel, athleteLabelText, getPointsForOutcome, outcomeLabel } = window.SnowContestPairRender;
  const { escapeHtml } = window.SnowContestUI;
  const d = getData();

  /* Актуализируем h2hResults и считаем очки через createH2hResult (wins*2 + losses) */
  window.SnowContestAdminPairs.recalculateH2hFromPairs();
  const h2hPointsByAthleteId = new Map();
  (d.h2hResults || []).forEach(r => {
    const res = window.SnowContest.createH2hResult(r.athleteId, r.wins, r.losses, r.dnfs);
    h2hPointsByAthleteId.set(r.athleteId, res.h2hPoints);
  });

  /** Бейдж исхода: только +{очки}, один стиль для всех случаев. */
  const outcomeBadgeHtml = (points) => {
    if (points == null) return '';
    return `<span class="outcome-badge" title="Очки за заезд">+${points}</span>`;
  };

  /* pairTotalPoints больше не используется — очки берём из h2hPointsByAthleteId (createH2hResult) */
  const renderAttemptCell = (pair, outcome, redText, greenText, index, attemptNum, isSecondAttempt) => {
    const redIsA = !isSecondAttempt;
    const points = getPointsForOutcome(outcome);
    const redPoints = redIsA ? points.a : points.b;
    const greenPoints = redIsA ? points.b : points.a;
    const redWinClass = redPoints === 2 ? ' track-badge-outcome-win' : '';
    const greenWinClass = greenPoints === 2 ? ' track-badge-outcome-win' : '';
    const redDnfClass = redPoints === 0 ? ' track-badge-outcome-dnf' : '';
    const greenDnfClass = greenPoints === 0 ? ' track-badge-outcome-dnf' : '';
    const redSecondClass = redPoints === 1 ? ' track-badge-outcome-second' : '';
    const greenSecondClass = greenPoints === 1 ? ' track-badge-outcome-second' : '';
    const leftText = isSecondAttempt ? greenText : redText;
    const rightText = isSecondAttempt ? redText : greenText;
    const resultLine = `<div class="pair-attempt-points${outcome ? '' : ' pair-attempt-points-waiting'}">${outcomeLabel(outcome, leftText, rightText)}</div>`;
    return `
      <div class="pair-attempt-line">
        <span class="track-badges">
          <span class="track-badge-row">
            <span class="track-badge track-badge-red track-badge-clickable${redWinClass}${redDnfClass}${redSecondClass}" data-pair-index="${index}" data-attempt="${attemptNum}" data-side="${redIsA ? 'A' : 'B'}" title="Клик: победа (2 очк.) → НФ (0) → сброс">${escapeHtml(redText)}</span>
            ${outcomeBadgeHtml(redPoints)}
          </span>
          <span class="track-badge-row">
            <span class="track-badge track-badge-green track-badge-clickable${greenWinClass}${greenDnfClass}${greenSecondClass}" data-pair-index="${index}" data-attempt="${attemptNum}" data-side="${redIsA ? 'B' : 'A'}" title="Клик: победа (2 очк.) → НФ (0) → сброс">${escapeHtml(greenText)}</span>
            ${outcomeBadgeHtml(greenPoints)}
          </span>
        </span>
      </div>
      ${resultLine}
    `;
  };

  const order = window.SnowContestAdminPairs.getParallelPairsOrderByFirstAthleteRating();
  const rows = order.map(originalIndex => {
    const pair = d.parallelPairs[originalIndex];
    const leftLabel = athleteLabel(pair.athlete1Id, pair.athlete1Label, d.athletes);
    const rightLabel = athleteLabel(pair.athlete2Id, pair.athlete2Label, d.athletes);
    const leftOutcomeText = athleteLabelText(pair.athlete1Id, pair.athlete1Label, d.athletes);
    const rightOutcomeText = athleteLabelText(pair.athlete2Id, pair.athlete2Label, d.athletes);
    return { pair, index: originalIndex, leftLabel, rightLabel, leftOutcomeText, rightOutcomeText };
  });

  tbody.innerHTML = rows.map(row => {
    const ptsA = h2hPointsByAthleteId.get(row.pair.athlete1Id);
    const ptsB = row.pair.athlete2Id ? h2hPointsByAthleteId.get(row.pair.athlete2Id) : undefined;
    const totalCell = `
      <div class="pair-total-points-line">${escapeHtml(row.leftOutcomeText)} : ${ptsA ?? '—'}</div>
      <div class="pair-total-points-line">${escapeHtml(row.rightOutcomeText)} : ${ptsB ?? '—'}</div>
    `;
    return `
    <tr class="pair-header-row">
      <td colspan="3" class="pair-header-cell">${row.leftLabel} <strong>vs</strong> ${row.rightLabel}</td>
    </tr>
    <tr data-index="${row.index}">
      <td class="pair-total-points">${totalCell}</td>
      <td>
        ${renderAttemptCell(row.pair, row.pair.outcomeAttempt1, row.leftOutcomeText, row.rightOutcomeText, row.index, 1, false)}
      </td>
      <td>
        ${renderAttemptCell(row.pair, row.pair.outcomeAttempt2, row.rightOutcomeText, row.leftOutcomeText, row.index, 2, true)}
      </td>
    </tr>
  `;
  }).join('') || '<tr><td colspan="3" class="no-data">Нажмите «Рассчитать рейтинг и сформировать пары» после заполнения квалификации</td></tr>';

  window.SnowContestAdminSort.updateSortIndicators();

  tbody.querySelectorAll('.track-badge-clickable').forEach(badge => {
    badge.addEventListener('click', () => {
      const idx = parseInt(badge.dataset.pairIndex, 10);
      const attemptNum = parseInt(badge.dataset.attempt, 10);
      const side = badge.dataset.side;
      const field = attemptNum === 1 ? 'outcomeAttempt1' : 'outcomeAttempt2';
      const current = d.parallelPairs[idx][field];
      d.parallelPairs[idx][field] = getNextOutcomeForClick(current, side);
      d.meta.stage1Calculated = false;
      d.meta.finalCalculated = false;
      window.SnowContestAdminPairs.recalculateH2hFromPairs();
      window.SnowContestAdminRender.renderParallelPairs(rerenderTable);
      window.SnowContestAdminRender.renderCross(rerenderTable);
    });
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminRenderPairs = {
    getNextOutcomeForClick,
    renderParallelPairs
  };
}
