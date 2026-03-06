/**
 * Рендер пар H2H: подписи участников, бейджи трасс, текст исхода.
 * Используется на странице рейтингов (пары) и в админке (таблица пар).
 */

function athleteLabel(athleteId, fallbackLabel, athletes) {
  if (fallbackLabel) return `<span class="organizer-tag">${fallbackLabel}</span>`;
  const athlete = (athletes || []).find(a => a.id === athleteId);
  if (!athlete) return athleteId || '—';
  return `${athlete.id} — ${athlete.displayName}`;
}

function athleteLabelText(athleteId, fallbackLabel, athletes) {
  if (fallbackLabel) return fallbackLabel;
  const athlete = (athletes || []).find(a => a.id === athleteId);
  if (!athlete) return athleteId || '—';
  return `${athlete.id} — ${athlete.displayName}`;
}

function buildTrackBadges(redText, greenText) {
  return `
    <span class="track-badges">
      <span class="track-badge track-badge-red">${window.SnowContestUI.escapeHtml(redText)}</span>
      <span class="track-badge track-badge-green">${window.SnowContestUI.escapeHtml(greenText)}</span>
    </span>
  `;
}

function buildTrackBadgesForPair(pair, athletes, isSecondAttempt) {
  const athleteA = athleteLabelText(pair.athlete1Id, pair.athlete1Label, athletes);
  const athleteB = athleteLabelText(pair.athlete2Id, pair.athlete2Label, athletes);
  const redTrackAthlete = isSecondAttempt ? athleteB : athleteA;
  const greenTrackAthlete = isSecondAttempt ? athleteA : athleteB;
  return buildTrackBadges(redTrackAthlete, greenTrackAthlete);
}

function outcomeLabel(outcome, leftText, rightText) {
  let resultText = 'Ожидает результат';
  switch (outcome) {
    case 'A_WIN':
    case 'B_DNF':
      resultText = `Победа: ${leftText}`;
      break;
    case 'B_WIN':
    case 'A_DNF':
      resultText = `Победа: ${rightText}`;
      break;
    case 'BOTH_DNF':
      resultText = 'Оба НФ';
      break;
  }
  return window.SnowContestUI.escapeHtml(resultText);
}

/** Классы бейджа по исходу: win (яркий), dnf (серый); проигравший — обычный цвет. При НФ одного второй яркий как победитель. */
function getBadgeOutcomeClass(outcome, isLeft) {
  if (!outcome) return '';
  const bothDnf = outcome === 'BOTH_DNF';
  if (isLeft) {
    if (bothDnf || outcome === 'A_DNF') return 'track-badge-outcome-dnf';
    if (outcome === 'A_WIN') return 'track-badge-outcome-win';
    if (outcome === 'B_DNF') return 'track-badge-outcome-win'; // A победитель, когда B НФ
    return ''; // B победил — A обычный
  } else {
    if (bothDnf || outcome === 'B_DNF') return 'track-badge-outcome-dnf';
    if (outcome === 'B_WIN') return 'track-badge-outcome-win';
    if (outcome === 'A_DNF') return 'track-badge-outcome-win'; // B победитель, когда A НФ
    return '';
  }
}

function getPointsForOutcome(outcome) {
  switch (outcome) {
    case 'A_WIN': return { a: 2, b: 1 };
    case 'B_WIN': return { a: 1, b: 2 };
    case 'A_DNF': return { a: 0, b: 2 };
    case 'B_DNF': return { a: 2, b: 0 };
    case 'BOTH_DNF': return { a: 0, b: 0 };
    default: return { a: null, b: null };
  }
}

/** Строит бейджи трасс с подсветкой по исходу заезда (яркий=победа, тусклый=поражение, серый=НФ). Попытка 1: красная=A, зелёная=B; попытка 2: смена трасс — красная=B, зелёная=A. */
function buildOutcomeBadges(pair, outcome, isSecondAttempt, athletes) {
  const leftText = athleteLabelText(pair.athlete1Id, pair.athlete1Label, athletes);
  const rightText = athleteLabelText(pair.athlete2Id, pair.athlete2Label, athletes);
  const points = getPointsForOutcome(outcome);
  const redIsAthlete1 = !isSecondAttempt; // попытка 1: красная = A; попытка 2: красная = B
  const redPoints = redIsAthlete1 ? points.a : points.b;
  const greenPoints = redIsAthlete1 ? points.b : points.a;
  const redBadgeText = (isSecondAttempt ? rightText : leftText) + (redPoints != null ? ` + ${redPoints}` : '');
  const greenBadgeText = (isSecondAttempt ? leftText : rightText) + (greenPoints != null ? ` + ${greenPoints}` : '');
  const redClass = redIsAthlete1 ? getBadgeOutcomeClass(outcome, true) : getBadgeOutcomeClass(outcome, false);
  const greenClass = redIsAthlete1 ? getBadgeOutcomeClass(outcome, false) : getBadgeOutcomeClass(outcome, true);
  const esc = window.SnowContestUI.escapeHtml;
  return `
    <span class="track-badges">
      <span class="track-badge track-badge-red ${redClass}">${esc(redBadgeText)}</span>
      <span class="track-badge track-badge-green ${greenClass}">${esc(greenBadgeText)}</span>
    </span>
  `;
}

function outcomeLabelWithBadges(pair, outcome, isSecondAttempt, athletes) {
  const leftText = athleteLabelText(pair.athlete1Id, pair.athlete1Label, athletes);
  const rightText = athleteLabelText(pair.athlete2Id, pair.athlete2Label, athletes);
  const attemptBadges = buildOutcomeBadges(pair, outcome, isSecondAttempt, athletes);
  const resultText = outcomeLabel(outcome, leftText, rightText);
  return `<div class="pair-attempts"><div class="pair-attempt-line">${attemptBadges}</div><div class="pair-attempt-line">${resultText}</div></div>`;
}

if (typeof window !== 'undefined') {
  window.SnowContestPairRender = {
    athleteLabel,
    athleteLabelText,
    buildTrackBadges,
    buildTrackBadgesForPair,
    getBadgeOutcomeClass,
    getPointsForOutcome,
    buildOutcomeBadges,
    outcomeLabel,
    outcomeLabelWithBadges
  };
}
