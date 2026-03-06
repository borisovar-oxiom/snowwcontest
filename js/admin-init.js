/**
 * Инициализация админки: сортировка таблиц, рендер, обработчики кнопок.
 */

function rerenderTable(tableName) {
  const { renderAthletes, renderQualification, renderParallelPairs, renderCross, renderAll } = window.SnowContestAdminRender;
  const showMsg = window.SnowContestUI.showMsg;
  if (tableName === 'athletes') renderAthletes(showMsg, rerenderTable);
  else if (tableName === 'qualification') renderQualification(showMsg, rerenderTable);
  else if (tableName === 'parallelPairs') renderParallelPairs(rerenderTable);
  else if (tableName === 'cross') renderCross(rerenderTable);
  else if (tableName === 'all') renderAll(showMsg, rerenderTable);
  window.SnowContestAdminSort.updateSortIndicators();
}

/** Случайное число в диапазоне [min, max] с шагом 0.1 */
function randomTime(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

/** Генерирует пример: 15 атлетов, у двух одинаковое время + доп. заезд, пары, результаты, кросс */
function buildSampleData() {
  const OUTCOMES = ['A_WIN', 'B_WIN'];
  const athletes = [
    { id: 'К1М-1', displayName: 'Иван Петров', boatClass: 'К1М', cityClub: 'Уфа / Клуб А' },
    { id: 'К1М-2', displayName: 'Роман Сидоров', boatClass: 'К1М', cityClub: 'Уфа / Клуб А' },
    { id: 'К1М-3', displayName: 'Дмитрий Козлов', boatClass: 'К1М', cityClub: 'Уфа / Клуб А' },
    { id: 'К1М-4', displayName: 'Алексей Новиков', boatClass: 'К1М', cityClub: 'Уфа / Клуб B' },
    { id: 'К1М-5', displayName: 'Сергей Волков', boatClass: 'К1М', cityClub: 'Уфа / Клуб B' },
    { id: 'К1Ж-1', displayName: 'Анна Волкова', boatClass: 'К1Ж', cityClub: 'Уфа / Клуб А' },
    { id: 'К1Ж-2', displayName: 'Мария Смирнова', boatClass: 'К1Ж', cityClub: 'Уфа / Клуб А' },
    { id: 'К1Ж-3', displayName: 'Елена Кузнецова', boatClass: 'К1Ж', cityClub: 'Уфа / Клуб C' },
    { id: 'К1Ж-4', displayName: 'Ольга Морозова', boatClass: 'К1Ж', cityClub: 'Уфа / Клуб C' },
    { id: 'П1М-1', displayName: 'Егор Иванов', boatClass: 'П1М', cityClub: 'Уфа / Клуб D' },
    { id: 'П1М-2', displayName: 'Никита Соколов', boatClass: 'П1М', cityClub: 'Уфа / Клуб D' },
    { id: 'П1М-3', displayName: 'Артём Попов', boatClass: 'П1М', cityClub: 'Уфа / Клуб D' },
    { id: 'П1Ж-1', displayName: 'Татьяна Федорова', boatClass: 'П1Ж', cityClub: 'Уфа / Клуб E' },
    { id: 'П1Ж-2', displayName: 'Наталья Михайлова', boatClass: 'П1Ж', cityClub: 'Уфа / Клуб E' },
    { id: 'П1Ж-3', displayName: 'Юлия Васильева', boatClass: 'П1Ж', cityClub: 'Уфа / Клуб E' }
  ];

  const tiedIndex1 = 4;
  const tiedIndex2 = 9;
  const sharedTotal = randomTime(108, 118);
  const redShared = Math.floor(sharedTotal / 2 * 10) / 10;
  const greenShared = Math.round((sharedTotal - redShared) * 10) / 10;

  const qualificationAttempts = athletes.map((a, i) => {
    let red, green, redTieBreak = null;
    if (i === tiedIndex1) {
      red = redShared;
      green = greenShared;
      redTieBreak = randomTime(54, 55.5);
    } else if (i === tiedIndex2) {
      red = redShared;
      green = greenShared;
      redTieBreak = randomTime(55.6, 57);
    } else {
      red = randomTime(52, 62);
      green = randomTime(53, 63);
    }
    return { athleteId: a.id, redTrackSeconds: red, greenTrackSeconds: green, redTieBreakSeconds: redTieBreak };
  });

  const attemptById = new Map(qualificationAttempts.map(q => [q.athleteId, q]));

  const sorted = [...athletes].sort((a, b) => {
    const qa = attemptById.get(a.id);
    const qb = attemptById.get(b.id);
    const ta = (qa?.redTrackSeconds ?? 999) + (qa?.greenTrackSeconds ?? 999);
    const tb = (qb?.redTrackSeconds ?? 999) + (qb?.greenTrackSeconds ?? 999);
    if (ta !== tb) return ta - tb;
    const ra = qa?.redTieBreakSeconds ?? 999;
    const rb = qb?.redTieBreakSeconds ?? 999;
    return ra - rb;
  });

  const orderedIds = sorted.map(a => a.id);
  const pairs = [];
  const n = orderedIds.length;
  const mid = Math.floor(n / 2);
  let forPairing = [...orderedIds];
  if (n % 2 === 1) {
    pairs.push({
      athlete1Id: forPairing[mid],
      athlete2Id: null,
      athlete2Label: 'Организатор',
      outcomeAttempt1: 'A_WIN',
      outcomeAttempt2: 'A_WIN'
    });
    forPairing.splice(mid, 1);
  }
  for (let i = 0; i < forPairing.length; i += 2) {
    const a1 = forPairing[i];
    const a2 = forPairing[i + 1];
    if (!a1 || !a2) continue;
    pairs.push({
      athlete1Id: a1,
      athlete2Id: a2,
      outcomeAttempt1: OUTCOMES[Math.random() < 0.5 ? 0 : 1],
      outcomeAttempt2: OUTCOMES[Math.random() < 0.5 ? 0 : 1]
    });
  }

  const h2h = new Map(athletes.map(a => [a.id, { athleteId: a.id, wins: 0, losses: 0, dnfs: 0 }]));
  for (const p of pairs) {
    const apply = (outcome) => {
      if (!outcome) return;
      const ha = h2h.get(p.athlete1Id);
      if (!ha) return;
      if (!p.athlete2Id) {
        if (outcome === 'A_WIN' || outcome === 'B_DNF') ha.wins++;
        else if (outcome === 'B_WIN') ha.losses++;
        else ha.dnfs++;
        return;
      }
      const hb = h2h.get(p.athlete2Id);
      if (!hb) return;
      if (outcome === 'A_WIN') { ha.wins++; hb.losses++; }
      else if (outcome === 'B_WIN') { hb.wins++; ha.losses++; }
      else if (outcome === 'A_DNF') { ha.dnfs++; hb.wins++; }
      else if (outcome === 'B_DNF') { hb.dnfs++; ha.wins++; }
      else { ha.dnfs++; hb.dnfs++; }
    };
    apply(p.outcomeAttempt1);
    apply(p.outcomeAttempt2);
  }

  const h2hResults = Array.from(h2h.values());
  const crossPlaces = [];
  const byClass = new Map();
  for (const a of athletes) {
    if (!byClass.has(a.boatClass)) byClass.set(a.boatClass, []);
    byClass.get(a.boatClass).push(a.id);
  }
  for (const [boatClass, ids] of byClass) {
    const order = [...ids].sort((idA, idB) => {
      const iA = orderedIds.indexOf(idA);
      const iB = orderedIds.indexOf(idB);
      return iA - iB;
    });
    order.forEach((id, idx) => crossPlaces.push({ athleteId: id, place: idx + 1 }));
  }

  return {
    athletes,
    qualificationAttempts,
    h2hResults,
    parallelPairs: pairs,
    crossPlaces,
    meta: { qualificationCalculated: true, stage1Calculated: true, finalCalculated: true }
  };
}

function bindAdminEvents() {
  const showMsg = window.SnowContestUI.showMsg;
  const { getData, setData, syncFromData, saveDataToStorage } = window.SnowContestAdminData;
  const { buildPublicationAthletes } = window.SnowContestAdminPublish;
  const { generateParallelPairsFromQualification } = window.SnowContestAdminPairs;

  document.getElementById('addAthlete').addEventListener('click', () => {
    const newId = document.getElementById('newId').value.trim();
    const name = document.getElementById('newName').value.trim();
    const cityClub = document.getElementById('newCityClub').value.trim();
    const boatClass = document.getElementById('newClass').value;
    if (!newId || !name) {
      showMsg('Укажите номер и имя участника', true);
      return;
    }
    const d = getData();
    if (d.athletes.some(a => a.id === newId)) {
      showMsg('Участник с таким номером уже есть', true);
      return;
    }
    d.athletes.push({ id: newId, displayName: name, boatClass, cityClub: cityClub || undefined });
    d.meta.qualificationCalculated = false;
    d.meta.stage1Calculated = false;
    d.meta.finalCalculated = false;
    d.parallelPairs = [];
    document.getElementById('newId').value = '';
    document.getElementById('newName').value = '';
    document.getElementById('newCityClub').value = '';
    syncFromData();
    rerenderTable('all');
    showMsg('Участник добавлен');
  });

  document.getElementById('publishData').addEventListener('click', () => {
    window.SnowContestAdminPublish.publishAllData();
  });

  document.getElementById('loadSample').addEventListener('click', () => {
    const sampleData = buildSampleData();
    setData(sampleData);
    const d = getData();
    if (window.SnowContestAdminPairs && typeof window.SnowContestAdminPairs.buildCrossHeats === 'function') {
      d.crossHeats = window.SnowContestAdminPairs.buildCrossHeats(d, {});
    }
    saveDataToStorage();
    const results = window.SnowContest.runContest(sampleData);
    window.SnowContestStorage.savePublication({
      athletes: buildPublicationAthletes(),
      qualification: results.qualification,
      parallelPairs: sampleData.parallelPairs,
      stage1: results.stage1,
      finalResults: results.finalResults,
      boatClassLabels: results.boatClassLabels || window.SnowContest.BOAT_CLASS_LABELS
    });
    rerenderTable('all');
    showMsg('Пример загружен (15 атлетов, у двух одинаковое время и дополнительный заезд)');
  });

  document.getElementById('clearAllData').addEventListener('click', () => {
    const emptyData = {
      athletes: [],
      qualificationAttempts: [],
      h2hResults: [],
      parallelPairs: [],
      crossPlaces: [],
      crossHeats: null,
      meta: { qualificationCalculated: false, stage1Calculated: false, finalCalculated: false }
    };
    setData(emptyData);
    saveDataToStorage();
    window.SnowContestStorage.savePublication({
      athletes: [],
      qualification: null,
      parallelPairs: [],
      stage1: null,
      finalResults: null,
      boatClassLabels: window.SnowContest.BOAT_CLASS_LABELS
    });
    rerenderTable('all');
    showMsg('Все данные удалены');
  });

  document.getElementById('generatePairs').addEventListener('click', () => {
    generateParallelPairsFromQualification(showMsg);
    rerenderTable('parallelPairs');
    rerenderTable('qualification');
  });

  const calculateStage1Btn = document.getElementById('calculateStage1');
  if (calculateStage1Btn) {
    calculateStage1Btn.addEventListener('click', () => {
      window.SnowContestAdminPairs.calculateStage1Rating(showMsg);
      rerenderTable('parallelPairs');
      rerenderTable('cross');
    });
  }

  const calculateFinalBtn = document.getElementById('calculateFinal');
  if (calculateFinalBtn) {
    calculateFinalBtn.addEventListener('click', () => {
      window.SnowContestAdminPublish.publishFinalRating();
    });
  }
}

function initAdminPage() {
  window.SnowContestAdminSort.setupTableSorting(rerenderTable);
  bindAdminEvents();
  rerenderTable('all');
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminInit = {
    rerenderTable,
    bindAdminEvents,
    initAdminPage
  };
}
