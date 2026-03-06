/**
 * Админка: таблица квалификации (ввод времени, превью места/очков).
 * Расчёты — в admin-qualification.js и contest-calculator.
 */

function renderQualification(showMsg, rerenderTable) {
  const tbody = document.getElementById('qualBody');
  const { getData, getAthletesSortedByNumber } = window.SnowContestAdminData;
  const { sortRows, updateSortIndicators } = window.SnowContestAdminSort;
  const { formatQualificationValue, buildQualificationPreviewByAthleteId, getTieBreakRequiredAthleteIds, parseQualificationValue } = window.SnowContestAdminQualification;
  const d = getData();

  const athletes = getAthletesSortedByNumber();
  const qualificationPreview = d.meta.qualificationCalculated ? buildQualificationPreviewByAthleteId() : new Map();
  const tieBreakRequiredAthleteIds = getTieBreakRequiredAthleteIds();
  const showTieBreakColumn = tieBreakRequiredAthleteIds.size > 0;

  const rows = athletes.map(a => {
    const q = d.qualificationAttempts.find(x => x.athleteId === a.id) || {};
    const preview = qualificationPreview.get(a.id);
    const redFilled = q.redTrackSeconds !== undefined;
    const greenFilled = q.greenTrackSeconds !== undefined;
    const hasMissing = !redFilled || !greenFilled;
    const isDnf = q.redTrackSeconds === null || q.greenTrackSeconds === null;
    const totalTimeText = hasMissing ? '—' : (isDnf ? 'НФ' : (q.redTrackSeconds + q.greenTrackSeconds).toFixed(2));
    const totalTimeSort = hasMissing || isDnf ? null : q.redTrackSeconds + q.greenTrackSeconds;
    const tieBreakEnabled = showTieBreakColumn && tieBreakRequiredAthleteIds.has(a.id);
    return {
      athlete: a,
      q,
      preview,
      totalTimeText,
      tieBreakEnabled,
      sortValues: {
        id: a.id,
        displayName: a.displayName,
        redTrackSeconds: q.redTrackSeconds,
        greenTrackSeconds: q.greenTrackSeconds,
        totalTime: totalTimeSort,
        redTieBreakSeconds: tieBreakEnabled ? q.redTieBreakSeconds : null,
        place: preview?.place ?? null,
        qualificationPoints: preview?.qualificationPoints ?? null
      }
    };
  });

  const sortedRows = sortRows(rows, 'qualification', (row, key) => row.sortValues[key], row => row.athlete.id);
  const colCount = showTieBreakColumn ? 8 : 7;

  tbody.innerHTML = sortedRows.map(row => {
    const a = row.athlete;
    const q = row.q;
    const preview = row.preview;
    return `
      <tr data-id="${a.id}">
        <td><span style="color: var(--muted); font-size: 0.9em;">${a.id}</span></td>
        <td>${a.displayName}</td>
        <td><input type="text" inputmode="decimal" placeholder="сек или -" data-athlete="${a.id}" data-field="redTrackSeconds" value="${formatQualificationValue(q.redTrackSeconds)}"></td>
        <td><input type="text" inputmode="decimal" placeholder="сек или -" data-athlete="${a.id}" data-field="greenTrackSeconds" value="${formatQualificationValue(q.greenTrackSeconds)}"></td>
        <td><strong>${row.totalTimeText}</strong></td>
        ${showTieBreakColumn
          ? `<td class="tie-break-col">${row.tieBreakEnabled
            ? `<input type="text" inputmode="decimal" placeholder="сек или -" data-athlete="${a.id}" data-field="redTieBreakSeconds" value="${formatQualificationValue(q.redTieBreakSeconds)}">`
            : ''}</td>`
          : ''}
        <td><strong>${preview?.place ?? '—'}</strong></td>
        <td><strong>${preview?.qualificationPoints ?? '—'}</strong></td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="${colCount}" class="no-data">Добавьте участников</td></tr>`;

  document.querySelectorAll('th.tie-break-col').forEach(th => {
    th.style.display = showTieBreakColumn ? '' : 'none';
  });
  updateSortIndicators();

  tbody.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', () => {
      const aid = inp.dataset.athlete;
      const field = inp.dataset.field;
      const parsed = parseQualificationValue(inp.value);
      if (!parsed.isValid) {
        showMsg('Введите число в секундах или символ "-" для НФ', true);
        inp.focus();
        return;
      }
      const q = d.qualificationAttempts.find(x => x.athleteId === aid);
      if (q) {
        d.meta.qualificationCalculated = false;
        d.meta.stage1Calculated = false;
        d.meta.finalCalculated = false;
        d.parallelPairs = [];
        q[field] = parsed.value;
        // Откладываем перерисовку на следующий тик: к этому моменту браузер уже перенёс фокус на другое поле (Tab/клик)
        setTimeout(() => {
          const focusTarget = document.activeElement;
          const restoreFocus = focusTarget && focusTarget.closest('#qualBody') && focusTarget.matches('input[data-athlete][data-field]')
            ? { athleteId: focusTarget.dataset.athlete, field: focusTarget.dataset.field }
            : null;
          window.SnowContestAdminRender.renderQualification(showMsg, rerenderTable);
          window.SnowContestAdminRender.renderParallelPairs(rerenderTable);
          window.SnowContestAdminRender.renderCross(rerenderTable);
          if (restoreFocus) {
            const qualBody = document.getElementById('qualBody');
            const next = qualBody && qualBody.querySelector(`input[data-athlete="${restoreFocus.athleteId}"][data-field="${restoreFocus.field}"]`);
            if (next) next.focus();
          }
        }, 0);
      }
    });
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminRenderQualification = {
    renderQualification
  };
}
