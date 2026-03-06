/**
 * Тесты хитов кросса для случая с пятью участниками одного класса.
 */
import {describe, expect, it} from 'vitest';

const Pairs = window.SnowContestAdminPairs;
const Heats = window.SnowContestHeatsShared;

describe('heats — пять участников одного класса', () => {
  const boatClass = 'К1М';
  const athletes5 = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
    id,
    displayName: `Участник ${id.toUpperCase()}`,
    boatClass,
  }));

  describe('buildHeatsFromParticipantIds', () => {
    it('для пяти id создаёт два хита: первый 3 участника, второй 2 (змейка)', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['a', 'b', 'c', 'd', 'e'], boatClass);
      expect(heats).toHaveLength(2);
      expect(heats[0].heatIndex).toBe(1);
      expect(heats[0].athleteIds).toHaveLength(3);
      expect(heats[1].heatIndex).toBe(2);
      expect(heats[1].athleteIds).toHaveLength(2);
      // Змейка по хитам: a → хит1, b → хит2, c → хит2, d → хит1, e → хит1 (ёмкости 3+2)
      expect(heats[0].athleteIds).toEqual(['a', 'd', 'e']);
      expect(heats[1].athleteIds).toEqual(['b', 'c']);
      expect(heats[0].participants.every(p => p.placeInHeat === null)).toBe(true);
      expect(heats[1].participants.every(p => p.placeInHeat === null)).toBe(true);
    });
  });

  describe('buildCrossHeats', () => {
    it('для пяти атлетов одного класса формирует round1 из двух хитов (3+2)', () => {
      const d = { athletes: athletes5 };
      const crossHeats = Pairs.buildCrossHeats(d);
      expect(crossHeats[boatClass]).toBeDefined();
      expect(crossHeats[boatClass].round1).toHaveLength(2);
      expect(crossHeats[boatClass].round1[0].athleteIds).toHaveLength(3);
      expect(crossHeats[boatClass].round1[1].athleteIds).toHaveLength(2);
      const allIds = crossHeats[boatClass].round1.flatMap(h => h.athleteIds);
      expect(allIds.sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });
  });

  describe('getFromRound', () => {
    it('из двух хитов getFromRound.upperIds возвращает места 1 и 2 или только 1 если в хите два участника из каждого (порядок: хит1-1, хит1-2, хит2-1, хит2-2). getFromRound.lowerIds возвращает последнее место или 3 и 4 если в хите 4 участника', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'e', placeInHeat: 2 },
            { athleteId: 'b', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 2,
          participants: [
            { athleteId: 'd', placeInHeat: 1 },
            { athleteId: 'c', placeInHeat: 2 },
          ],
        },
      ];
      const { upperIds, lowerIds } = Pairs.getFromRound(heats);
      expect(upperIds).toEqual(['a', 'd', 'e']);
      expect(lowerIds).toEqual(['c', 'b']);
    });
  });

  describe('allHeatsFilled', () => {
    it('возвращает false, если хотя бы в одном хите не заполнены места', () => {
      const classHeats = {
        round1: [
          {
            heatIndex: 1,
            participants: [
              { athleteId: 'a', placeInHeat: 1 },
              { athleteId: 'e', placeInHeat: 2 },
              { athleteId: 'b', placeInHeat: 3 },
            ],
          },
          {
            heatIndex: 2,
            participants: [
              { athleteId: 'd', placeInHeat: 1 },
              { athleteId: 'c', placeInHeat: null },
            ],
          },
        ],
      };
      expect(Heats.allHeatsFilled(classHeats)).toBe(false);
    });
    it('возвращает true, когда во всех хитах проставлены уникальные места', () => {
      const classHeats = {
        round1: [
          {
            heatIndex: 1,
            participants: [
              { athleteId: 'a', placeInHeat: 1 },
              { athleteId: 'e', placeInHeat: 2 },
              { athleteId: 'b', placeInHeat: 3 },
            ],
          },
          {
            heatIndex: 2,
            participants: [
              { athleteId: 'd', placeInHeat: 1 },
              { athleteId: 'c', placeInHeat: 2 },
            ],
          },
        ],
      };
      expect(Heats.allHeatsFilled(classHeats)).toBe(true);
    });
  });

  describe('isRoundComplete', () => {
    it('возвращает true для двух хитов с заполненными уникальными местами', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'e', placeInHeat: 2 },
            { athleteId: 'b', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 2,
          participants: [
            { athleteId: 'd', placeInHeat: 1 },
            { athleteId: 'c', placeInHeat: 2 },
          ],
        },
      ];
      expect(Pairs.isRoundComplete(heats)).toBe(true);
    });
  });

  describe('computeCrossPlacesFromHeats', () => {
    it('для одного класса с двумя хитами round1: место 3 из хитов (нижняя сетка) идут первыми, остальные по порядку обхода', () => {
      const crossHeats = {
        [boatClass]: {
          round1: [
            {
              heatIndex: 1,
              participants: [
                { athleteId: 'a', placeInHeat: 1 },
                { athleteId: 'e', placeInHeat: 2 },
                { athleteId: 'b', placeInHeat: 3 },
              ],
            },
            {
              heatIndex: 2,
              participants: [
                { athleteId: 'd', placeInHeat: 1 },
                { athleteId: 'c', placeInHeat: 2 },
              ],
            },
          ],
        },
      };
      const places = Pairs.computeCrossPlacesFromHeats(crossHeats);
      expect(places).toHaveLength(5);
      // Сейчас при только round1: сначала назначаются те, у кого место >= 3 (нижняя сетка), затем не назначенные
      expect(places.find(p => p.athleteId === 'b').place).toBe(1);
      const rest = places.filter(p => p.athleteId !== 'b').sort((x, y) => x.place - y.place);
      expect(rest.map(p => p.athleteId)).toEqual(['a', 'e', 'd', 'c']);
      expect(rest.map(p => p.place)).toEqual([2, 3, 4, 5]);
      places.forEach(p => expect(p.boatClass).toBe(boatClass));
    });
  });

  describe('Итоговая таблица кросса (5 участников)', () => {
    const crossHeatsWithPlaces = {
      [boatClass]: {
        round1: [
          {
            heatIndex: 1,
            participants: [
              { athleteId: 'a', placeInHeat: 1 },
              { athleteId: 'e', placeInHeat: 2 },
              { athleteId: 'b', placeInHeat: 3 },
            ],
          },
          {
            heatIndex: 2,
            participants: [
              { athleteId: 'd', placeInHeat: 1 },
              { athleteId: 'c', placeInHeat: 2 },
            ],
          },
        ],
      },
    };

    it('computeCrossPlacesFromHeats возвращает все 5 записей с полями athleteId, place, boatClass', () => {
      const places = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      expect(places).toHaveLength(5);
      const ids = new Set(places.map(p => p.athleteId));
      expect(ids).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
      const placesNum = places.map(p => p.place).sort((a, b) => a - b);
      expect(placesNum).toEqual([1, 2, 3, 4, 5]);
      places.forEach(p => {
        expect(p).toHaveProperty('athleteId');
        expect(p).toHaveProperty('place');
        expect(p).toHaveProperty('boatClass', boatClass);
      });
    });

    it('buildClassPlacesData по crossPlaces и атлетам возвращает строки, отсортированные по месту в кроссе', () => {
      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      const withPlace = Heats.buildClassPlacesData(athletes5, crossPlaces, boatClass);
      expect(withPlace).toHaveLength(5);
      const orderByPlace = withPlace.map(x => ({ id: x.athlete.id, place: x.place }));
      expect(orderByPlace.map(x => x.place)).toEqual([1, 2, 3, 4, 5]);
      expect(orderByPlace.map(x => x.id)).toEqual(['b', 'a', 'e', 'd', 'c']);
    });

    it('buildClassPlacesRowsHtml формирует 5 строк с баллами R2 от 5 до 1', () => {
      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      const withPlace = Heats.buildClassPlacesData(athletes5, crossPlaces, boatClass);
      const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const html = Heats.buildClassPlacesRowsHtml(withPlace, escapeHtml);
      expect(html).toContain('<tr>');
      const rowCount = (html.match(/<tr>/g) || []).length;
      expect(rowCount).toBe(5);
      expect(html).toContain('<strong>5</strong>');
      expect(html).toContain('<strong>4</strong>');
      expect(html).toContain('<strong>3</strong>');
      expect(html).toContain('<strong>2</strong>');
      expect(html).toContain('<strong>1</strong>');
    });

    it('buildClassPlacesSection при filled=true содержит заголовок и таблицу итоговых мест', () => {
      const html = Heats.buildClassPlacesSection('', true, '');
      expect(html).toContain('Итоговые места в кроссе');
      expect(html).toContain('cross-class-places-table');
      expect(html).toContain('Номер');
      expect(html).toContain('Участник');
      expect(html).toContain('Место');
      expect(html).toContain('Баллы R2');
    });

    it('полная цепочка: crossHeats → crossPlaces → buildClassPlacesData даёт итоговый порядок по классу', () => {
      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      const withPlace = Heats.buildClassPlacesData(athletes5, crossPlaces, boatClass);
      const finalOrder = withPlace.map((x, i) => ({ place: x.place, id: x.athlete.id, r2: 5 - i }));
      expect(finalOrder).toEqual([
        { place: 1, id: 'b', r2: 5 },
        { place: 2, id: 'a', r2: 4 },
        { place: 3, id: 'e', r2: 3 },
        { place: 4, id: 'd', r2: 2 },
        { place: 5, id: 'c', r2: 1 },
      ]);
    });
  });

  describe('Полный проход сетки (round1 → round2Upper, round2Lower → итог)', () => {
    it('после заполнения round1 формируются round2Upper и round2Lower, заполняются — итоговые места по двойному выбыванию', () => {
      const round1 = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'e', placeInHeat: 2 },
            { athleteId: 'b', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 2,
          participants: [
            { athleteId: 'd', placeInHeat: 1 },
            { athleteId: 'c', placeInHeat: 2 },
          ],
        },
      ];
      const { upperIds, lowerIds } = Pairs.getFromRound(round1);
      expect(upperIds).toEqual(['a', 'd', 'e']);
      expect(lowerIds).toEqual(['c', 'b']);

      const round2Upper = Pairs.buildHeatsFromParticipantIds(upperIds, boatClass);
      const round2Lower = Pairs.buildHeatsFromParticipantIds(lowerIds, boatClass);
      expect(round2Upper).toHaveLength(1);
      expect(round2Lower).toHaveLength(1);

      round2Upper[0].participants = [
        { athleteId: 'a', placeInHeat: 1 },
        { athleteId: 'e', placeInHeat: 2 },
        { athleteId: 'd', placeInHeat: 3 },
      ];
      round2Lower[0].participants = [
        { athleteId: 'b', placeInHeat: 1 },
        { athleteId: 'c', placeInHeat: 2 },
      ];

      const fullCrossHeats = {
        [boatClass]: {
          round1,
          round2Upper,
          round2Lower,
        },
      };

      const places = Pairs.computeCrossPlacesFromHeats(fullCrossHeats);
      expect(places).toHaveLength(5);
      expect(places.find(p => p.athleteId === 'a').place).toBe(1);
      expect(places.find(p => p.athleteId === 'e').place).toBe(2);
      expect(places.find(p => p.athleteId === 'd').place).toBe(3);
      expect(places.find(p => p.athleteId === 'b').place).toBe(4);
      expect(places.find(p => p.athleteId === 'c').place).toBe(5);
    });
  });

  describe('Полный сценарий: 5 атлетов (id 1–5), три тура и итоговая таблица', () => {
    it('строит хиты из id 1–5, проходит два следующих тура и считает итоговую таблицу мест', () => {
      const boatClass = 'К1М';
      const athleteIds = ['1', '2', '3', '4', '5'];

      // round1: создаём хиты из списка id
      const round1 = Pairs.buildHeatsFromParticipantIds(athleteIds, boatClass);

      // Явно задаём места в первом туре для каждого хита
      let athlete1 = round1[0].athleteIds[0];
      let athlete4 = round1[0].athleteIds[1];
      let athlete5 = round1[0].athleteIds[2];
      expect(athlete1).toEqual('1');
      expect(athlete4).toEqual('4');
      expect(athlete5).toEqual('5');
      round1[0].participants = [
        { athleteId: athlete1, placeInHeat: 1 },
        { athleteId: athlete4, placeInHeat: 2 },
        { athleteId: athlete5, placeInHeat: 3 },
      ];

      let athlete2 = round1[1].athleteIds[0];
      let athlete3 = round1[1].athleteIds[1];
      expect(athlete2).toEqual('2');
      expect(athlete3).toEqual('3');
      round1[1].participants = [
        { athleteId: athlete2, placeInHeat: 1 },
        { athleteId: athlete3, placeInHeat: 2 },
      ];

      // round2: верхняя и нижняя сетка из результатов round1
      const { upperIds, lowerIds } = Pairs.getFromRound(round1);

      const round2Upper = Pairs.buildHeatsFromParticipantIds(upperIds, boatClass);
      const round2Lower = Pairs.buildHeatsFromParticipantIds(lowerIds, boatClass);

      expect(round2Upper).toHaveLength(1);
      expect(round2Lower).toHaveLength(1);

      const round2UpperHeat = round2Upper[0];
      const round2LowerHeat = round2Lower[0];

      round2UpperHeat.participants = [
        { athleteId: round2UpperHeat.athleteIds[0], placeInHeat: 1 },
        { athleteId: round2UpperHeat.athleteIds[1], placeInHeat: 2 },
        { athleteId: round2UpperHeat.athleteIds[2], placeInHeat: 3 },
      ];

      round2LowerHeat.participants = [
        { athleteId: round2LowerHeat.athleteIds[0], placeInHeat: 1 },
        { athleteId: round2LowerHeat.athleteIds[1], placeInHeat: 2 },
      ];

      const crossHeats = {
        [boatClass]: {
          round1,
          round2Upper,
          round2Lower,
        },
      };

      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeats);
      expect(crossPlaces).toHaveLength(5);

      // Проверяем, что у всех пять атлетов есть место 1–5
      const idsFromPlaces = [];
      const placesFromPlaces = [];
      for (let i = 0; i < crossPlaces.length; i += 1) {
        idsFromPlaces.push(crossPlaces[i].athleteId);
        placesFromPlaces.push(crossPlaces[i].place);
      }
      idsFromPlaces.sort();
      expect(idsFromPlaces).toEqual(athleteIds);
      placesFromPlaces.sort((a, b) => a - b);
      expect(placesFromPlaces).toEqual([1, 2, 3, 4, 5]);

      const athletes = [
        { id: '1', displayName: 'Атлет 1', boatClass },
        { id: '2', displayName: 'Атлет 2', boatClass },
        { id: '3', displayName: 'Атлет 3', boatClass },
        { id: '4', displayName: 'Атлет 4', boatClass },
        { id: '5', displayName: 'Атлет 5', boatClass },
      ];

      const table = Heats.buildClassPlacesData(athletes, crossPlaces, boatClass);
      expect(table).toHaveLength(5);

      const placesFromTable = [];
      for (let i = 0; i < table.length; i += 1) {
        placesFromTable.push(table[i].place);
      }
      placesFromTable.sort((a, b) => a - b);
      expect(placesFromTable).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('в каждом хите не меньше 2 участников', () => {
    it('buildHeatsFromParticipantIds и buildCrossHeats ни при каком n не дают хит с одним участником', () => {
      const boatClass = 'К1М';
      for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16]) {
        const ids = Array.from({ length: n }, (_, i) => `id${i}`);

        const heats = Pairs.buildHeatsFromParticipantIds(ids, boatClass);
        heats.forEach((h, idx) => {
          expect(
            h.athleteIds.length >= 2,
            `n=${n} buildHeatsFromParticipantIds heat ${idx + 1}: ${h.athleteIds.length}`,
          ).toBe(true);
        });

        const athletes = ids.map((id) => ({ id, displayName: id, boatClass }));
        const crossHeats = Pairs.buildCrossHeats({ athletes });
        const round1 = crossHeats[boatClass]?.round1 || [];
        round1.forEach((h, idx) => {
          expect(
            h.athleteIds.length >= 2,
            `n=${n} buildCrossHeats round1 heat ${idx + 1}: ${h.athleteIds.length}`,
          ).toBe(true);
        });
      }
    });
  });
});