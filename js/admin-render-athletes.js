/**
 * Админка: таблица участников и редактирование строки.
 */

let editingId = null;

function setEditingId(id) {
  editingId = id;
}

function getEditingId() {
  return editingId;
}

function renderAthletes(showMsg, rerenderTable) {
  const tbody = document.getElementById('athletesBody');
  const { badge } = window.SnowContestUI;
  const { getData, getAthletesSortedByNumber, updateAthleteIdReferences, syncFromData } = window.SnowContestAdminData;
  const { sortRows } = window.SnowContestAdminSort;
  const d = getData();

  const athletes = sortRows(
    getAthletesSortedByNumber(),
    'athletes',
    (row, key) => row[key],
    row => row.id
  );

  tbody.innerHTML = athletes.map(a => {
    if (editingId === a.id) {
      return `
        <tr data-id="${a.id}">
          <td><input type="text" class="inline-id" value="${a.id}"></td>
          <td><input type="text" class="inline-name" value="${a.displayName}"></td>
          <td><input type="text" class="inline-city-club" value="${a.cityClub || ''}"></td>
          <td>
            <select class="inline-class">
              <option value="К1М" ${a.boatClass === 'К1М' ? 'selected' : ''}>К1М — Каяк, мужчины</option>
              <option value="К1Ж" ${a.boatClass === 'К1Ж' ? 'selected' : ''}>К1Ж — Каяк, женщины</option>
              <option value="П1М" ${a.boatClass === 'П1М' ? 'selected' : ''}>П1М — Пакрафт, мужчины</option>
              <option value="П1Ж" ${a.boatClass === 'П1Ж' ? 'selected' : ''}>П1Ж — Пакрафт, женщины</option>
            </select>
          </td>
          <td class="actions-cell">
            <div class="table-actions">
              <button type="button" class="save-athlete" data-id="${a.id}">Сохранить</button>
              <button type="button" class="secondary cancel-inline-edit" data-id="${a.id}">Отмена</button>
            </div>
          </td>
        </tr>
      `;
    }
    return `
      <tr data-id="${a.id}">
        <td>${a.id}</td>
        <td>${a.displayName}</td>
        <td>${a.cityClub || ''}</td>
        <td>${badge(a.boatClass)}</td>
        <td class="actions-cell">
          <div class="table-actions">
            <button type="button" class="secondary edit-athlete" data-id="${a.id}">Изменить</button>
            <button type="button" class="secondary danger remove-athlete" data-id="${a.id}">Удалить</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="5" class="no-data">Нет участников</td></tr>';

  tbody.querySelectorAll('.edit-athlete').forEach(btn => {
    btn.addEventListener('click', () => {
      editingId = btn.dataset.id;
      renderAthletes(showMsg, rerenderTable);
    });
  });
  tbody.querySelectorAll('.cancel-inline-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      editingId = null;
      renderAthletes(showMsg, rerenderTable);
    });
  });
  tbody.querySelectorAll('.save-athlete').forEach(btn => {
    btn.addEventListener('click', () => {
      const oldId = btn.dataset.id;
      const row = btn.closest('tr');
      const newId = row.querySelector('.inline-id').value.trim();
      const newName = row.querySelector('.inline-name').value.trim();
      const newCityClub = row.querySelector('.inline-city-club').value.trim();
      const newClass = row.querySelector('.inline-class').value;

      if (!newId || !newName) {
        showMsg('Укажите номер и имя участника', true);
        return;
      }
      if (newId !== oldId && d.athletes.some(a => a.id === newId)) {
        showMsg('Участник с таким номером уже есть', true);
        return;
      }

      const athlete = d.athletes.find(a => a.id === oldId);
      if (!athlete) return;

      athlete.id = newId;
      athlete.displayName = newName;
      athlete.cityClub = newCityClub || undefined;
      athlete.boatClass = newClass;
      if (newId !== oldId) updateAthleteIdReferences(oldId, newId);
      d.meta.qualificationCalculated = false;
      d.meta.stage1Calculated = false;
      d.meta.finalCalculated = false;
      d.parallelPairs = [];

      editingId = null;
      syncFromData();
      rerenderTable('all');
      const published = window.SnowContestAdminPublish.publishAllData({ showSuccessMessage: false });
      if (published) showMsg('Участник сохранён и опубликован');
    });
  });
  tbody.querySelectorAll('.remove-athlete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (editingId === id) editingId = null;
      d.athletes = d.athletes.filter(a => a.id !== id);
      d.meta.qualificationCalculated = false;
      d.meta.stage1Calculated = false;
      d.meta.finalCalculated = false;
      d.parallelPairs = [];
      syncFromData();
      rerenderTable('all');
    });
  });
}

if (typeof window !== 'undefined') {
  window.SnowContestAdminRenderAthletes = {
    setEditingId,
    getEditingId,
    renderAthletes
  };
}
