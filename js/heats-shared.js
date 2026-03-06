/**
 * Общая логика хитов кросса: участники заездов, сетка туров, итоговые места по классу.
 * Используется страницей рейтинга (только отображение) и админкой (отображение + редактирование).
 */

const ROUND_LABELS = [
  { key: 'round1',       label: 'Тур 1',                             shortLabel: 'Тур 1',          branch: 'upper' },
  { key: 'round2Upper',  label: 'Тур 2 — за верхние места',          shortLabel: 'Тур 2 — верхняя сетка',   branch: 'upper' },
  { key: 'round2Lower',  label: 'Тур 2 — за нижние места',           shortLabel: 'Тур 2 — нижняя сетка',    branch: 'lower' },
  { key: 'round3Upper',  label: 'Тур 3 — за верхние места',          shortLabel: 'Тур 3 — верхняя сетка',   branch: 'upper' },
  { key: 'round3Lower',  label: 'Тур 3 — за нижние места',           shortLabel: 'Тур 3 — нижняя сетка',    branch: 'lower' },
  { key: 'round4Upper',  label: 'Тур 4 — за верхние места',          shortLabel: 'Тур 4 — верхняя сетка',   branch: 'upper' },
  { key: 'round4Lower',  label: 'Тур 4 — за нижние места',           shortLabel: 'Тур 4 — нижняя сетка',    branch: 'lower' },
  { key: 'round5Upper',  label: 'Тур 5 — за верхние места',          shortLabel: 'Тур 5 — верхняя сетка',   branch: 'upper' },
  { key: 'round5Lower',  label: 'Тур 5 — за нижние места',           shortLabel: 'Тур 5 — нижняя сетка',    branch: 'lower' },
  { key: 'round6Upper',  label: 'Финал',                             shortLabel: 'Финал',          branch: 'upper' },
  { key: 'round6Lower',  label: 'Дополнительный заезд',              shortLabel: 'Доп. заезд',     branch: 'lower' }
];

function getHeatParticipants(heat) {
  return (heat.participants && heat.participants.length)
    ? heat.participants
    : (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
}

function sortParticipantsByPlace(participants) {
  return [...participants].sort((a, b) => {
    const pa = a.placeInHeat != null && a.placeInHeat !== '' ? Number(a.placeInHeat) : 9999;
    const pb = b.placeInHeat != null && b.placeInHeat !== '' ? Number(b.placeInHeat) : 9999;
    return pa - pb;
  });
}

function allHeatsFilled(classHeats) {
  if (!classHeats || typeof classHeats !== 'object') return false;
  for (const roundKey of Object.keys(classHeats)) {
    const heats = classHeats[roundKey];
    if (!Array.isArray(heats)) continue;
    for (const heat of heats) {
      const participants = getHeatParticipants(heat);
      const placeCounts = {};
      for (const p of participants) {
        const v = p.placeInHeat;
        if (v == null || v === '' || !Number.isInteger(Number(v)) || Number(v) < 1) return false;
        placeCounts[v] = (placeCounts[v] || 0) + 1;
      }
      if (Object.values(placeCounts).some(count => count > 1)) return false;
    }
  }
  return true;
}

function getClassesToShow(crossHeats, labels) {
  const boatClassOrder = Object.keys(labels).length ? Object.keys(labels) : Object.keys(crossHeats).sort();
  return boatClassOrder.filter(c => crossHeats[c]).concat(Object.keys(crossHeats).filter(c => !boatClassOrder.includes(c)));
}

/**
 * Строит массив bracketRounds для одного класса.
 * renderSlotRows(heat, participants, sortedParticipants, athleteById, escapeHtml, roundKey, numHeatsInRound, hasNextRound) возвращает HTML строк таблицы (tbody).
 */
function buildBracketRounds(classHeats, athleteById, roundLabels, escapeHtml, renderSlotRows) {
  const bracketRounds = [];
  let col = -1;

  const lastLowerRoundKey = (() => {
    const lowerWithHeats = roundLabels.filter(r => r.branch === 'lower' && Array.isArray(classHeats[r.key]) && classHeats[r.key].length > 0);
    if (!lowerWithHeats.length) return null;
    const withMax = lowerWithHeats.reduce((best, r) => {
      const num = parseInt(r.key.replace(/\D/g, ''), 10);
      const bestNum = best == null ? -1 : parseInt(best.key.replace(/\D/g, ''), 10);
      return num > bestNum ? r : best;
    }, null);
    return withMax ? withMax.key : null;
  })();

  function hasNextRound(roundKey) {
    if (roundKey === 'round1') return true;
    const m = roundKey.match(/round(\d+)(Upper|Lower)/);
    if (!m) return false;
    const nextKey = `round${parseInt(m[1], 10) + 1}${m[2]}`;
    return Array.isArray(classHeats[nextKey]) && classHeats[nextKey].length > 0;
  }

  for (const { key: roundKey, label: roundLabel, shortLabel, branch } of roundLabels) {
    const heats = classHeats[roundKey];
    if (!heats || !Array.isArray(heats) || heats.length === 0) continue;

    const hasNextDirect = hasNextRound(roundKey);
    const isUpperFinalRound = heats.length === 1 && branch === 'upper';
    const isLowerFinalRound = heats.length === 1 && branch === 'lower' && roundKey === lastLowerRoundKey;

    // Гранд-финал: одиночный верхний тур, у которого нет пары в нижней ветке.
    let isGrandFinalRound = false;
    if (isUpperFinalRound) {
      const m = String(roundKey).match(/round(\d+)Upper/);
      if (m) {
        const n = parseInt(m[1], 10);
        const lowerHeatsSameRound = classHeats[`round${n}Lower`];
        if (!Array.isArray(lowerHeatsSameRound) || lowerHeatsSameRound.length === 0) {
          isGrandFinalRound = true;
        }
      }
    }

    // Победители полуфиналов (одиночный тур, но не гранд-финал) тоже считаются "идущими дальше".
    const advancesFromThisRound = hasNextDirect || (!isGrandFinalRound && (isUpperFinalRound || isLowerFinalRound));

    const slots = heats.map(heat => {
      const participants = getHeatParticipants(heat);
      const sortedParticipants = sortParticipantsByPlace(participants);

      const label = roundKey === 'round1'
        ? `Хит ${heat.heatIndex}`
        : isGrandFinalRound
          ? 'Финал'
          : isUpperFinalRound
            ? 'Полуфинал верхней сетки'
            : isLowerFinalRound
              ? 'Полуфинал нижней сетки'
              : `Хит ${heat.heatIndex}`;

      const rows = renderSlotRows(heat, participants, sortedParticipants, athleteById, escapeHtml, roundKey, heats.length, advancesFromThisRound);
      const tableHtml = `<table class="heats-table heat-single-table bracket-slot-table">
        <thead><tr><th>№</th><th>Участник</th><th>Место</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
      return { heatIndex: heat.heatIndex, label, roundKey, tableHtml };
    });

    if (roundKey === 'round1') {
      col++;
      bracketRounds.push({
        roundKey,
        roundLabel: escapeHtml(shortLabel != null ? shortLabel : roundLabel),
        upperSlots: slots,
        lowerSlots: [],
        isFirst: true
      });
    } else {
      const isUpper = branch === 'upper';
      if (isUpper) {
        col++;
        bracketRounds.push({
          roundKey,
          roundLabel: escapeHtml(shortLabel != null ? shortLabel : roundLabel),
          upperSlots: slots,
          lowerSlots: [],
          isFirst: false
        });
      } else {
        // Нижний тур стараемся положить в ту же колонку,
        // что и соответствующий верхний (если она ещё свободна),
        // и сохраняем отдельную подпись для нижней ветки.
        const last = bracketRounds[bracketRounds.length - 1];
        if (!last || (last.lowerSlots && last.lowerSlots.length > 0)) {
          // Отдельная колонка только для нижнего тура:
          // верхняя часть пустая, подпись идёт как lower-лейбл.
          col++;
          bracketRounds.push({
            roundKey,
            roundLabel: null,
            roundLabelLower: escapeHtml(shortLabel != null ? shortLabel : roundLabel),
            upperSlots: [],
            lowerSlots: slots,
            isFirst: false
          });
        } else {
          last.lowerSlots = slots;
          last.roundLabelLower = escapeHtml(shortLabel != null ? shortLabel : roundLabel);
        }
      }
    }
  }
  return bracketRounds;
}

function buildBracketHtml(bracketRounds, boatClass, escapeHtml) {
  if (!bracketRounds.length) return '';
  return `
  <div class="bracket-grid" data-heat-class="${escapeHtml(boatClass)}">
    ${bracketRounds.map((r, colIdx) => `
      <div class="bracket-column" data-round="${escapeHtml(r.roundKey)}">
        ${r.roundLabel ? `<div class="bracket-round-label bracket-round-label-upper">${r.roundLabel}</div>` : ''}
        <div class="bracket-branch bracket-upper">
          ${(r.upperSlots || []).map((s) => `
            <div class="bracket-slot" data-round-key="${escapeHtml(s.roundKey)}" data-heat-index="${s.heatIndex}" data-heat-class="${escapeHtml(boatClass)}">
              <span class="bracket-slot-label">${escapeHtml(s.label)}</span>
              ${s.tableHtml}
            </div>
          `).join('')}
        </div>
        ${(r.lowerSlots || []).length > 0 ? `
          <div class="bracket-branch bracket-lower">
            ${r.roundLabelLower ? `<div class="bracket-round-label bracket-round-label-lower">${r.roundLabelLower}</div>` : ''}
            ${(r.lowerSlots || []).map((s) => `
              <div class="bracket-slot" data-round-key="${escapeHtml(s.roundKey)}" data-heat-index="${s.heatIndex}" data-heat-class="${escapeHtml(boatClass)}">
                <span class="bracket-slot-label">${escapeHtml(s.label)}</span>
                ${s.tableHtml}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${colIdx < bracketRounds.length - 1 ? '<div class="bracket-connector" aria-hidden="true"></div>' : ''}
    `).join('')}
  </div>`;
}

/** Данные для таблицы «Итоговые места в кроссе» по классу. */
function buildClassPlacesData(athletes, crossPlaces, boatClass) {
  const classAthletes = athletes.filter(a => a.boatClass === boatClass);
  const withPlace = classAthletes.map(a => {
    const c = crossPlaces.find(x => x.athleteId === a.id) || {};
    return { athlete: a, place: c.place != null ? Number(c.place) : 9999 };
  });
  withPlace.sort((a, b) => a.place - b.place);
  return withPlace;
}

/** HTML строк таблицы мест в кроссе по классу. */
function buildClassPlacesRowsHtml(withPlace, escapeHtml) {
  const n = withPlace.length;
  return withPlace.map((x, i) => {
    const r2 = n - i;
    return `<tr>
      <td><span class="cross-place-num">${escapeHtml(x.athlete.id)}</span></td>
      <td>${escapeHtml(x.athlete.displayName || x.athlete.id)}</td>
      <td>${escapeHtml(x.athlete.cityClub || '')}</td>
      <td><strong>${x.place <= 9998 ? String(x.place) : '—'}</strong></td>
      <td><strong>${r2}</strong></td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" class="no-data">Нет участников</td></tr>';
}

function buildClassPlacesSection(classPlacesRowsHtml, filled, emptyMessage, options) {
  const showEditButton = !options || options.showEditButton !== false;
  const clubHeader =
    (typeof window !== 'undefined' &&
      window.SnowContestConstants &&
      window.SnowContestConstants.CLUB_COLUMN_HEADER) ||
    'Клуб';
  return filled
    ? `
    <div class="cross-class-places">
      <h4 class="cross-class-places-heading">
        Итоговые места в кроссе
        ${showEditButton ? '<button type="button" class="cross-class-places-edit-btn" title="Редактировать итоговые места вручную">✎</button>' : ''}
      </h4>
      <table class="cross-class-places-table">
        <thead><tr><th>Номер</th><th>Участник</th><th>${escapeHtml(clubHeader)}</th><th>Место</th><th>Баллы R2</th></tr></thead>
        <tbody>${classPlacesRowsHtml}</tbody>
      </table>
    </div>
  `
    : `<p class="muted" style="margin-top: 1rem;">${emptyMessage}</p>`;
}

/**
 * Экспортирует сетку хитов (.bracket-grid внутри блока класса) в PNG.
 * Используется и в админке, и на публичной странице рейтингов.
 */
function exportBracketGridAsPng(classBlock) {
  if (!classBlock || typeof window === 'undefined') return;
  const bracket = classBlock.querySelector('.bracket-grid');
  if (!bracket) return;
  const html2canvas = window.html2canvas || window.html2Canvas || window.Html2Canvas;
  if (!html2canvas) {
    alert('Экспорт недоступен: модуль html2canvas не загружен.');
    return;
  }
  const boatClass = classBlock.dataset.heatClass || 'cross';
  const classHeading = classBlock.querySelector('.cross-heats-class-heading');
  const labelText = (classHeading && classHeading.textContent ? classHeading.textContent : boatClass).trim();

  // Делаем невидимую копию сетки без скролла, чтобы захватить всю ширину.
  const clone = bracket.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.overflow = 'visible';
  clone.style.width = `${bracket.scrollWidth}px`;
  clone.style.height = `${bracket.scrollHeight}px`;
  clone.scrollLeft = 0;
  clone.scrollTop = 0;
  document.body.appendChild(clone);

  html2canvas(clone, {
    backgroundColor: '#ffffff',
    width: bracket.scrollWidth,
    height: bracket.scrollHeight,
    scale: 2
  }).then((canvas) => {
    document.body.removeChild(clone);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeLabel = labelText.replace(/[^\w\u0400-\u04FF]+/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `bracket-${safeLabel}-${dateStr}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }).catch(() => {
    document.body.removeChild(clone);
    alert('Не удалось создать изображение сетки.');
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestHeatsShared = {
    ROUND_LABELS,
    getHeatParticipants,
    sortParticipantsByPlace,
    allHeatsFilled,
    getClassesToShow,
    buildBracketRounds,
    buildBracketHtml,
    buildClassPlacesData,
    buildClassPlacesRowsHtml,
    buildClassPlacesSection,
    exportBracketGridAsPng
  };
}
