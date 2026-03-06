/**
 * Пары H2H в админке: превью R1, генерация пар, пересчёт H2H из исходов.
 * Логика кросса (формирование хитов, туров и мест) вынесена в `cross-logic.js`
 * и тоже добавляется в window.SnowContestAdminPairs.
 */

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
  if (window.SnowContestAdminPairs && typeof window.SnowContestAdminPairs.buildCrossHeats === 'function') {
    const combineK1 = document.getElementById('combineK1')?.checked ?? false;
    const combineP1 = document.getElementById('combineP1')?.checked ?? false;
    d.crossHeats = window.SnowContestAdminPairs.buildCrossHeats(d, { combineK1, combineP1 });
  }
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
  var existingPairs = window.SnowContestAdminPairs || {};
  window.SnowContestAdminPairs = Object.assign(existingPairs, {
    recalculateH2hFromPairs: recalculateH2hFromPairs,
    collectParallelPairsFromForm: collectParallelPairsFromForm,
    getParallelPairsOrderByFirstAthleteRating: getParallelPairsOrderByFirstAthleteRating,
    getParallelPairsOrderByFirstAthleteRatingFromPublication: getParallelPairsOrderByFirstAthleteRatingFromPublication,
    generateParallelPairsFromQualification: generateParallelPairsFromQualification,
    allPairsHaveResults: allPairsHaveResults,
    calculateStage1Rating: calculateStage1Rating
  });
}
