/**
 * Логика кросса: формирование хитов и расчёт итоговых мест по хитам/турам.
 * Все функции в конце файла "подмешиваются" в window.SnowContestAdminPairs,
 * чтобы по месту использования они выглядели как часть AdminPairs.
 */

const byField = (field) => (a, b) => a[field] - b[field];

/**
 * Собирает участников хитов тура и разбивает их на верхнюю и нижнюю сетки
 * по местам в хите.
 */
function getFromRound(heats) {
  const heatList = [];

  for (const heat of heats || []) {
    const participants = crossGetHeatParticipants(heat);

    if (participants.some(p => p.placeInHeat == null)) {
      throw new Error('getFromRound: heat contains participant without placeInHeat');
    }

    const sorted = participants
        .slice()
        .sort(byField('placeInHeat'));

    if (sorted.length === 0) continue;

    heatList.push(sorted);
  }

  const upperIds = [];
  const lowerIds = [];

  for (let i = 0; i < heatList.length; i++) {
    upperIds.push(heatList[i][0].athleteId);
  }

  for (let i = heatList.length - 1; i >= 0; i--) {
    let heat = heatList[i];
    if (heat.length > 2) {
      upperIds.push(heat[1].athleteId);
    } else if (heat.length > 1) {
      lowerIds.push(heat[1].athleteId);
    }
  }

  for (let i = 0; i < heatList.length; i++) {
    if (heatList[i].length > 2) {
      lowerIds.push(heatList[i][2].athleteId);
    }
  }

  for (let i = heatList.length - 1; i >= 0; i--) {
    if (heatList[i].length > 3) {
      lowerIds.push(heatList[i][3].athleteId);
    }
  }

  // Отметим на исходных объектах участников, кто проходит вверх.
  const upperSet = new Set(upperIds);
  for (const heat of heats || []) {
    if (!heat) continue;
    let participants = heat.participants;
    if (!participants || !participants.length) {
      const ids = heat.athleteIds || [];
      if (!Array.isArray(ids) || !ids.length) continue;
      participants = ids.map(id => ({ athleteId: id, placeInHeat: null }));
      heat.participants = participants;
    }
    for (const p of participants) {
      p.advancesUpper = upperSet.has(p.athleteId) || false;
    }
  }

  return {upperIds, lowerIds};
}

/** Проверяет, что во всех хитах тура проставлены уникальные места (нет пустых и дубликатов). */
function isRoundComplete(heats) {
  if (!heats || heats.length === 0) return false;
  for (const heat of heats) {
    const participants = (heat.participants && heat.participants.length)
      ? heat.participants
      : (heat.athleteIds || []).map((id) => ({ athleteId: id, placeInHeat: null }));
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

/**
 * Формирует хиты из списка id (змейка, места пустые). Используется для следующих туров.
 */
function buildHeatsFromParticipantIds(athleteIds, boatClass) {
  const n = athleteIds.length;
  if (n === 0) return [];

  // Для 4 участников — один хит как есть (используется для самого простого случая).
  if (n <= 4) {
    return [{
      heatIndex: 1,
      boatClass,
      athleteIds: [...athleteIds],
      participants: athleteIds.map((id) => ({ athleteId: id, placeInHeat: null }))
    }];
  }

  // Схема групп 3–4 с максимизацией четвёрок:
  // N != 5: представить N = 4x + 3y с максимальным x.
  // Исключение: N = 5 → 3 + 2 (тест на 5 участников).
  let heatSizes;
  if (n === 5) {
    heatSizes = [3, 2];
  } else {
    let bestFours = -1;
    let bestThrees = 0;
    for (let fours = Math.floor(n / 4); fours >= 0; fours--) {
      const rest = n - 4 * fours;
      if (rest % 3 === 0) {
        bestFours = fours;
        bestThrees = rest / 3;
        break;
      }
    }
    if (bestFours < 0) {
      // На всякий случай fallback: один хит со всеми.
      heatSizes = [n];
    } else {
      heatSizes = [];
      // Сначала тройки, потом четверки — чтобы при змейке
      // первые хиты были меньше/равны по размеру
      for (let i = 0; i < bestThrees; i++) heatSizes.push(3);
      for (let i = 0; i < bestFours; i++) heatSizes.push(4);
    }
  }

  const numHeats = heatSizes.length;
  const maxSize = Math.max(...heatSizes);
  const heatAthleteIds = Array.from({ length: numHeats }, () => []);
  let idx = 0;

  for (let row = 0; row < maxSize && idx < n; row++) {
    const forward = row % 2 === 0;
    if (forward) {
      for (let h = 0; h < numHeats && idx < n; h++) {
        if (row < heatSizes[h]) {
          heatAthleteIds[h].push(athleteIds[idx++]);
        }
      }
    } else {
      for (let h = numHeats - 1; h >= 0 && idx < n; h--) {
        if (row < heatSizes[h]) {
          heatAthleteIds[h].push(athleteIds[idx++]);
        }
      }
    }
  }

  const heats = [];
  const shouldSortInsideHeatBySeed = n > 2;
  for (let h = 0; h < numHeats; h++) {
    let ids = heatAthleteIds[h];
    if (!ids || ids.length === 0) continue;
    if (shouldSortInsideHeatBySeed) {
      ids = ids.slice().sort(
        (a, b) => athleteIds.indexOf(a) - athleteIds.indexOf(b)
      );
    }
    heats.push({
      heatIndex: h + 1,
      boatClass,
      athleteIds: ids,
      participants: ids.map((id) => ({ athleteId: id, placeInHeat: null }))
    });
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

    // Общее число участников в классе (по первому туру).
    // Для небольших сеток (до 8 участников) все места разыгрываются
    // в пределах round1 и round2Upper/round2Lower; дополнительные туры
    // нижней сетки создавать не нужно, чтобы не «пересобирать» хит проигравших.
    const classParticipantIds = new Set();
    for (const heat of round1) {
      const ids = (heat.participants && heat.participants.length)
        ? heat.participants.map(p => p.athleteId)
        : (heat.athleteIds || []);
      ids.forEach(id => classParticipantIds.add(id));
    }
    const numClassParticipants = classParticipantIds.size;

    if (round1.length > 1 && isRoundComplete(round1)) {
      if (!classHeats.round2Upper) {
        const { upperIds } = getFromRound(round1);
        classHeats.round2Upper = buildHeatsFromParticipantIds(upperIds, boatClass);
        changed = true;
      }
      if (!classHeats.round2Lower) {
        const { lowerIds } = getFromRound(round1);
        classHeats.round2Lower = buildHeatsFromParticipantIds(lowerIds, boatClass);
        changed = true;
      }
    }
    for (let r = 2; r <= 8; r++) {
      const upperHeats = classHeats[`round${r}Upper`];
      const lowerHeats = classHeats[`round${r}Lower`];
      if (upperHeats && upperHeats.length > 1 && isRoundComplete(upperHeats) && !classHeats[`round${r + 1}Upper`]) {
        const { upperIds } = getFromRound(upperHeats);
        classHeats[`round${r + 1}Upper`] = buildHeatsFromParticipantIds(upperIds, boatClass);
        changed = true;
      }
      if (lowerHeats && isRoundComplete(lowerHeats) && !classHeats[`round${r + 1}Lower`]) {
        let ids;
        // Для небольших сеток до 8 участников не создаём дополнительные
        // туры нижней сетки: хватает round1 + round2Upper/round2Lower.
        if (numClassParticipants > 8) {
          if (r === 2 && upperHeats && isRoundComplete(upperHeats)) {
            // Классическая связка верхней и нижней сеток:
            // проигравшие второго тура верхней сетки + победители второго тура нижней
            // формируют следующий тур нижней сетки.
            const { lowerIds: fromUpperLowerIds } = getFromRound(upperHeats);
            const { upperIds: fromLowerUpperIds } = getFromRound(lowerHeats);
            ids = fromUpperLowerIds.concat(fromLowerUpperIds);
          } else if (lowerHeats.length > 1) {
            // Начиная с третьего тура нижней сетки следующие туры строим только
            // из победителей предыдущего тура нижней сетки.
            const { upperIds } = getFromRound(lowerHeats);
            ids = upperIds;
          }
        }
        if (ids && ids.length > 0) {
          classHeats[`round${r + 1}Lower`] = buildHeatsFromParticipantIds(ids, boatClass);
          changed = true;
        }
      }
    }

    // Дополнительная обработка суперфинала: сначала создаём дополнительный заезд
    // (проигравшие верхнего финала + победители нижнего), а уже после его завершения
    // формируем главный финал.
    if (handleSuperFinals(classHeats, boatClass)) {
      changed = true;
    }
  }
  if (changed) window.SnowContestAdminData.saveDataToStorage();
}

/**
 * Обрабатывает связку «верхний финал → дополнительный заезд → главный финал».
 * Возвращает true, если структура туров была изменена.
 */
function handleSuperFinals(classHeats, boatClass) {
  if (!classHeats) return false;

  const meta = classHeats._superFinalMeta || {};
  const roundKeys = Object.keys(classHeats);
  const upperRounds = [];
  const lowerRounds = [];

  for (const key of roundKeys) {
    const m = key.match(/round(\d+)(Upper|Lower)/);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    const branch = m[2];
    const heats = classHeats[key];
    if (!Array.isArray(heats) || heats.length === 0) continue;
    if (branch === 'Upper') upperRounds.push({ key, num, heats });
    else lowerRounds.push({ key, num, heats });
  }

  if (!upperRounds.length || !lowerRounds.length) return false;

  // Зафиксировать один раз, какие раунды считаем верхним и нижним финалами.
  if (!meta.upperFinalRound) {
    const upperFinalCandidate = upperRounds
      .filter(r => r.heats.length === 1)
      .sort((a, b) => a.num - b.num)
      .slice(-1)[0];
    if (!upperFinalCandidate) {
      classHeats._superFinalMeta = meta;
      return false;
    }
    meta.upperFinalRound = upperFinalCandidate.num;
  }

  const lowerFinalCandidate = lowerRounds
      .filter(r => r.heats.length === 1)
      .sort((a, b) => a.num - b.num)
      .slice(-1)[0];
  if (!lowerFinalCandidate) {
    classHeats._superFinalMeta = meta;
    return false;
  }
  // Если позже появился более поздний финальный тур нижней сетки (с большим num),
  // обновляем meta.lowerFinalRound, чтобы он указывал на настоящий финал.
  if (!meta.lowerFinalRound || lowerFinalCandidate.num > meta.lowerFinalRound) {
    meta.lowerFinalRound = lowerFinalCandidate.num;
  }

  const upperFinal = upperRounds.find(r => r.num === meta.upperFinalRound);
  const lowerFinal = lowerRounds.find(r => r.num === meta.lowerFinalRound);

  if (!upperFinal || !lowerFinal) {
    classHeats._superFinalMeta = meta;
    return false;
  }

  let changed = false;

  // 1) Создание дополнительного тура (делаем только один раз).
  if (!meta.extraLowerRound) {
    const upperHeats = upperFinal.heats;
    const lowerHeats = lowerFinal.heats;
    if (!isRoundComplete(upperHeats) || !isRoundComplete(lowerHeats)) {
      classHeats._superFinalMeta = meta;
      return false;
    }

    const { lowerIds: upperLosers } = getFromRound(upperHeats);
    const { upperIds: lowerWinners } = getFromRound(lowerHeats);
    const ids = upperLosers.concat(lowerWinners);
    if (!ids.length) {
      classHeats._superFinalMeta = meta;
      return false;
    }

    const maxLowerNum = lowerRounds.reduce((max, r) => Math.max(max, r.num), 0);
    const extraNum = maxLowerNum + 1;
    classHeats[`round${extraNum}Lower`] = buildHeatsFromParticipantIds(ids, boatClass);
    meta.extraLowerRound = extraNum;
    changed = true;
  }

  // 2) Создание главного финала (после завершения дополнительного тура, тоже один раз).
  if (meta.extraLowerRound && !meta.superFinalRound) {
    const extraKey = `round${meta.extraLowerRound}Lower`;
    const extraHeats = classHeats[extraKey];
    if (!Array.isArray(extraHeats) || !extraHeats.length || !isRoundComplete(extraHeats)) {
      classHeats._superFinalMeta = meta;
      return changed;
    }

    const { upperIds: upperWinners } = getFromRound(upperFinal.heats);
    const { upperIds: extraWinners } = getFromRound(extraHeats);
    const allIds = upperWinners.concat(extraWinners);
    const uniqueIds = Array.from(new Set(allIds));
    if (uniqueIds.length < 2) {
      classHeats._superFinalMeta = meta;
      return changed;
    }

    const maxUpperNum = upperRounds.reduce((max, r) => Math.max(max, r.num), 0);
    const superNum = Math.max(maxUpperNum, meta.extraLowerRound) + 1;
    classHeats[`round${superNum}Upper`] = buildHeatsFromParticipantIds(uniqueIds, boatClass);
    meta.superFinalRound = superNum;
    changed = true;
  }

  classHeats._superFinalMeta = meta;
  return changed;
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
 * Локальное имя отличается от `getHeatParticipants` в `heats-shared.js`,
 * чтобы избежать конфликта глобальных идентификаторов в браузере.
 * @returns {Array<{ athleteId: string, placeInHeat: number|null }>}
 */
function crossGetHeatParticipants(heat) {
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

    const finalUpper = upperKeys
      .filter(k => isFinalRound(k))
      .map(k => ({ key: k, num: parseInt(k.replace(/\D/g, ''), 10) }))
      .sort((a, b) => b.num - a.num)[0]?.key;
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
        for (const p of crossGetHeatParticipants(heat)) participantsInLowerRounds.add(p.athleteId);
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
        const participants = crossGetHeatParticipants(heats[0])
          .filter(p => p.placeInHeat != null)
          .sort((a, b) => (a.placeInHeat || 999) - (b.placeInHeat || 999));
        participants.forEach(p => assign(p.athleteId));
        return;
      }
      for (const heat of heats) {
        const participants = crossGetHeatParticipants(heat)
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
        for (const p of crossGetHeatParticipants(heat)) classAthleteIds.add(p.athleteId);
      }
    }
    for (const aid of classAthleteIds) {
      if (!assigned.has(aid)) result.push({ athleteId: aid, place: placeCounter++, boatClass });
    }
  }

  return result;
}

/**
 * Строит превью R1 по id атлета.
 */
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

/**
 * Формирует хиты для кросса по классам (К1М, К1Ж, П1М, П1Ж).
 * В каждом классе — своя сетка хитов; участники упорядочены по месту R1 внутри класса,
 * затем змейка (высокий + низкий рейтинг в одном заезде) и раздача по хитам.
 * @param {Object} d - данные (athletes и т.д.)
 * @param {{ combineK1?: boolean, combineP1?: boolean }} [options] - галочки «Объединить М и Ж»: каяк и пакрафт (читаются при нажатии кнопки, в storage не сохраняются).
 */
function buildCrossHeats(d, options) {
  const stage1Preview = buildStage1PreviewByAthleteId();
  const result = {};
  options = options || {};

  // Группируем участников по «типу лодки» (К1 / П1).
  const groupsByBoatType = new Map();
  for (const a of d.athletes || []) {
    const boatClass = a.boatClass;
    if (!boatClass || typeof boatClass !== 'string') continue;
    const boatType = boatClass.slice(0, 2);
    if (!groupsByBoatType.has(boatType)) groupsByBoatType.set(boatType, []);
    groupsByBoatType.get(boatType).push(a);
  }

  for (const [boatType, allAthletesInType] of groupsByBoatType) {
    const combineForType = boatType === 'К1' ? !!(options.combineK1) : !!(options.combineP1);

    const byExactClass = new Map();
    for (const a of allAthletesInType) {
      const cls = a.boatClass;
      if (!byExactClass.has(cls)) byExactClass.set(cls, []);
      byExactClass.get(cls).push(a);
    }

    const totalInType = allAthletesInType.length;

    if (totalInType > 0 && combineForType && byExactClass.size >= 2) {
      const withR1 = allAthletesInType.map(a => ({
        athlete: a,
        r1: stage1Preview.get(a.id)?.r1 ?? -1,
        place: stage1Preview.get(a.id)?.place ?? 999
      }));
      withR1.sort((a, b) => {
        if (b.r1 !== a.r1) return b.r1 - a.r1;
        return a.place - b.place;
      });
      const orderedIds = withR1.map(x => x.athlete.id);

      // Ключ объединённой сетки: "<тип лодки> общий заезд",
      // где <тип лодки> — часть label до запятой (например, "Каяк", "Пакрафт").
      let combinedKey;
      try {
        if (typeof window !== 'undefined' &&
            window.SnowContest &&
            window.SnowContest.BOAT_CLASS_LABELS) {
          const labels = window.SnowContest.BOAT_CLASS_LABELS;
          const firstKey = Object.keys(labels).find(k => k.startsWith(boatType));
          if (firstKey) {
            const full = String(labels[firstKey] || '');
            const base = full.split(',')[0].trim();
            if (base) {
              combinedKey = `${base}, общий заезд`;
            }
          }
        }
      } catch (_) {
        // ignore, fallback ниже
      }
      if (!combinedKey) {
        combinedKey = `${boatType}, общий заезд`;
      }

      const heats = buildHeatsFromParticipantIds(orderedIds, combinedKey);
      result[combinedKey] = { round1: heats };
    } else {
      // Базовый сценарий: отдельные сетки по каждому классу зачёта.
      for (const [boatClass, athletes] of byExactClass) {
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
        const heats = buildHeatsFromParticipantIds(orderedIds, boatClass);
        result[boatClass] = { round1: heats };
      }
    }
  }

  return result;
}

if (typeof window !== 'undefined') {
  var existingPairs = window.SnowContestAdminPairs || {};
  window.SnowContestAdminPairs = Object.assign(existingPairs, {
    getFromRound: getFromRound,
    isRoundComplete: isRoundComplete,
    buildHeatsFromParticipantIds: buildHeatsFromParticipantIds,
    ensureNextRounds: ensureNextRounds,
    clearRoundsAfter: clearRoundsAfter,
    getHeatParticipants: crossGetHeatParticipants,
    computeCrossPlacesFromHeats: computeCrossPlacesFromHeats,
    buildStage1PreviewByAthleteId: buildStage1PreviewByAthleteId,
    buildCrossHeats: buildCrossHeats
  });
}

