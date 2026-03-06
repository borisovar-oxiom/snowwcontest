/**
 * Сортировка таблиц в админке.
 */

const tableSortState = {
  athletes: { key: 'id', direction: 'asc' },
  qualification: { key: 'id', direction: 'asc' },
  cross: { key: 'crossPlace', direction: 'asc' }
};

function compareSortValues(left, right, direction) {
  const leftEmpty = left === null || left === undefined || left === '';
  const rightEmpty = right === null || right === undefined || right === '';
  if (leftEmpty && rightEmpty) return 0;
  if (leftEmpty) return 1;
  if (rightEmpty) return -1;

  if (typeof left === 'number' && typeof right === 'number') {
    return direction === 'desc' ? right - left : left - right;
  }

  const leftAsNumber = Number(String(left).replace(',', '.'));
  const rightAsNumber = Number(String(right).replace(',', '.'));
  const bothNumeric = Number.isFinite(leftAsNumber) && Number.isFinite(rightAsNumber);
  if (bothNumeric) {
    return direction === 'desc' ? rightAsNumber - leftAsNumber : leftAsNumber - rightAsNumber;
  }

  const textCompare = String(left).localeCompare(String(right), 'ru', { numeric: true, sensitivity: 'base' });
  return direction === 'desc' ? -textCompare : textCompare;
}

function sortRows(rows, tableName, getSortValue, getFallbackValue) {
  const state = tableSortState[tableName];
  if (!state) return rows;
  const sorted = [...rows];
  sorted.sort((left, right) => {
    const bySelectedColumn = compareSortValues(
      getSortValue(left, state.key),
      getSortValue(right, state.key),
      state.direction
    );
    if (bySelectedColumn !== 0) return bySelectedColumn;
    return compareSortValues(getFallbackValue(left), getFallbackValue(right), 'asc');
  });
  return sorted;
}

function updateSortIndicators() {
  document.querySelectorAll('th[data-sort-table][data-sort-key]').forEach(th => {
    const tableName = th.dataset.sortTable;
    const sortKey = th.dataset.sortKey;
    const state = tableSortState[tableName];
    if (state && state.key === sortKey) {
      th.dataset.sortDir = state.direction;
    } else {
      delete th.dataset.sortDir;
    }
  });
}

function setupTableSorting(rerenderTable) {
  document.querySelectorAll('th[data-sort-table][data-sort-key]').forEach(th => {
    th.addEventListener('click', () => {
      const tableName = th.dataset.sortTable;
      const sortKey = th.dataset.sortKey;
      const current = tableSortState[tableName];
      if (!current) return;
      if (current.key === sortKey) {
        current.direction = current.direction === 'asc' ? 'desc' : 'asc';
      } else {
        current.key = sortKey;
        current.direction = 'asc';
      }
      rerenderTable(tableName);
    });
  });
  updateSortIndicators();
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminSort = {
    tableSortState,
    compareSortValues,
    sortRows,
    updateSortIndicators,
    setupTableSorting
  };
}
