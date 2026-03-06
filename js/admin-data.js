/**
 * Состояние данных админки и синхронизация с хранилищем.
 */

let data = null;

function getData() {
  if (data === null) {
    data = window.SnowContestStorage.loadData();
  }
  return data;
}

function setData(newData) {
  data = newData;
}

function saveDataToStorage() {
  window.SnowContestStorage.saveDataToStorage(getData());
}

function syncFromData() {
  const d = getData();
  d.qualificationAttempts = d.athletes.map(a => {
    const q = d.qualificationAttempts.find(x => x.athleteId === a.id) || {};
    return { athleteId: a.id, redTrackSeconds: q.redTrackSeconds, greenTrackSeconds: q.greenTrackSeconds, redTieBreakSeconds: q.redTieBreakSeconds };
  });
  d.h2hResults = d.athletes.map(a => {
    const h = d.h2hResults.find(x => x.athleteId === a.id) || {};
    return { athleteId: a.id, wins: h.wins ?? 0, losses: h.losses ?? 0, dnfs: h.dnfs ?? 0 };
  });
  d.parallelPairs = (d.parallelPairs || []).filter(pair => {
    const hasAthlete1 = !pair.athlete1Id || d.athletes.some(a => a.id === pair.athlete1Id);
    const hasAthlete2 = !pair.athlete2Id || d.athletes.some(a => a.id === pair.athlete2Id);
    return hasAthlete1 && hasAthlete2;
  }).map(pair => ({
    ...pair,
    outcomeAttempt1: pair.outcomeAttempt1 ?? pair.outcome ?? null,
    outcomeAttempt2: pair.outcomeAttempt2 ?? null
  }));
  d.crossPlaces = d.athletes.map(a => {
    const c = d.crossPlaces.find(x => x.athleteId === a.id) || {};
    return { athleteId: a.id, place: c.place ?? 1 };
  });
  if (d.meta.stage1Calculated === undefined) d.meta.stage1Calculated = false;
  if (d.meta.finalCalculated === undefined) d.meta.finalCalculated = false;
}

function updateAthleteIdReferences(oldId, newId) {
  const d = getData();
  d.qualificationAttempts.forEach(r => { if (r.athleteId === oldId) r.athleteId = newId; });
  d.h2hResults.forEach(r => { if (r.athleteId === oldId) r.athleteId = newId; });
  d.parallelPairs.forEach(pair => {
    if (pair.athlete1Id === oldId) pair.athlete1Id = newId;
    if (pair.athlete2Id === oldId) pair.athlete2Id = newId;
  });
  d.crossPlaces.forEach(r => { if (r.athleteId === oldId) r.athleteId = newId; });
  if (d.crossHeats && typeof d.crossHeats === 'object') {
    for (const boatClass of Object.keys(d.crossHeats)) {
      const classHeats = d.crossHeats[boatClass];
      const heatArrays = Array.isArray(classHeats) ? [classHeats] : (classHeats && typeof classHeats === 'object' ? Object.values(classHeats).filter(Array.isArray) : []);
      for (const heats of heatArrays) {
        if (!Array.isArray(heats)) continue;
        for (const heat of heats) {
          if (heat.athleteIds) {
            for (let i = 0; i < heat.athleteIds.length; i++) {
              if (heat.athleteIds[i] === oldId) heat.athleteIds[i] = newId;
            }
          }
          if (heat.participants) {
            for (const p of heat.participants) {
              if (p.athleteId === oldId) p.athleteId = newId;
            }
          }
        }
      }
    }
  }
}

function getAthletesSortedByNumber() {
  const d = getData();
  return [...d.athletes].sort((a, b) =>
    (a.id || '').localeCompare(b.id || '', 'ru', { numeric: true, sensitivity: 'base' })
  );
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminData = {
    getData,
    setData,
    saveDataToStorage,
    syncFromData,
    updateAthleteIdReferences,
    getAthletesSortedByNumber
  };
}
