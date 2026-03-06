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
    const manualByClass = d.crossPlacesManual || {};
    for (const { athleteId, place, boatClass } of computed) {
      if (manualByClass && manualByClass[boatClass]) continue;
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

    const isCombined = typeof boatClass === 'string' && boatClass.endsWith(' общий заезд');
    let baseLabel = boatClass;
    if (isCombined) {
      baseLabel = boatClass.replace(/ общий заезд$/, '');
    } else if (labels[boatClass]) {
      baseLabel = String(labels[boatClass]).split(',')[0].trim();
    }
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
      return sortedParticipants.map((p) => {
        const name = escapeHtml(athleteById.get(p.athleteId)?.displayName || p.athleteId);
        const placeVal = p.placeInHeat != null && p.placeInHeat !== '' ? Number(p.placeInHeat) : '';
        const isDuplicate = placeVal !== '' && duplicatePlaces.has(placeVal);
        const isEmpty = placeVal === '';
        const options = '<option value=""' + (placeVal === '' ? ' selected' : '') + '>—</option>' + Array.from({ length: maxPlace }, (_, i) => i + 1).map(num => `<option value="${num}"${num === placeVal ? ' selected' : ''}>${num}</option>`).join('');
        const errorClass = (isEmpty || isDuplicate) ? ' heat-place-error' : '';
        // Фактический проход вверх помечается в cross-logic.getFromRound флагом p.advancesUpper.
        const advances = p.advancesUpper === true;
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

    let classPlacesHtml = '';
    if (isCombined) {
      // Для объединённой сетки (например, "Каяк общий заезд") строим две отдельные таблицы
      // итоговых мест по реальным зачётам (К1М и К1Ж / П1М и П1Ж).
      const combinedAthletes = d.athletes || [];
      const crossPlaces = d.crossPlaces || [];
      const underlyingClasses = Object.keys(labels).filter((cls) => {
        const full = String(labels[cls] || '');
        return full.startsWith(baseLabel);
      });

      classPlacesHtml = underlyingClasses.map((underClass) => {
        const withPlace = H.buildClassPlacesData(combinedAthletes, crossPlaces, underClass);
        const classPlacesRowsHtml = H.buildClassPlacesRowsHtml(withPlace, escapeHtml);
        const section = H.buildClassPlacesSection(
          classPlacesRowsHtml,
          filled,
          'Заполните места во всех хитах, чтобы увидеть итоговые места в кроссе по этому классу.'
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
      const withPlace = H.buildClassPlacesData(d.athletes || [], d.crossPlaces || [], boatClass);
      const classPlacesRowsHtml = H.buildClassPlacesRowsHtml(withPlace, escapeHtml);
      classPlacesHtml = H.buildClassPlacesSection(
        classPlacesRowsHtml,
        filled,
        'Заполните места во всех хитах, чтобы увидеть итоговые места в кроссе.'
      );
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

  block.querySelectorAll('.heat-place-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const boatClass = sel.dataset.heatClass;
      const roundKey = sel.dataset.roundKey;
      const heatIndex = parseInt(sel.dataset.heatIndex, 10);
      const athleteId = sel.dataset.athleteId;
      const placeInHeat = sel.value === '' ? null : parseInt(sel.value, 10);

      // Запоминаем горизонтальный скролл сетки для этого класса,
      // чтобы при перерисовке не прыгало в начало.
      let prevScrollLeft = 0;
      const classBlock = sel.closest('.cross-heats-class-block');
      if (classBlock) {
        const bracket = classBlock.querySelector('.bracket-grid');
        if (bracket && typeof bracket.scrollLeft === 'number') {
          prevScrollLeft = bracket.scrollLeft;
        }
      }

      const classHeats = d.crossHeats && d.crossHeats[boatClass];
      if (!classHeats) return;
      const heats = classHeats[roundKey];
      const heat = heats && heats.find(h => h.heatIndex === heatIndex);
      if (heat) {
        if (heat.participants) {
          const p = heat.participants.find(x => x.athleteId === athleteId);
          if (p) p.placeInHeat = placeInHeat;
        } else {
          if (!heat.participants) {
            heat.participants = (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
          }
          const p = heat.participants.find(x => x.athleteId === athleteId);
          if (p) p.placeInHeat = placeInHeat;
        }
        clearRoundsAfter(classHeats, roundKey);
        saveDataToStorage();
        renderCross();

        // Восстанавливаем положение горизонтального скролла для этого класса.
        if (typeof prevScrollLeft === 'number') {
          const root = document.getElementById('crossHeatsBlock');
          if (root) {
            const escapedClass = boatClass.replace(/"/g, '\\"');
            const newClassBlock = root.querySelector(`.cross-heats-class-block[data-heat-class="${escapedClass}"]`);
            const newBracket = newClassBlock && newClassBlock.querySelector('.bracket-grid');
            if (newBracket && typeof newBracket.scrollLeft === 'number') {
              newBracket.scrollLeft = prevScrollLeft;
            }
          }
        }
      }
    });
  });

  // Ручное редактирование итоговых мест по классу из таблицы cross-class-places-table.
  block.querySelectorAll('.cross-heats-class-block').forEach(classBlock => {
    const boatClass = classBlock.dataset.heatClass;
    const placesTable = classBlock.querySelector('.cross-class-places-table');
    const editBtn = classBlock.querySelector('.cross-class-places-edit-btn');
    if (!placesTable || !editBtn) return;

    let isEditing = false;

    editBtn.addEventListener('click', () => {
      const { getData, saveDataToStorage } = window.SnowContestAdminData;

      if (!isEditing) {
        const tbody = placesTable.querySelector('tbody');
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const n = rows.length;

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          const placeCell = cells[2];
          const currentText = placeCell.textContent.trim();
          const currentPlace = currentText === '—' ? '' : currentText;
          placeCell.innerHTML = '';
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '1';
          input.max = String(n);
          input.value = currentPlace;
          input.className = 'cross-place-input';
          placeCell.appendChild(input);
        });

        editBtn.textContent = '✔';
        editBtn.title = 'Сохранить ручные места';
        isEditing = true;
      } else {
        const tbody = placesTable.querySelector('tbody');
        if (!tbody) return;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const updates = [];

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          const athleteId = cells[0].textContent.trim();
          const input = cells[2].querySelector('input');
          if (!athleteId || !input) return;
          const val = input.value.trim();
          if (val === '') return;
          const place = parseInt(val, 10);
          if (!Number.isFinite(place) || place < 1) return;
          updates.push({ athleteId, place });
        });

        if (updates.length === 0) {
          isEditing = false;
          editBtn.textContent = '✎';
          editBtn.title = 'Редактировать итоговые места вручную';
          renderCross();
          return;
        }

        const d = getData();
        if (!Array.isArray(d.crossPlaces)) d.crossPlaces = [];
        // Переписываем записи по athleteId, чтобы не было дублей и старых значений.
        updates.forEach(u => {
          d.crossPlaces = d.crossPlaces.filter(x => x.athleteId !== u.athleteId);
          d.crossPlaces.push({ athleteId: u.athleteId, place: u.place });
        });

        d.crossPlacesManual = d.crossPlacesManual || {};
        d.crossPlacesManual[boatClass] = true;

        saveDataToStorage();
        isEditing = false;
        editBtn.textContent = '✎';
        editBtn.title = 'Редактировать итоговые места вручную';

        // После изменения мест в кроссе пересчитываем итоговый рейтинг (если он уже был рассчитан).
        try {
          if (d.meta && d.meta.finalCalculated) {
            window.SnowContestAdminPublish.publishFinalRating();
          }
        } catch (e) {
          // Если что-то пошло не так, просто перерисуем кросс; сообщение об ошибке покажет publishFinalRating.
        }

        renderCross();
      }
    });
  });

  // Кнопка экспорта сетки в картинку (админка).
  block.querySelectorAll('.bracket-export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const classBlock = btn.closest('.cross-heats-class-block');
      if (!classBlock) return;
      H.exportBracketGridAsPng(classBlock);
    });
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminRenderCross = {
    renderCross,
    renderCrossHeats
  };
}
