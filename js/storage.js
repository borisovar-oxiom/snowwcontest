/**
 * Работа с localStorage: данные админки и опубликованные результаты.
 */

function normalizePublication(source) {
  const normalizedPairs = (source.parallelPairs || []).map(pair => ({
    ...pair,
    outcomeAttempt1: pair.outcomeAttempt1 ?? pair.outcome ?? null,
    outcomeAttempt2: pair.outcomeAttempt2 ?? null
  }));
  return {
    athletes: source.athletes || [],
    qualification: source.qualification || null,
    parallelPairs: normalizedPairs,
    stage1: source.stage1 || null,
    crossHeats: source.crossHeats || null,
    crossPlaces: source.crossPlaces || null,
    finalResults: source.finalResults || null,
    boatClassLabels: source.boatClassLabels || {}
  };
}

function getPublication() {
  const { PUBLICATION_KEY } = window.SnowContestConstants;
  try {
    const raw = localStorage.getItem(PUBLICATION_KEY);
    if (raw) return normalizePublication(JSON.parse(raw));
  } catch (e) {}
  return null;
}

function loadData() {
  const { STORAGE_KEY } = window.SnowContestConstants;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        athletes: parsed.athletes || [],
        qualificationAttempts: parsed.qualificationAttempts || [],
        h2hResults: parsed.h2hResults || [],
        parallelPairs: parsed.parallelPairs || [],
        crossPlaces: parsed.crossPlaces || [],
        crossHeats: parsed.crossHeats || null,
        meta: {
          qualificationCalculated: parsed.meta?.qualificationCalculated ?? false,
          stage1Calculated: parsed.meta?.stage1Calculated ?? false,
          finalCalculated: parsed.meta?.finalCalculated ?? false
        }
      };
    }
  } catch (e) {}
  return {
    athletes: [],
    qualificationAttempts: [],
    h2hResults: [],
    parallelPairs: [],
    crossPlaces: [],
    crossHeats: null,
    meta: { qualificationCalculated: false, stage1Calculated: false, finalCalculated: false }
  };
}

function saveDataToStorage(data) {
  const { STORAGE_KEY } = window.SnowContestConstants;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPublication() {
  const { PUBLICATION_KEY } = window.SnowContestConstants;
  try {
    const raw = localStorage.getItem(PUBLICATION_KEY);
    if (!raw) {
      return {
        athletes: [],
        qualification: null,
        parallelPairs: [],
        stage1: null,
        finalResults: null,
        crossHeats: null,
        crossPlaces: null,
        boatClassLabels: window.SnowContest.BOAT_CLASS_LABELS
      };
    }
    const parsed = JSON.parse(raw);
    return {
      athletes: parsed.athletes || [],
      qualification: parsed.qualification || null,
      parallelPairs: parsed.parallelPairs || [],
      stage1: parsed.stage1 || null,
      finalResults: parsed.finalResults || null,
      crossHeats: parsed.crossHeats || null,
      crossPlaces: parsed.crossPlaces || null,
      boatClassLabels: parsed.boatClassLabels || window.SnowContest.BOAT_CLASS_LABELS
    };
  } catch (e) {
    return {
      athletes: [],
      qualification: null,
      parallelPairs: [],
      stage1: null,
      finalResults: null,
      crossHeats: null,
      crossPlaces: null,
      boatClassLabels: window.SnowContest.BOAT_CLASS_LABELS
    };
  }
}

function savePublication(publication) {
  const { PUBLICATION_KEY } = window.SnowContestConstants;
  localStorage.setItem(PUBLICATION_KEY, JSON.stringify(publication));
}

if (typeof window !== 'undefined') {
  window.SnowContestStorage = {
    normalizePublication,
    getPublication,
    loadData,
    saveDataToStorage,
    loadPublication,
    savePublication
  };
}
