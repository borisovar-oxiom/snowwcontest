/**
 * Порт логики SnowContest.Core.ContestCalculator для веб-приложения.
 * Расчёт: квалификация -> параллельные спуски (R1) -> итог по классам (R = R1 + R2).
 */

const BoatClass = Object.freeze({
  K1M: 'К1М',
  K1W: 'К1Ж',
  P1M: 'П1М',
  P1W: 'П1Ж'
});

const BOAT_CLASS_LABELS = {
  'К1М': 'Каяк, мужчины',
  'К1Ж': 'Каяк, женщины',
  'П1М': 'Пакрафт, мужчины',
  'П1Ж': 'Пакрафт, женщины'
};

function createAthlete(id, displayName, boatClass, cityClub = null) {
  return { id, displayName, boatClass, cityClub };
}

function createQualificationAttempt(redTrackSeconds, greenTrackSeconds, redTieBreakSeconds = null) {
  const isDnf = redTrackSeconds == null || greenTrackSeconds == null;
  const totalSeconds = (redTrackSeconds ?? Number.MAX_VALUE) + (greenTrackSeconds ?? Number.MAX_VALUE);
  return { redTrackSeconds, greenTrackSeconds, redTieBreakSeconds, isDnf, totalSeconds };
}

function createH2hResult(athleteId, wins, losses, dnfs) {
  const h2hPoints = wins * 2 + losses;
  return { athleteId, wins, losses, dnfs, h2hPoints };
}

function ensureAllAthletesHaveData(athletes, keys, stageName) {
  const keySet = new Set(keys);
  const missed = athletes.filter(a => !keySet.has(a.id)).map(a => a.displayName);
  if (missed.length > 0) {
    throw new Error(`Нет данных для этапа ${stageName}: ${missed.join(', ')}`);
  }
}

function validateQualificationTieBreakers(rows) {
  const finished = rows.filter(r => !r.attempt.isDnf);
  const byKey = new Map();
  for (const row of finished) {
    const key = `${row.attempt.totalSeconds}_${row.attempt.redTrackSeconds}_${row.attempt.greenTrackSeconds}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(row);
  }
  for (const group of byKey.values()) {
    if (group.length <= 1) continue;
    const missingTieBreak = group.some(x => x.attempt.redTieBreakSeconds == null);
    if (missingTieBreak) {
      const names = group.map(x => x.athlete.displayName).join(', ');
      throw new Error(`По регламенту нужен повторный заезд по красной трассе для: ${names}. Добавьте повтор красная.`);
    }
    const tieBreakValues = group.map(x => x.attempt.redTieBreakSeconds);
    const hasDup = tieBreakValues.some((v, i) => tieBreakValues.indexOf(v) !== i);
    if (hasDup) {
      const names = group.map(x => x.athlete.displayName).join(', ');
      throw new Error(`Повторные времена также совпали для: ${names}. Нужен дополнительный ручной разбор судьями.`);
    }
  }
}

function validateCrossPlacesUniqueness(boatClass, classAthleteIds, crossPlacesByAthleteId) {
  const places = classAthleteIds.map(id => crossPlacesByAthleteId[id]);
  if (places.some(p => p <= 0)) {
    throw new Error(`В классе ${boatClass} место в кроссе должно быть больше нуля.`);
  }
}

/**
 * Строит протокол квалификации и очки Rквал (N, N-1, ..., 1).
 */
function buildQualificationStandings(athletes, attempts) {
  ensureAllAthletesHaveData(athletes, Object.keys(attempts), 'квалификации');

  const rows = athletes.map(a => ({ athlete: a, attempt: attempts[a.id] }));

  validateQualificationTieBreakers(rows);

  const ordered = [...rows].sort((a, b) => {
    if (a.attempt.isDnf !== b.attempt.isDnf) return a.attempt.isDnf - b.attempt.isDnf;
    if (a.attempt.totalSeconds !== b.attempt.totalSeconds) return a.attempt.totalSeconds - b.attempt.totalSeconds;
    const ar = a.attempt.redTrackSeconds ?? Number.MAX_VALUE;
    const br = b.attempt.redTrackSeconds ?? Number.MAX_VALUE;
    if (ar !== br) return ar - br;
    const ag = a.attempt.greenTrackSeconds ?? Number.MAX_VALUE;
    const bg = b.attempt.greenTrackSeconds ?? Number.MAX_VALUE;
    if (ag !== bg) return ag - bg;
    const at = a.attempt.redTieBreakSeconds ?? Number.MAX_VALUE;
    const bt = b.attempt.redTieBreakSeconds ?? Number.MAX_VALUE;
    if (at !== bt) return at - bt;
    return (a.athlete.id || '').localeCompare(b.athlete.id || '');
  });

  const n = ordered.length;
  return ordered.map((row, i) => ({
    athlete: row.athlete,
    place: i + 1,
    qualificationPoints: n - i,
    redTrackSeconds: row.attempt.redTrackSeconds,
    greenTrackSeconds: row.attempt.greenTrackSeconds,
    redTieBreakSeconds: row.attempt.redTieBreakSeconds,
    isDnf: row.attempt.isDnf
  }));
}

/**
 * Строит рейтинг снежного этапа: R1 = Rквал + Rh2h.
 */
function buildStage1Results(qualificationStandings, h2hResults) {
  const athletes = qualificationStandings.map(q => q.athlete);
  ensureAllAthletesHaveData(athletes, Object.keys(h2hResults), 'снежного этапа');

  const stage1 = qualificationStandings.map(q => {
    const h2h = h2hResults[q.athlete.id];
    const r1 = q.qualificationPoints + h2h.h2hPoints;
    return {
      athlete: q.athlete,
      qualificationPlace: q.place,
      qualificationPoints: q.qualificationPoints,
      h2hWins: h2h.wins,
      h2hPoints: h2h.h2hPoints,
      r1
    };
  });

  stage1.sort((a, b) => {
    if (b.r1 !== a.r1) return b.r1 - a.r1;
    if (a.qualificationPlace !== b.qualificationPlace) return a.qualificationPlace - b.qualificationPlace;
    return (a.athlete.id || '').localeCompare(b.athlete.id || '');
  });

  return stage1;
}

/**
 * Строит финальный рейтинг по классам: R2 по месту в кроссе, R = R1 + R2.
 */
function buildFinalResultsByClass(stage1Results, crossPlacesByAthleteId) {
  const athletes = stage1Results.map(s => s.athlete);
  ensureAllAthletesHaveData(athletes, Object.keys(crossPlacesByAthleteId), 'кросса');

  const classes = Object.values(BoatClass);
  const final = [];

  for (const boatClass of classes) {
    const inClass = stage1Results.filter(s => s.athlete.boatClass === boatClass);
    if (inClass.length === 0) continue;

    const classIds = inClass.map(x => x.athlete.id);
    validateCrossPlacesUniqueness(boatClass, classIds, crossPlacesByAthleteId);

    const n = inClass.length;
    const orderedByCross = [...inClass].sort((a, b) =>
      crossPlacesByAthleteId[a.athlete.id] - crossPlacesByAthleteId[b.athlete.id]
    );
    const r2ById = {};
    orderedByCross.forEach((x, i) => {
      r2ById[x.athlete.id] = n - i;
    });

    let ranked = inClass.map(x => {
      const crossPlace = crossPlacesByAthleteId[x.athlete.id];
      const r2 = r2ById[x.athlete.id];
      const totalRating = x.r1 + r2;
      return {
        athlete: x.athlete,
        crossPlace,
        r1: x.r1,
        r2,
        totalRating,
        h2hWins: x.h2hWins,
        qualificationPoints: x.qualificationPoints,
        finalPlaceInClass: 0
      };
    });

    ranked.sort((a, b) => {
      if (b.totalRating !== a.totalRating) return b.totalRating - a.totalRating;
      if (a.crossPlace !== b.crossPlace) return a.crossPlace - b.crossPlace;
      if (b.h2hWins !== a.h2hWins) return b.h2hWins - a.h2hWins;
      if (b.qualificationPoints !== a.qualificationPoints) return b.qualificationPoints - a.qualificationPoints;
      return (a.athlete.id || '').localeCompare(b.athlete.id || '');
    });

    ranked = ranked.map((x, i) => ({ ...x, finalPlaceInClass: i + 1 }));
    final.push(...ranked);
  }

  final.sort((a, b) => {
    const classOrder = classes.indexOf(a.athlete.boatClass) - classes.indexOf(b.athlete.boatClass);
    if (classOrder !== 0) return classOrder;
    return a.finalPlaceInClass - b.finalPlaceInClass;
  });

  return final;
}

/**
 * Полный расчёт: входные данные -> квалификация, параллельные спуски, финал.
 */
function runContest(data) {
  const athletes = data.athletes.map(a =>
    createAthlete(a.id, a.displayName, a.boatClass, a.cityClub ?? null)
  );

  const attempts = {};
  for (const q of data.qualificationAttempts || []) {
    attempts[q.athleteId] = createQualificationAttempt(
      q.redTrackSeconds,
      q.greenTrackSeconds,
      q.redTieBreakSeconds
    );
  }

  const h2hResults = {};
  for (const h of data.h2hResults || []) {
    h2hResults[h.athleteId] = createH2hResult(h.athleteId, h.wins, h.losses, h.dnfs);
  }

  const crossPlaces = {};
  for (const c of data.crossPlaces || []) {
    crossPlaces[c.athleteId] = c.place;
  }

  const qualification = buildQualificationStandings(athletes, attempts);
  const stage1 = buildStage1Results(qualification, h2hResults);
  const finalResults = buildFinalResultsByClass(stage1, crossPlaces);

  return {
    qualification,
    stage1,
    finalResults,
    boatClassLabels: BOAT_CLASS_LABELS
  };
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.SnowContest = {
    BoatClass,
    BOAT_CLASS_LABELS,
    buildQualificationStandings,
    buildStage1Results,
    buildFinalResultsByClass,
    runContest,
    createAthlete,
    createQualificationAttempt,
    createH2hResult
  };
}
