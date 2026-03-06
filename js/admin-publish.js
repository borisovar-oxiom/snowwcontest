/**
 * Публикация данных: сбор в объект публикации и сохранение в localStorage.
 */

function buildPublicationAthletes() {
  return window.SnowContestAdminData.getAthletesSortedByNumber().map(a => ({
    id: a.id,
    displayName: a.displayName,
    boatClass: a.boatClass,
    cityClub: a.cityClub || null
  }));
}

function buildQualificationDraftForPublication() {
  const { getData, getAthletesSortedByNumber } = window.SnowContestAdminData;
  const d = getData();
  const athletes = getAthletesSortedByNumber();
  return athletes.map(a => {
    const q = d.qualificationAttempts.find(x => x.athleteId === a.id) || {};
    const redTrackSeconds = q.redTrackSeconds;
    const greenTrackSeconds = q.greenTrackSeconds;
    const isDnf = redTrackSeconds === null || greenTrackSeconds === null;
    return {
      athlete: { id: a.id, displayName: a.displayName, boatClass: a.boatClass, cityClub: a.cityClub || null },
      place: null,
      qualificationPoints: null,
      redTrackSeconds,
      greenTrackSeconds,
      redTieBreakSeconds: q.redTieBreakSeconds ?? null,
      isDnf
    };
  });
}

function publishParticipantsOnly() {
  const publication = window.SnowContestStorage.loadPublication();
  publication.athletes = buildPublicationAthletes();
  publication.qualification = buildQualificationDraftForPublication();
  publication.parallelPairs = [];
  publication.stage1 = null;
  publication.finalResults = null;
  publication.boatClassLabels = window.SnowContest.BOAT_CLASS_LABELS;
  window.SnowContestStorage.savePublication(publication);
}

function publishAllData(options = {}) {
  const showSuccessMessage = options.showSuccessMessage !== false;
  const showMsg = window.SnowContestUI.showMsg;
  const { getData, saveDataToStorage } = window.SnowContestAdminData;
  const { collectQualificationFromForm } = window.SnowContestAdminQualification;
  const { collectParallelPairsFromForm, recalculateH2hFromPairs, ensureNextRounds, computeCrossPlacesFromHeats } = window.SnowContestAdminPairs;

  collectQualificationFromForm();
  collectParallelPairsFromForm();
  recalculateH2hFromPairs();

  const d = getData();
  /* Сохраняем черновик в localStorage, чтобы исходы параллельных спусков не терялись при обновлении страницы */
  saveDataToStorage();

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
  if (d.athletes.length === 0) {
    showMsg('Добавьте хотя бы одного участника', true);
    return false;
  }
  if (!d.meta.qualificationCalculated) {
    publishParticipantsOnly();
    if (showSuccessMessage) {
      showMsg('Данные опубликованы: доступен протокол квалификации без мест и очков');
    }
    return true;
  }
  try {
    const results = window.SnowContest.runContest(d);
    const publication = window.SnowContestStorage.loadPublication();
    publication.athletes = buildPublicationAthletes();
    publication.qualification = results.qualification;
    publication.stage1 = d.meta.stage1Calculated ? results.stage1 : null;
    publication.finalResults = d.meta.finalCalculated ? results.finalResults : null;
    publication.boatClassLabels = results.boatClassLabels || window.SnowContest.BOAT_CLASS_LABELS;
    publication.parallelPairs = d.parallelPairs || [];
    publication.crossHeats = (d.meta.stage1Calculated && d.crossHeats) ? d.crossHeats : null;
    publication.crossPlaces = (d.meta.stage1Calculated && d.crossPlaces) ? d.crossPlaces : null;
    window.SnowContestStorage.savePublication(publication);
    if (showSuccessMessage) {
      showMsg('Рейтинги рассчитаны и опубликованы по этапам. Откройте страницу «Рейтинги».');
    }
    return true;
  } catch (err) {
    showMsg(err.message || 'Ошибка расчёта', true);
    return false;
  }
}

/**
 * Проверяет таблицу «Места в кроссе (этап 2)» и публикует итоговый рейтинг.
 * После успешной публикации на странице «Рейтинги» становится доступна вкладка «Итоговый рейтинг».
 */
function publishFinalRating() {
  const showMsg = window.SnowContestUI.showMsg;
  const { getData, saveDataToStorage } = window.SnowContestAdminData;
  const { collectQualificationFromForm } = window.SnowContestAdminQualification;
  const { collectParallelPairsFromForm, recalculateH2hFromPairs, ensureNextRounds, computeCrossPlacesFromHeats } = window.SnowContestAdminPairs;

  collectQualificationFromForm();
  collectParallelPairsFromForm();
  recalculateH2hFromPairs();

  const d = getData();
  if (d.athletes.length === 0) {
    showMsg('Добавьте хотя бы одного участника', true);
    return;
  }
  if (!d.meta.qualificationCalculated) {
    showMsg('Сначала рассчитайте рейтинг и сформируйте пары (квалификация)', true);
    return;
  }
  if (!d.meta.stage1Calculated) {
    showMsg('Сначала рассчитайте рейтинг этапа 1 и сформируйте хиты (кнопка «Рассчитать рейтинг ЭТАПА 1 и сформировать хиты для кросса»)', true);
    return;
  }

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

  const missing = [];
  for (const a of d.athletes) {
    const c = d.crossPlaces.find(x => x.athleteId === a.id);
    const place = c && c.place != null ? Number(c.place) : NaN;
    if (!Number.isInteger(place) || place < 1) {
      missing.push(a.displayName || a.id);
    }
  }
  if (missing.length > 0) {
    showMsg('Заполните место в кроссе для всех участников: ' + missing.join(', '), true);
    return;
  }

  try {
    const results = window.SnowContest.runContest(d);
    d.meta.finalCalculated = true;
    saveDataToStorage();
    const publication = window.SnowContestStorage.loadPublication();
    publication.athletes = buildPublicationAthletes();
    publication.qualification = results.qualification;
    publication.stage1 = d.meta.stage1Calculated ? results.stage1 : null;
    publication.finalResults = results.finalResults;
    publication.boatClassLabels = results.boatClassLabels || window.SnowContest.BOAT_CLASS_LABELS;
    publication.parallelPairs = d.parallelPairs || [];
    publication.crossHeats = d.crossHeats || null;
    publication.crossPlaces = d.crossPlaces || null;
    window.SnowContestStorage.savePublication(publication);
  } catch (err) {
    showMsg(err.message || 'Ошибка в таблице «Места в кроссе (этап 2)»: проверьте, что у всех участников указано место больше нуля.', true);
  }
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminPublish = {
    buildPublicationAthletes,
    buildQualificationDraftForPublication,
    publishParticipantsOnly,
    publishAllData,
    publishFinalRating
  };
}
