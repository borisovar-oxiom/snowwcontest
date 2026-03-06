/**
 * Квалификация в админке: формат/парсинг полей, превью протокола, сбор и валидация формы.
 * Отображение времени — через qualification-format.js (общий с рейтингом).
 */

function formatQualificationValue(value) {
  return window.SnowContestQualificationFormat.formatQualificationValue(value, '-');
}

function parseQualificationValue(raw) {
  const normalized = (raw || '').trim();
  if (normalized === '') return { value: undefined, isValid: true };
  if (normalized === '-') return { value: null, isValid: true };
  const parsed = Number(normalized.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) return { value: undefined, isValid: false };
  // только сотые, тысячные не принимаем
  const rounded = Math.round(parsed * 100) / 100;
  return { value: rounded, isValid: true };
}

function buildQualificationStandingsForPairs() {
  const { getData, getAthletesSortedByNumber } = window.SnowContestAdminData;
  const d = getData();
  const athletes = getAthletesSortedByNumber().map(a =>
    window.SnowContest.createAthlete(a.id, a.displayName, a.boatClass)
  );
  const attempts = {};
  for (const q of d.qualificationAttempts || []) {
    attempts[q.athleteId] = window.SnowContest.createQualificationAttempt(
      q.redTrackSeconds,
      q.greenTrackSeconds,
      q.redTieBreakSeconds
    );
  }
  return window.SnowContest.buildQualificationStandings(athletes, attempts);
}

function buildQualificationPreviewByAthleteId() {
  try {
    const standings = buildQualificationStandingsForPairs();
    return new Map(standings.map(row => [row.athlete.id, row]));
  } catch (err) {
    return new Map();
  }
}

function getTieBreakRequiredAthleteIds() {
  const { getData } = window.SnowContestAdminData;
  const d = getData();
  const byKey = new Map();
  for (const q of d.qualificationAttempts || []) {
    if (q.redTrackSeconds == null || q.greenTrackSeconds == null) continue;
    const key = `${(q.redTrackSeconds + q.greenTrackSeconds).toFixed(6)}_${q.redTrackSeconds.toFixed(6)}_${q.greenTrackSeconds.toFixed(6)}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(q.athleteId);
  }
  const ids = new Set();
  for (const group of byKey.values()) {
    if (group.length <= 1) continue;
    group.forEach(id => ids.add(id));
  }
  return ids;
}

function collectQualificationFromForm() {
  const { getData } = window.SnowContestAdminData;
  const d = getData();
  document.querySelectorAll('#qualBody input').forEach(inp => {
    const aid = inp.dataset.athlete;
    const field = inp.dataset.field;
    const raw = inp.value.trim();
    const val = field === 'redTrackSeconds' || field === 'greenTrackSeconds' || field === 'redTieBreakSeconds'
      ? parseQualificationValue(raw).value
      : (parseInt(inp.value, 10) || 0);
    const q = d.qualificationAttempts.find(x => x.athleteId === aid);
    if (q) q[field] = val;
  });
}

function validateQualificationRequiredFields(showMsg) {
  const { getData } = window.SnowContestAdminData;
  const d = getData();
  const rows = Array.from(document.querySelectorAll('#qualBody tr[data-id]'));
  for (const row of rows) {
    const athleteId = row.dataset.id;
    const athlete = d.athletes.find(a => a.id === athleteId);
    const athleteLabel = athlete ? `${athlete.id} — ${athlete.displayName}` : athleteId;
    const redInput = row.querySelector('input[data-field="redTrackSeconds"]');
    const greenInput = row.querySelector('input[data-field="greenTrackSeconds"]');
    if (!redInput || !greenInput) continue;

    if (redInput.value.trim() === '' || greenInput.value.trim() === '') {
      showMsg(`Заполните квалификацию для участника ${athleteLabel} (или введите "-" для НФ)`, true);
      return false;
    }

    const redParsed = parseQualificationValue(redInput.value);
    const greenParsed = parseQualificationValue(greenInput.value);
    if (!redParsed.isValid || !greenParsed.isValid) {
      showMsg(`Неверный формат времени у участника ${athleteLabel}: используйте число или "-"`, true);
      return false;
    }
  }
  return true;
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminQualification = {
    formatQualificationValue,
    parseQualificationValue,
    buildQualificationStandingsForPairs,
    buildQualificationPreviewByAthleteId,
    getTieBreakRequiredAthleteIds,
    collectQualificationFromForm,
    validateQualificationRequiredFields
  };
}
