/**
 * Общий формат отображения квалификации: рейтинг и админка.
 */

function formatQualificationValue(value, nullSymbol) {
  if (value === null) return nullSymbol ?? '-';
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(2);
  return value ?? '';
}

function formatQualificationTotalTime(row, nullSymbol) {
  const redMissing = row.redTrackSeconds === undefined;
  const greenMissing = row.greenTrackSeconds === undefined;
  if (redMissing || greenMissing) return '';
  if (row.redTrackSeconds === null || row.greenTrackSeconds === null) return nullSymbol ?? 'НФ';
  if (row.redTrackSeconds != null && row.greenTrackSeconds != null) {
    const total = (row.redTrackSeconds + row.greenTrackSeconds).toFixed(2);
    if (row.redTieBreakSeconds != null) return `${total} (${row.redTieBreakSeconds.toFixed(2)})`;
    return total;
  }
  return '';
}

/** Для сортировки черновика квалификации (когда место ещё не рассчитано). */
function getQualificationDraftSortValue(row) {
  let sum = 0, filled = 0;
  if (typeof row.redTrackSeconds === 'number' && Number.isFinite(row.redTrackSeconds)) {
    sum += row.redTrackSeconds; filled += 1;
  }
  if (typeof row.greenTrackSeconds === 'number' && Number.isFinite(row.greenTrackSeconds)) {
    sum += row.greenTrackSeconds; filled += 1;
  }
  return filled === 0 ? Number.POSITIVE_INFINITY : sum / filled;
}

if (typeof window !== 'undefined') {
  window.SnowContestQualificationFormat = {
    formatQualificationValue,
    formatQualificationTotalTime,
    getQualificationDraftSortValue
  };
}
