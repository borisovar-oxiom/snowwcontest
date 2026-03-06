/**
 * Отрисовка блоков страницы рейтингов: квалификация, пары, R1, хиты, итог по классам.
 * Только отображение; все расчёты выполняются в админке и приходят в publication.
 */

function renderQualification(publication) {
  const tbody = document.getElementById('qualTable');
  const { badge } = window.SnowContestUI;
  const { formatQualificationValue, formatQualificationTotalTime, getQualificationDraftSortValue } = window.SnowContestQualificationFormat;
  const q = publication.qualification || [];
  const hasCalculatedRating = q.some(row => row.place != null || row.qualificationPoints != null);
  const qForRender = hasCalculatedRating
    ? q
    : [...q].sort((a, b) => {
        const diff = getQualificationDraftSortValue(a) - getQualificationDraftSortValue(b);
        if (diff !== 0) return diff;
        return (a.athlete?.id || '').localeCompare(b.athlete?.id || '', 'ru', { numeric: true, sensitivity: 'base' });
      });

  if (!q.length) {
    const athletes = publication.athletes || [];
    tbody.innerHTML = athletes.map(a => `
      <tr>
        <td>—</td>
        <td>${a.displayName}</td>
        <td>${a.cityClub || ''}</td>
        <td>${badge(a.boatClass)}</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="no-data">Нет данных</td></tr>';
    return;
  }

  const fmt = (val) => formatQualificationValue(val, 'НФ');
  const totalTime = (row) => formatQualificationTotalTime(row, 'НФ');

  tbody.innerHTML = qForRender.map(row => `
    <tr>
      <td>${row.place ?? '—'}</td>
      <td>${row.athlete.displayName}</td>
      <td>${row.athlete.cityClub || ''}</td>
      <td>${badge(row.athlete.boatClass)}</td>
      <td>${fmt(row.redTrackSeconds)}</td>
      <td>${fmt(row.greenTrackSeconds)}</td>
      <td>${totalTime(row)}</td>
      <td>${row.qualificationPoints ?? '—'}</td>
    </tr>
  `).join('') || '<tr><td colspan="8" class="no-data">Нет данных</td></tr>';
}

function renderPairs(publication) {
  const tbody = document.getElementById('pairsTable');
  const athletes = publication.athletes || [];
  const pairs = publication.parallelPairs || [];
  const stage1 = publication.stage1 || [];
  const { athleteLabel, athleteLabelText, getPointsForOutcome, outcomeLabel } = window.SnowContestPairRender;
  const { escapeHtml } = window.SnowContestUI;

  const h2hPointsByAthleteId = new Map();
  stage1.forEach(row => {
    const id = row.athlete?.id;
    if (id != null && row.h2hPoints != null) h2hPointsByAthleteId.set(id, row.h2hPoints);
  });

  const order = window.SnowContestAdminPairs.getParallelPairsOrderByFirstAthleteRatingFromPublication(publication);
  const rows = order.map(i => pairs[i]).filter(Boolean);

  const outcomeBadgeHtml = (points) => {
    if (points == null) return '';
    return `<span class="outcome-badge" title="Очки за заезд">+${points}</span>`;
  };

  const trackClass = (points) => {
    if (points === 2) return ' track-badge-outcome-win';
    if (points === 0) return ' track-badge-outcome-dnf';
    if (points === 1) return ' track-badge-outcome-second';
    return '';
  };

  const renderAttemptCell = (pair, outcome, redText, greenText, isSecondAttempt) => {
    const redIsA = !isSecondAttempt;
    const points = getPointsForOutcome(outcome);
    const redPoints = redIsA ? points.a : points.b;
    const greenPoints = redIsA ? points.b : points.a;
    const leftText = isSecondAttempt ? greenText : redText;
    const rightText = isSecondAttempt ? redText : greenText;
    const resultLine = `<div class="pair-attempt-points${outcome ? '' : ' pair-attempt-points-waiting'}">${outcomeLabel(outcome, leftText, rightText)}</div>`;
    return `
      <div class="pair-attempt-line">
        <span class="track-badges">
          <span class="track-badge-row">
            <span class="track-badge track-badge-red${trackClass(redPoints)}">${escapeHtml(redText)}</span>
            ${outcomeBadgeHtml(redPoints)}
          </span>
          <span class="track-badge-row">
            <span class="track-badge track-badge-green${trackClass(greenPoints)}">${escapeHtml(greenText)}</span>
            ${outcomeBadgeHtml(greenPoints)}
          </span>
        </span>
      </div>
      ${resultLine}
    `;
  };

  tbody.innerHTML = rows.map(pair => {
    const leftLabel = athleteLabel(pair.athlete1Id, pair.athlete1Label, athletes);
    const rightLabel = athleteLabel(pair.athlete2Id, pair.athlete2Label, athletes);
    const leftOutcomeText = athleteLabelText(pair.athlete1Id, pair.athlete1Label, athletes);
    const rightOutcomeText = athleteLabelText(pair.athlete2Id, pair.athlete2Label, athletes);
    const ptsA = h2hPointsByAthleteId.get(pair.athlete1Id);
    const ptsB = pair.athlete2Id ? h2hPointsByAthleteId.get(pair.athlete2Id) : undefined;
    const totalCell = `
      <div class="pair-total-points-line">${escapeHtml(leftOutcomeText)} : ${ptsA ?? '—'}</div>
      <div class="pair-total-points-line">${escapeHtml(rightOutcomeText)} : ${ptsB ?? '—'}</div>
    `;
    return `
    <tr class="pair-header-row">
      <td colspan="3" class="pair-header-cell">${leftLabel} <strong>vs</strong> ${rightLabel}</td>
    </tr>
    <tr>
      <td class="pair-total-points">${totalCell}</td>
      <td>${renderAttemptCell(pair, pair.outcomeAttempt1, leftOutcomeText, rightOutcomeText, false)}</td>
      <td>${renderAttemptCell(pair, pair.outcomeAttempt2, rightOutcomeText, leftOutcomeText, true)}</td>
    </tr>
  `;
  }).join('') || '<tr><td colspan="3" class="no-data">Нет данных</td></tr>';
}

function renderStage1(publication) {
  const tbody = document.getElementById('stage1Table');
  const { badge } = window.SnowContestUI;
  const s = publication.stage1 || [];
  tbody.innerHTML = s.map((row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${row.athlete.displayName}</td>
      <td>${row.athlete.cityClub || ''}</td>
      <td>${badge(row.athlete.boatClass)}</td>
      <td>${row.qualificationPoints}</td>
      <td>${row.h2hWins}</td>
      <td>${row.h2hPoints}</td>
      <td><strong>${row.r1}</strong></td>
    </tr>
  `).join('') || '<tr><td colspan="8" class="no-data">Нет данных</td></tr>';
}

function renderFinal(publication) {
  const container = document.getElementById('finalByClass');
  const { badge } = window.SnowContestUI;
  const { BOAT_CLASS_TO_HASH, CLUB_COLUMN_HEADER } = window.SnowContestConstants;
  const final = publication.finalResults || [];
  const labels = publication.boatClassLabels || {};
  const classes = ['К1М', 'К1Ж', 'П1М', 'П1Ж'];
  let html = '';
  for (const cls of classes) {
    const inClass = final.filter(r => r.athlete.boatClass === cls);
    if (inClass.length === 0) continue;
    const label = labels[cls] || cls;
    const classHashId = BOAT_CLASS_TO_HASH[cls] || cls;
    html += `
      <div class="ranking-class" id="final-${classHashId}">
        <h3>${badge(cls)} ${label} <a href="#final-${classHashId}" class="tab-link" title="Ссылка на эту таблицу">#</a></h3>
        <table>
          <thead>
            <tr>
              <th>Место</th>
              <th>Участник</th>
              <th>${CLUB_COLUMN_HEADER || 'Клуб'}</th>
              <th>Место в кроссе</th>
              <th>R1</th>
              <th>R2</th>
              <th>R (итого)</th>
            </tr>
          </thead>
          <tbody>
            ${inClass.map(r => `
              <tr>
                <td>${r.finalPlaceInClass}</td>
                <td>${r.athlete.displayName}</td>
                <td>${r.athlete.cityClub || ''}</td>
                <td>${r.crossPlace}</td>
                <td>${r.r1}</td>
                <td>${r.r2}</td>
                <td><strong>${r.totalRating}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  container.innerHTML = html || '<p class="no-data">Нет данных</p>';
}

function renderHeats(publication) {
  const block = document.getElementById('heatsBlock');
  if (!block) return;
  const { escapeHtml } = window.SnowContestUI;
  const H = window.SnowContestHeatsShared;
  const labels = publication.boatClassLabels || window.SnowContest.BOAT_CLASS_LABELS || {};
  const crossHeats = publication.crossHeats;
  const crossPlaces = publication.crossPlaces || [];
  const athletes = publication.athletes || [];

  if (!crossHeats || typeof crossHeats !== 'object' || Object.keys(crossHeats).length === 0) {
    block.innerHTML = '<p class="no-data muted">Хиты для кросса не опубликованы.</p>';
    return;
  }

  const athleteById = new Map(athletes.map(a => [a.id, a]));

  function renderSlotRows(heat, participants, sortedParticipants, athleteById, escapeHtml, roundKey, numHeatsInRound, hasNextRound) {
    const isFinalRound = numHeatsInRound === 1 && roundKey !== 'round1';
    const hasNext = hasNextRound !== undefined ? hasNextRound : !isFinalRound;
    return sortedParticipants.map((p) => {
      const name = escapeHtml(athleteById.get(p.athleteId)?.displayName || p.athleteId);
      const placeVal = p.placeInHeat != null && p.placeInHeat !== '' ? Number(p.placeInHeat) : '—';
      // Подсветка ровно по флагу, который ставит cross-logic.getFromRound.
      const advancesUpper = p.advancesUpper === true && hasNext;
      const rowClass = advancesUpper ? ' class="heat-row-advances-upper"' : '';
      return `<tr${rowClass}>
        <td class="heat-row-num">${escapeHtml(p.athleteId)}</td>
        <td>${name}</td>
        <td>${placeVal}</td>
      </tr>`;
    }).join('');
  }

  const parts = [];
  const classesToShow = H.getClassesToShow(crossHeats, labels);

  for (const boatClass of classesToShow) {
    const classHeats = crossHeats[boatClass];
    if (!classHeats) continue;
    const isCombined = typeof boatClass === 'string' && boatClass.endsWith(' общий заезд');
    let baseLabel = boatClass;
    if (isCombined) {
      baseLabel = boatClass.replace(/ общий заезд$/, '');
    } else if (labels[boatClass]) {
      baseLabel = String(labels[boatClass]).split(',')[0].trim();
    }
    const classLabel = escapeHtml(labels[boatClass] || boatClass);
    const bracketRounds = H.buildBracketRounds(classHeats, athleteById, H.ROUND_LABELS, escapeHtml, renderSlotRows);
    const bracketHtml = H.buildBracketHtml(bracketRounds, boatClass, escapeHtml);
    const filled = H.allHeatsFilled(classHeats);

    let classPlacesHtml = '';
    if (isCombined) {
      const underlyingClasses = Object.keys(labels).filter((cls) => {
        const full = String(labels[cls] || '');
        return full.startsWith(baseLabel);
      });
      classPlacesHtml = underlyingClasses.map((underClass) => {
        const withPlace = H.buildClassPlacesData(athletes, crossPlaces, underClass);
        const classPlacesRowsHtml = H.buildClassPlacesRowsHtml(withPlace, escapeHtml);
        const section = H.buildClassPlacesSection(
          classPlacesRowsHtml,
          filled,
          'Ожидает результат.',
          { showEditButton: false }
        );
        const labelText = escapeHtml(labels[underClass] || underClass);
        return `
          <div class="cross-class-places-wrapper" data-boat-class="${escapeHtml(underClass)}">
            <h4 class="cross-class-places-heading-by-class">${labelText}</h4>
            ${section}
          </div>
        `;
      }).join('');
    } else {
      const withPlace = H.buildClassPlacesData(athletes, crossPlaces, boatClass);
      const classPlacesRowsHtml = H.buildClassPlacesRowsHtml(withPlace, escapeHtml);
      classPlacesHtml = H.buildClassPlacesSection(classPlacesRowsHtml, filled, 'Ожидает результат.', { showEditButton: false });
    }

    if (bracketRounds.length === 0) continue;
    parts.push(`
      <div class="cross-heats-class-block" data-heat-class="${escapeHtml(boatClass)}">
        <h3 class="cross-heats-class-heading">${classLabel}</h3>
        <div class="cross-heats-tools">
          <button type="button" class="bracket-export-btn" data-heat-class="${escapeHtml(boatClass)}">Экспорт сетки в PNG</button>
        </div>
        ${bracketHtml}
        ${classPlacesHtml}
      </div>
    `);
  }
  block.innerHTML = parts.length ? parts.join('') : '<p class="no-data muted">Хиты по классам не сформированы.</p>';

  // Кнопка экспорта сетки в картинку (публичная страница рейтинга).
  block.querySelectorAll('.bracket-export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const classBlock = btn.closest('.cross-heats-class-block');
      if (!classBlock) return;
      H.exportBracketGridAsPng(classBlock);
    });
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestRatingRender = {
    renderQualification,
    renderPairs,
    renderStage1,
    renderHeats,
    renderFinal
  };
}
