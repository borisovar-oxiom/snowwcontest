/**
 * Пары H2H в админке: превью R1, генерация пар, пересчёт H2H из исходов.
 */

/** Оптимальное число хитов (степень двойки 1,2,4,8) и участников в хите (3 или 4) по положению. */
function getHeatConfig(n) {
  if (n <= 0) return { numHeats: 0, perHeat: 0 };
  if (n <= 4) return { numHeats: 1, perHeat: 4 };
  if (n <= 6) return { numHeats: 2, perHeat: 3 };
  if (n <= 8) return { numHeats: 2, perHeat: 4 };
  if (n <= 12) return { numHeats: 4, perHeat: 3 };
  if (n <= 16) return { numHeats: 4, perHeat: 4 };
  if (n <= 24) return { numHeats: 8, perHeat: 3 };
  return { numHeats: 8, perHeat: 4 };
}

/** Распределяет n участников по numHeats хитам так, чтобы в каждом хите было не меньше 2. Возвращает массив размеров [s0, s1, ...]. */
function getHeatSizes(n, numHeats, perHeat) {
  const minPerHeat = 2;
  if (n >= minPerHeat * numHeats && n <= perHeat * numHeats) {
    const sizes = Array(numHeats).fill(minPerHeat);
    let extra = n - minPerHeat * numHeats;
    for (let h = 0; h < numHeats && extra > 0; h++) {
      const add = Math.min(extra, perHeat - minPerHeat);
      sizes[h] += add;
      extra -= add;
    }
    return sizes;
  }
  const sizes = [];
  let left = n;
  for (let h = 0; h < numHeats; h++) {
    const take = h === numHeats - 1 ? left : Math.min(perHeat, Math.max(0, left));
    sizes.push(Math.max(0, take));
    left -= take;
  }
  return sizes;
}

/**
 * Формирует хиты для кросса по классам (К1М, К1Ж, П1М, П1Ж).
 * В каждом классе — своя сетка хитов; участники упорядочены по месту R1 внутри класса,
 * затем змейка (высокий + низкий рейтинг в одном заезде) и раздача по хитам.
 */
function buildCrossHeats(d) {
  const stage1Preview = buildStage1PreviewByAthleteId();
  const byClass = new Map();
  for (const a of d.athletes || []) {
    if (!byClass.has(a.boatClass)) byClass.set(a.boatClass, []);
    byClass.get(a.boatClass).push(a);
  }
  const result = {};
  for (const [boatClass, athletes] of byClass) {
    const withR1 = athletes.map(a => ({
      athlete: a,
      r1: stage1Preview.get(a.id)?.r1 ?? -1,
      place: stage1Preview.get(a.id)?.place ?? 999
    }));
    withR1.sort((a, b) => {
      if (b.r1 !== a.r1) return b.r1 - a.r1;
      return a.place - b.place;
    });
    const orderedIds = withR1.map(x => x.athlete.id);
    const n = orderedIds.length;
    const { numHeats, perHeat } = getHeatConfig(n);
    if (numHeats === 0) {
      result[boatClass] = [];
      continue;
    }
    const heatSizes = getHeatSizes(n, numHeats, perHeat);
    const snakeOrder = [];
    for (let i = 0; i < n; i++) {
      const pos = (i % 2 === 0) ? (i / 2) : (n - 1 - (i - 1) / 2);
      snakeOrder.push(orderedIds[pos]);
    }
    const heats = [];
    let offset = 0;
    for (let h = 0; h < numHeats; h++) {
      const size = heatSizes[h] || 0;
      if (size === 0) continue;
      const athleteIds = snakeOrder.slice(offset, offset + size);
      offset += size;
      if (athleteIds.length > 0) {
        heats.push({
          heatIndex: h + 1,
          boatClass,
          athleteIds,
          participants: athleteIds.map((id) => ({ athleteId: id, placeInHeat: null }))
        });
      }
    }
    result[boatClass] = { round1: heats };
  }
  return result;
}

/** Из каждого хита берём места 1 и 2 (в порядке: хит1 место1, хит1 место2, хит2 место1, …). Если в хите только 2 участника и хитов больше одного — берём только место 1. */
function getUpperFromRound(heats) {
  const ids = [];
  const heatList = heats || [];
  for (const heat of heatList) {
    const participants = (heat.participants && heat.participants.length) ? heat.participants : (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
    const byPlace = new Map();
    participants.forEach(p => { if (p.placeInHeat != null && p.placeInHeat !== '') byPlace.set(Number(p.placeInHeat), p.athleteId); });
    const onlyOneHeatWithTwo = heatList.length === 1 && participants.length <= 2;
    const placesToTake = (!onlyOneHeatWithTwo && participants.length <= 2) ? [1] : [1, 2];
    placesToTake.forEach(place => { if (byPlace.has(place)) ids.push(byPlace.get(place)); });
  }
  return ids;
}

/** Из каждого хита берём в нижнюю сетку: при одном хите с 2 участниками — никого; при 2 участниках в хите (и хитов несколько) — место 2; при 3+ — места 3, 4, … */
function getLowerFromRound(heats) {
  const ids = [];
  const heatList = heats || [];
  for (const heat of heatList) {
    const participants = (heat.participants && heat.participants.length) ? heat.participants : (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
    const onlyOneHeatWithTwo = heatList.length === 1 && participants.length <= 2;
    if (onlyOneHeatWithTwo) continue;
    const minPlace = participants.length <= 2 ? 2 : 3;
    participants
      .filter(p => p.placeInHeat != null && p.placeInHeat !== '' && Number(p.placeInHeat) >= minPlace)
      .sort((a, b) => Number(a.placeInHeat) - Number(b.placeInHeat))
      .forEach(p => ids.push(p.athleteId));
  }
  return ids;
}

/** Проверяет, что во всех хитах тура проставлены уникальные места (нет пустых и дубликатов). */
function isRoundComplete(heats) {
  if (!heats || heats.length === 0) return false;
  for (const heat of heats) {
    const participants = (heat.participants && heat.participants.length) ? heat.participants : (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
    const places = new Set();
    for (const p of participants) {
      const v = p.placeInHeat;
      if (v == null || v === '') return false;
      const n = Number(v);
      if (places.has(n)) return false;
      places.add(n);
    }
  }
  return true;
}

/** Формирует хиты из списка id (змейка, места пустые). Используется для следующих туров. */
function buildHeatsFromParticipantIds(athleteIds, boatClass) {
  const n = athleteIds.length;
  if (n === 0) return [];
  const { numHeats, perHeat } = getHeatConfig(n);
  if (numHeats === 0) return [];
  const heatSizes = getHeatSizes(n, numHeats, perHeat);
  const snakeOrder = [];
  for (let i = 0; i < n; i++) {
    const pos = (i % 2 === 0) ? (i / 2) : (n - 1 - (i - 1) / 2);
    snakeOrder.push(athleteIds[pos]);
  }
  const heats = [];
  let offset = 0;
  for (let h = 0; h < numHeats; h++) {
    const size = heatSizes[h] || 0;
    if (size === 0) continue;
    const ids = snakeOrder.slice(offset, offset + size);
    offset += size;
    if (ids.length > 0) {
      heats.push({
        heatIndex: h + 1,
        boatClass,
        athleteIds: ids,
        participants: ids.map((id) => ({ athleteId: id, placeInHeat: null }))
      });
    }
  }
  return heats;
}

/** Дополняет crossHeats следующими турами (за верхние / за нижние места), пока в ветке больше одного хита. */
function ensureNextRounds(d) {
  if (!d.crossHeats || typeof d.crossHeats !== 'object') return;
  let changed = false;
  for (const boatClass of Object.keys(d.crossHeats)) {
    const ch = d.crossHeats[boatClass];
    if (!ch) continue;
    let classHeats = ch;
    if (Array.isArray(classHeats)) {
      d.crossHeats[boatClass] = { round1: classHeats };
      classHeats = d.crossHeats[boatClass];
      changed = true;
    }
    const round1 = classHeats.round1;
    if (!round1 || !Array.isArray(round1)) continue;
    if (round1.length > 1 && isRoundComplete(round1)) {
      if (!classHeats.round2Upper) {
        classHeats.round2Upper = buildHeatsFromParticipantIds(getUpperFromRound(round1), boatClass);
        changed = true;
      }
      if (!classHeats.round2Lower) {
        classHeats.round2Lower = buildHeatsFromParticipantIds(getLowerFromRound(round1), boatClass);
        changed = true;
      }
    }
    for (let r = 2; r <= 8; r++) {
      const upperHeats = classHeats[`round${r}Upper`];
      const lowerHeats = classHeats[`round${r}Lower`];
      if (upperHeats && upperHeats.length > 1 && isRoundComplete(upperHeats) && !classHeats[`round${r + 1}Upper`]) {
        classHeats[`round${r + 1}Upper`] = buildHeatsFromParticipantIds(getUpperFromRound(upperHeats), boatClass);
        changed = true;
      }
      if (lowerHeats && isRoundComplete(lowerHeats) && !classHeats[`round${r + 1}Lower`]) {
        let ids;
        if (r === 2 && upperHeats && isRoundComplete(upperHeats)) {
          ids = getLowerFromRound(upperHeats).concat(getUpperFromRound(lowerHeats));
        } else if (lowerHeats.length > 1) {
          ids = getUpperFromRound(lowerHeats);
        }
        if (ids && ids.length > 0) {
          classHeats[`round${r + 1}Lower`] = buildHeatsFromParticipantIds(ids, boatClass);
          changed = true;
        }
      }
    }
  }
  if (changed) window.SnowContestAdminData.saveDataToStorage();
}

/** Очищает туры, зависящие от изменённого (при изменении мест в хите). */
function clearRoundsAfter(classHeats, editedRoundKey) {
  if (!classHeats) return;
  if (editedRoundKey === 'round1') {
    Object.keys(classHeats).forEach(k => { if (k !== 'round1') delete classHeats[k]; });
    return;
  }
  const match = String(editedRoundKey).match(/round(\d+)(Upper|Lower)/);
  if (!match) return;
  const [, numStr, branch] = match;
  const n = parseInt(numStr, 10);
  Object.keys(classHeats).forEach(k => {
    const m = k.match(/round(\d+)(Upper|Lower)/);
    if (!m) return;
    const nextNum = parseInt(m[1], 10);
    const nextBranch = m[2];
    if (nextBranch === branch && nextNum > n) delete classHeats[k];
  });
  if (editedRoundKey === 'round2Upper') {
    Object.keys(classHeats).forEach(k => {
      const m = k.match(/round(\d+)(Lower)/);
      if (!m) return;
      if (parseInt(m[1], 10) >= 3) delete classHeats[k];
    });
  }
}

/**
 * Собирает участников хита с учётом места в хите (participants или athleteIds).
 * @returns {Array<{ athleteId: string, placeInHeat: number|null }>}
 */
function getHeatParticipants(heat) {
  const participants = (heat.participants && heat.participants.length)
    ? heat.participants
    : (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
  return participants.map(p => ({
    athleteId: p.athleteId,
    placeInHeat: p.placeInHeat != null && p.placeInHeat !== '' ? Number(p.placeInHeat) : null
  }));
}

/**
 * Вычисляет итоговые места в кроссе по хитам и всем турам (двойное выбывание).
 * Сначала раздаются места всем, кто шёл по ветке Upper (места 1–2 из финала Upper, затем выбывшие по турам).
 * Затем всем, кто шёл по ветке Lower (места 1–2 из финала Lower, затем выбывшие, в т.ч. из round1).
 * Таким образом все участники Lower получают в итоге места хуже (выше номер), чем все участники Upper.
 * @param {Object} crossHeats - crossHeats[boatClass][roundKey] = heats[]
 * @returns {Array<{ athleteId: string, place: number }>} для всех участников из crossHeats (по классам)
 */
function computeCrossPlacesFromHeats(crossHeats) {
  const result = [];
  if (!crossHeats || typeof crossHeats !== 'object') return result;

  for (const boatClass of Object.keys(crossHeats)) {
    const ch = crossHeats[boatClass];
    if (!ch || typeof ch !== 'object') continue;

    const roundKeys = Object.keys(ch).filter(k => k === 'round1' || /^round\d+(Upper|Lower)$/.test(k));

    const heatsByKey = (key) => {
      const arr = ch[key];
      return Array.isArray(arr) ? arr : [];
    };
    const isFinalRound = (key) => heatsByKey(key).length === 1;

    const upperKeys = roundKeys.filter(k => k.endsWith('Upper'));
    const lowerKeys = roundKeys.filter(k => k === 'round1' || k.endsWith('Lower'));

    const finalUpper = upperKeys.find(k => isFinalRound(k));
    const finalLower = lowerKeys
      .filter(k => k !== 'round1' && isFinalRound(k))
      .map(k => ({ key: k, num: parseInt(k.replace(/\D/g, ''), 10) }))
      .sort((a, b) => b.num - a.num)[0]?.key;

    const upperOrder = [];
    const lowerOrder = [];
    const upperNonFinal = upperKeys
      .filter(k => !isFinalRound(k))
      .map(k => ({ key: k, num: parseInt(k.replace(/\D/g, ''), 10) }))
      .sort((a, b) => b.num - a.num)
      .map(x => x.key);
    const lowerNonFinal = lowerKeys
      .filter(k => k !== 'round1' && k !== finalLower)
      .map(k => ({ key: k, num: parseInt(k.replace(/\D/g, ''), 10) }))
      .sort((a, b) => b.num - a.num)
      .map(x => x.key);

    if (finalUpper) upperOrder.push(finalUpper);
    upperOrder.push(...upperNonFinal);
    if (finalLower) lowerOrder.push(finalLower);
    lowerOrder.push(...lowerNonFinal);
    if (lowerKeys.includes('round1')) lowerOrder.push('round1');

    const participantsInLowerRounds = new Set();
    for (const key of lowerKeys) {
      if (key === 'round1') continue;
      for (const heat of heatsByKey(key)) {
        for (const p of getHeatParticipants(heat)) participantsInLowerRounds.add(p.athleteId);
      }
    }

    let placeCounter = 1;
    const assigned = new Set();

    const assign = (athleteId) => {
      if (assigned.has(athleteId)) return;
      assigned.add(athleteId);
      result.push({ athleteId, place: placeCounter++, boatClass });
    };

    const processKey = (key, assignTopTwo, skipIfInLowerBranch) => {
      const heats = heatsByKey(key).slice().sort((a, b) => (a.heatIndex || 0) - (b.heatIndex || 0));
      if (heats.length === 0) return;
      const singleHeatFinal = key === 'round1' && heats.length === 1;
      if ((assignTopTwo || singleHeatFinal) && heats.length === 1) {
        const participants = getHeatParticipants(heats[0])
          .filter(p => p.placeInHeat != null)
          .sort((a, b) => (a.placeInHeat || 999) - (b.placeInHeat || 999));
        participants.forEach(p => assign(p.athleteId));
        return;
      }
      for (const heat of heats) {
        const participants = getHeatParticipants(heat)
          .filter(p => p.placeInHeat != null && p.placeInHeat >= 3)
          .sort((a, b) => (a.placeInHeat || 999) - (b.placeInHeat || 999));
        participants.forEach(p => {
          if (skipIfInLowerBranch && participantsInLowerRounds.has(p.athleteId)) return;
          assign(p.athleteId);
        });
      }
    };

    for (const key of upperOrder) {
      const isUpperFinal = key === finalUpper;
      processKey(key, isUpperFinal, !isUpperFinal);
    }
    for (const key of lowerOrder) {
      processKey(key, key === finalLower);
    }

    const classAthleteIds = new Set();
    for (const key of Object.keys(ch)) {
      const arr = ch[key];
      if (!Array.isArray(arr)) continue;
      for (const heat of arr) {
        for (const p of getHeatParticipants(heat)) classAthleteIds.add(p.athleteId);
      }
    }
    for (const aid of classAthleteIds) {
      if (!assigned.has(aid)) result.push({ athleteId: aid, place: placeCounter++, boatClass });
    }
  }

  return result;
}

function buildStage1PreviewByAthleteId() {
  try {
    const qualification = window.SnowContestAdminQualification.buildQualificationStandingsForPairs();
    const { getData } = window.SnowContestAdminData;
    const d = getData();
    const h2hResults = {};
    for (const h of d.h2hResults || []) {
      h2hResults[h.athleteId] = window.SnowContest.createH2hResult(h.athleteId, h.wins, h.losses, h.dnfs);
    }
    const stage1 = window.SnowContest.buildStage1Results(qualification, h2hResults);
    const byAthleteId = new Map();
    stage1.forEach((row, index) => {
      byAthleteId.set(row.athlete.id, { place: index + 1, r1: row.r1 });
    });
    return byAthleteId;
  } catch (err) {
    return new Map();
  }
}

function recalculateH2hFromPairs() {
  const { getData } = window.SnowContestAdminData;
  const d = getData();
  const byAthlete = new Map(d.athletes.map(a => [a.id, { athleteId: a.id, wins: 0, losses: 0, dnfs: 0 }]));
  const validPairs = (d.parallelPairs || []).filter(pair =>
    pair &&
    pair.athlete1Id &&
    (pair.outcomeAttempt1 || pair.outcomeAttempt2 || pair.outcome)
  );

  const applyOutcome = (pair, outcome) => {
    if (!outcome) return;
    const a = byAthlete.get(pair.athlete1Id);
    if (!a) return;

    const hasOrganizerOpponent = !pair.athlete2Id;
    if (hasOrganizerOpponent) {
      switch (outcome) {
        case 'A_WIN':
        case 'B_DNF':
          a.wins += 1;
          break;
        case 'B_WIN':
          a.losses += 1;
          break;
        case 'A_DNF':
        case 'BOTH_DNF':
          a.dnfs += 1;
          break;
      }
      return;
    }

    if (pair.athlete1Id === pair.athlete2Id) return;
    const b = byAthlete.get(pair.athlete2Id);
    if (!b) return;

    switch (outcome) {
      case 'A_WIN':
        a.wins += 1;
        b.losses += 1;
        break;
      case 'B_WIN':
        b.wins += 1;
        a.losses += 1;
        break;
      case 'A_DNF':
        a.dnfs += 1;
        b.wins += 1;
        break;
      case 'B_DNF':
        b.dnfs += 1;
        a.wins += 1;
        break;
      case 'BOTH_DNF':
        a.dnfs += 1;
        b.dnfs += 1;
        break;
    }
  };

  validPairs.forEach(pair => {
    const outcomes = [pair.outcomeAttempt1, pair.outcomeAttempt2];
    if (!outcomes[0] && !outcomes[1] && pair.outcome) outcomes[0] = pair.outcome;
    outcomes.forEach(outcome => applyOutcome(pair, outcome));
  });

  d.h2hResults = Array.from(byAthlete.values());
}

function collectParallelPairsFromForm() {
  const { getData } = window.SnowContestAdminData;
  const d = getData();
  document.querySelectorAll('#parallelPairsBody tr[data-index]').forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    const pair = d.parallelPairs[idx];
    if (!pair) return;
    row.querySelectorAll('select[data-field]').forEach(sel => {
      pair[sel.dataset.field] = sel.value || null;
    });
  });
}

/** Проверяет, что у всех пар есть результаты. */
function allPairsHaveResults(d) {
  const pairs = d.parallelPairs || [];
  if (pairs.length === 0) return false;
  for (const pair of pairs) {
    if (!pair || !pair.athlete1Id) continue;
    if (!pair.outcomeAttempt1 || !pair.outcomeAttempt2) return false;
  }
  return true;
}

/** Рассчитывает рейтинг этапа 1 (R1 = Rквал + Rh2h) и помечает этап как рассчитанный. Доступно только когда у всех пар есть результаты. */
function calculateStage1Rating(showMsg) {
  const { getData, saveDataToStorage } = window.SnowContestAdminData;
  const { collectParallelPairsFromForm } = window.SnowContestAdminPairs;

  collectParallelPairsFromForm();
  const d = getData();
  if (!d.meta.qualificationCalculated || !(d.parallelPairs || []).length) {
    showMsg('Сначала сформируйте пары (кнопка «Рассчитать рейтинг и сформировать пары»)', true);
    return;
  }
  if (!allPairsHaveResults(d)) {
    showMsg('Рассчитать рейтинг этапа 1 можно только когда у всех пар заполнены результаты', true);
    return;
  }
  recalculateH2hFromPairs();
  d.meta.stage1Calculated = true;
  d.crossHeats = buildCrossHeats(d);
  saveDataToStorage();
  const published = window.SnowContestAdminPublish.publishAllData({ showSuccessMessage: false });
  if (published) {
    showMsg('Рейтинг этапа 1 (R1) рассчитан и опубликован.');
  }
}

/**
 * Возвращает порядок индексов пар для отображения: по рейтингу (месту в квалификации) первого участника.
 * Пара с организатором (athlete2Id === null) оказывается в середине списка.
 */
function getParallelPairsOrderByFirstAthleteRating() {
  const { getData } = window.SnowContestAdminData;
  const d = getData();
  const pairs = d.parallelPairs || [];
  if (pairs.length === 0) return [];

  try {
    const standings = window.SnowContestAdminQualification.buildQualificationStandingsForPairs();
    const placeByAthleteId = new Map(standings.map(s => [s.athlete.id, s.place]));
    const indices = pairs.map((_, i) => i);
    indices.sort((i, j) => {
      const placeA = placeByAthleteId.get(pairs[i].athlete1Id) ?? Infinity;
      const placeB = placeByAthleteId.get(pairs[j].athlete1Id) ?? Infinity;
      return placeA - placeB;
    });
    return indices;
  } catch (_) {
    return pairs.map((_, i) => i);
  }
}

/**
 * То же для страницы рейтингов: порядок пар по месту в квалификации первого участника (данные из publication).
 */
function getParallelPairsOrderByFirstAthleteRatingFromPublication(publication) {
  const pairs = publication?.parallelPairs || [];
  if (pairs.length === 0) return [];

  const qual = publication?.qualification || [];
  const placeByAthleteId = new Map();
  qual.forEach(row => {
    const id = row.athlete?.id;
    if (id != null && row.place != null) placeByAthleteId.set(id, row.place);
  });

  if (placeByAthleteId.size === 0) return pairs.map((_, i) => i);

  const indices = pairs.map((_, i) => i);
  indices.sort((i, j) => {
    const placeA = placeByAthleteId.get(pairs[i].athlete1Id) ?? Infinity;
    const placeB = placeByAthleteId.get(pairs[j].athlete1Id) ?? Infinity;
    return placeA - placeB;
  });
  return indices;
}

function generateParallelPairsFromQualification(showMsg) {
  const { validateQualificationRequiredFields, buildQualificationStandingsForPairs, collectQualificationFromForm } = window.SnowContestAdminQualification;
  const { getData, saveDataToStorage } = window.SnowContestAdminData;

  if (!validateQualificationRequiredFields(showMsg)) return;
  collectQualificationFromForm();
  const d = getData();
  if (d.athletes.length < 1) {
    showMsg('Добавьте хотя бы одного участника для формирования пар', true);
    return;
  }

  let standings;
  try {
    standings = buildQualificationStandingsForPairs();
  } catch (err) {
    showMsg(err.message || 'Ошибка квалификации: не удалось сформировать пары', true);
    return;
  }

  const pairs = [];
  const rowsForPairing = [...standings].sort((a, b) => a.place - b.place);
  if (rowsForPairing.length % 2 === 1) {
    const middleIndex = Math.floor(rowsForPairing.length / 2);
    const middleAthlete = rowsForPairing[middleIndex].athlete;
    pairs.push({
      athlete1Id: middleAthlete.id,
      athlete2Id: null,
      athlete2Label: 'Организатор',
      outcomeAttempt1: null,
      outcomeAttempt2: null
    });
    rowsForPairing.splice(middleIndex, 1);
  }

  for (let i = 0; i < rowsForPairing.length; i += 2) {
    const left = rowsForPairing[i]?.athlete;
    const right = rowsForPairing[i + 1]?.athlete;
    if (!left || !right) continue;
    pairs.push({
      athlete1Id: left.id,
      athlete2Id: right.id,
      outcomeAttempt1: null,
      outcomeAttempt2: null
    });
  }

  d.parallelPairs = pairs;
  d.meta.qualificationCalculated = true;
  d.meta.stage1Calculated = false;
  d.meta.finalCalculated = false;
  d.crossHeats = null;
  saveDataToStorage();
  const published = window.SnowContestAdminPublish.publishAllData({ showSuccessMessage: false });
  if (published) {
    showMsg('Рейтинг квалификации рассчитан, пары сформированы и опубликованы.');
  }
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminPairs = {
    getHeatConfig,
    getHeatSizes,
    getUpperFromRound,
    getLowerFromRound,
    isRoundComplete,
    buildHeatsFromParticipantIds,
    ensureNextRounds,
    clearRoundsAfter,
    getHeatParticipants,
    computeCrossPlacesFromHeats,
    buildCrossHeats,
    buildStage1PreviewByAthleteId,
    recalculateH2hFromPairs,
    collectParallelPairsFromForm,
    getParallelPairsOrderByFirstAthleteRating,
    getParallelPairsOrderByFirstAthleteRatingFromPublication,
    generateParallelPairsFromQualification,
    allPairsHaveResults,
    calculateStage1Rating
  };
}
