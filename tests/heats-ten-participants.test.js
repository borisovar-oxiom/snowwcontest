/**
 * Тесты хитов кросса для случая с десятью участниками одного класса.
 * allHeatsFilled не проверяется по запросу.
 */
import { describe, it, expect } from 'vitest';

const Pairs = window.SnowContestAdminPairs;
const Heats = window.SnowContestHeatsShared;

const ids10 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

describe('heats — десять участников одного класса', () => {
  const boatClass = 'К1М';
  const athletes10 = ids10.map((id) => ({
    id,
    displayName: `Участник ${id.toUpperCase()}`,
    boatClass,
  }));

  describe('getHeatConfig', () => {
    it('для n=10 возвращает 4 хита, до 3 человек в хите', () => {
      const cfg = Pairs.getHeatConfig(10);
      expect(cfg).toEqual({ numHeats: 4, perHeat: 3 });
    });
  });

  describe('getHeatSizes', () => {
    it('для n=10, 4 хита распределяет 3, 3, 2 и 2 участников (в каждом хите не меньше 2)', () => {
      const sizes = Pairs.getHeatSizes(10, 4, 3);
      expect(sizes).toEqual([3, 3, 2, 2]);
      expect(sizes.every((s) => s >= 2)).toBe(true);
    });
  });

  describe('buildHeatsFromParticipantIds', () => {
    it('для десяти id создаёт четыре хита: 3+3+2+2 по змейке (в каждом не меньше 2)', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(ids10, boatClass);
      expect(heats).toHaveLength(4);
      expect(heats[0].heatIndex).toBe(1);
      expect(heats[0].athleteIds).toHaveLength(3);
      expect(heats[1].athleteIds).toHaveLength(3);
      expect(heats[2].athleteIds).toHaveLength(2);
      expect(heats[3].heatIndex).toBe(4);
      expect(heats[3].athleteIds).toHaveLength(2);
      heats.forEach((h) => expect(h.athleteIds.length).toBeGreaterThanOrEqual(2));
      // Змейка: позиции 0,9,1,8,2,7,3,6,4,5 → хиты [a,j,b], [i,c,h], [d,g], [e,f]
      expect(heats[0].athleteIds).toEqual(['a', 'j', 'b']);
      expect(heats[1].athleteIds).toEqual(['i', 'c', 'h']);
      expect(heats[2].athleteIds).toEqual(['d', 'g']);
      expect(heats[3].athleteIds).toEqual(['e', 'f']);
      heats.forEach((h) => expect(h.participants.every((p) => p.placeInHeat === null)).toBe(true));
    });
  });

  describe('buildCrossHeats', () => {
    it('для десяти атлетов одного класса формирует round1 из четырёх хитов (3+3+2+2)', () => {
      const d = { athletes: athletes10 };
      const crossHeats = Pairs.buildCrossHeats(d);
      expect(crossHeats[boatClass]).toBeDefined();
      expect(crossHeats[boatClass].round1).toHaveLength(4);
      expect(crossHeats[boatClass].round1[0].athleteIds).toHaveLength(3);
      expect(crossHeats[boatClass].round1[1].athleteIds).toHaveLength(3);
      expect(crossHeats[boatClass].round1[2].athleteIds).toHaveLength(2);
      expect(crossHeats[boatClass].round1[3].athleteIds).toHaveLength(2);
      crossHeats[boatClass].round1.forEach((h) => expect(h.athleteIds.length).toBeGreaterThanOrEqual(2));
      const allIds = crossHeats[boatClass].round1.flatMap((h) => h.athleteIds);
      expect(allIds.sort()).toEqual([...ids10].sort());
    });
  });

  describe('getUpperFromRound / getLowerFromRound', () => {
    it('из четырёх хитов getUpperFromRound возвращает места 1 и 2 из хита 3+ (или только 1 из хита с двумя), getLowerFromRound — места 3+ или 2 из двухместного', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'j', placeInHeat: 2 },
            { athleteId: 'b', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 2,
          participants: [
            { athleteId: 'i', placeInHeat: 1 },
            { athleteId: 'c', placeInHeat: 2 },
            { athleteId: 'h', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 3,
          participants: [
            { athleteId: 'd', placeInHeat: 1 },
            { athleteId: 'g', placeInHeat: 2 },
          ],
        },
        {
          heatIndex: 4,
          participants: [
            { athleteId: 'e', placeInHeat: 1 },
            { athleteId: 'f', placeInHeat: 2 },
          ],
        },
      ];
      expect(Pairs.getUpperFromRound(heats)).toEqual(['a', 'j', 'i', 'c', 'd', 'e']);
      expect(Pairs.getLowerFromRound(heats)).toEqual(['b', 'h', 'g', 'f']);
    });
  });

  describe('isRoundComplete', () => {
    it('возвращает true для четырёх хитов с заполненными уникальными местами', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'j', placeInHeat: 2 },
            { athleteId: 'b', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 2,
          participants: [
            { athleteId: 'i', placeInHeat: 1 },
            { athleteId: 'c', placeInHeat: 2 },
            { athleteId: 'h', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 3,
          participants: [
            { athleteId: 'd', placeInHeat: 1 },
            { athleteId: 'g', placeInHeat: 2 },
          ],
        },
        {
          heatIndex: 4,
          participants: [
            { athleteId: 'e', placeInHeat: 1 },
            { athleteId: 'f', placeInHeat: 2 },
          ],
        },
      ];
      expect(Pairs.isRoundComplete(heats)).toBe(true);
    });
  });

  describe('computeCrossPlacesFromHeats', () => {
    it('для одного класса с четырьмя хитами round1: места 3 из хитов (нижняя сетка) идут первыми, затем не назначенные', () => {
      const crossHeats = {
        [boatClass]: {
          round1: [
            {
              heatIndex: 1,
              participants: [
                { athleteId: 'a', placeInHeat: 1 },
                { athleteId: 'j', placeInHeat: 2 },
                { athleteId: 'b', placeInHeat: 3 },
              ],
            },
            {
              heatIndex: 2,
              participants: [
                { athleteId: 'i', placeInHeat: 1 },
                { athleteId: 'c', placeInHeat: 2 },
                { athleteId: 'h', placeInHeat: 3 },
              ],
            },
            {
              heatIndex: 3,
              participants: [
                { athleteId: 'd', placeInHeat: 1 },
                { athleteId: 'g', placeInHeat: 2 },
              ],
            },
            {
              heatIndex: 4,
              participants: [
                { athleteId: 'e', placeInHeat: 1 },
                { athleteId: 'f', placeInHeat: 2 },
              ],
            },
          ],
        },
      };
      const places = Pairs.computeCrossPlacesFromHeats(crossHeats);
      expect(places).toHaveLength(10);
      // В round1 только в хитах с 3+ участниками есть место 3 (нижняя сетка); в двухместных хитах — только 1 и 2
      const lowerFromRound1 = ['b', 'h'];
      lowerFromRound1.forEach((id, idx) => {
        expect(places.find((p) => p.athleteId === id).place).toBe(idx + 1);
      });
      const rest = places.filter((p) => !lowerFromRound1.includes(p.athleteId)).sort((x, y) => x.place - y.place);
      expect(rest.map((p) => p.place)).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
      expect(new Set(rest.map((p) => p.athleteId))).toEqual(new Set(['a', 'j', 'i', 'c', 'd', 'g', 'e', 'f']));
      places.forEach((p) => expect(p.boatClass).toBe(boatClass));
    });
  });

  describe('Итоговая таблица кросса (10 участников)', () => {
    const crossHeatsWithPlaces = {
      [boatClass]: {
        round1: [
          {
            heatIndex: 1,
            participants: [
              { athleteId: 'a', placeInHeat: 1 },
              { athleteId: 'j', placeInHeat: 2 },
              { athleteId: 'b', placeInHeat: 3 },
            ],
          },
          {
            heatIndex: 2,
            participants: [
              { athleteId: 'i', placeInHeat: 1 },
              { athleteId: 'c', placeInHeat: 2 },
              { athleteId: 'h', placeInHeat: 3 },
            ],
          },
          {
            heatIndex: 3,
            participants: [
              { athleteId: 'd', placeInHeat: 1 },
              { athleteId: 'g', placeInHeat: 2 },
            ],
          },
          {
            heatIndex: 4,
            participants: [
              { athleteId: 'e', placeInHeat: 1 },
              { athleteId: 'f', placeInHeat: 2 },
            ],
          },
        ],
      },
    };

    it('computeCrossPlacesFromHeats возвращает все 10 записей с полями athleteId, place, boatClass', () => {
      const places = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      expect(places).toHaveLength(10);
      const ids = new Set(places.map((p) => p.athleteId));
      expect(ids).toEqual(new Set(ids10));
      const placesNum = places.map((p) => p.place).sort((a, b) => a - b);
      expect(placesNum).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      places.forEach((p) => {
        expect(p).toHaveProperty('athleteId');
        expect(p).toHaveProperty('place');
        expect(p).toHaveProperty('boatClass', boatClass);
      });
    });

    it('buildClassPlacesData по crossPlaces и атлетам возвращает 10 строк, отсортированных по месту в кроссе', () => {
      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      const withPlace = Heats.buildClassPlacesData(athletes10, crossPlaces, boatClass);
      expect(withPlace).toHaveLength(10);
      const orderByPlace = withPlace.map((x) => ({ id: x.athlete.id, place: x.place }));
      expect(orderByPlace.map((x) => x.place)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('buildClassPlacesRowsHtml формирует 10 строк с баллами R2 от 10 до 1', () => {
      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      const withPlace = Heats.buildClassPlacesData(athletes10, crossPlaces, boatClass);
      const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const html = Heats.buildClassPlacesRowsHtml(withPlace, escapeHtml);
      expect(html).toContain('<tr>');
      const rowCount = (html.match(/<tr>/g) || []).length;
      expect(rowCount).toBe(10);
      expect(html).toContain('<strong>10</strong>');
      expect(html).toContain('<strong>1</strong>');
    });

    it('buildClassPlacesSection при filled=true содержит заголовок и таблицу итоговых мест', () => {
      const html = Heats.buildClassPlacesSection('', true, '');
      expect(html).toContain('Итоговые места в кроссе');
      expect(html).toContain('cross-class-places-table');
      expect(html).toContain('Баллы R2');
    });

    it('полная цепочка: crossHeats → crossPlaces → buildClassPlacesData даёт 10 мест и R2 от 10 до 1', () => {
      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeatsWithPlaces);
      const withPlace = Heats.buildClassPlacesData(athletes10, crossPlaces, boatClass);
      expect(withPlace).toHaveLength(10);
      const r2Values = withPlace.map((_, i) => 10 - i);
      expect(r2Values).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    });
  });

  describe('Полный проход сетки (round1 → round2Upper, round2Lower → итог)', () => {
    it('после заполнения round1 формируются round2Upper и round2Lower, заполняются — итоговые места по двойному выбыванию (10 участников)', () => {
      const round1 = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'b', placeInHeat: 2 },
            { athleteId: 'j', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 2,
          participants: [
            { athleteId: 'c', placeInHeat: 1 },
            { athleteId: 'h', placeInHeat: 2 },
            { athleteId: 'i', placeInHeat: 3 },
          ],
        },
        {
          heatIndex: 3,
          participants: [
            { athleteId: 'd', placeInHeat: 1 },
            { athleteId: 'g', placeInHeat: 2 },
          ],
        },
        {
          heatIndex: 4,
          participants: [
            { athleteId: 'e', placeInHeat: 1 },
            { athleteId: 'f', placeInHeat: 2 },
          ],
        },
      ];
      const upperIds = Pairs.getUpperFromRound(round1);
      const lowerIds = Pairs.getLowerFromRound(round1);
      expect(upperIds).toEqual(['a', 'b', 'c', 'h', 'd', 'e']);
      expect(lowerIds).toEqual(['j', 'i', 'g', 'f']);

      const round2Upper = Pairs.buildHeatsFromParticipantIds(upperIds, boatClass);
      const round2Lower = Pairs.buildHeatsFromParticipantIds(lowerIds, boatClass);
      expect(round2Upper.length).toBeGreaterThanOrEqual(1);
      expect(round2Lower).toHaveLength(1);

      round2Upper[0].participants = [
        { athleteId: 'a', placeInHeat: 1 },
        { athleteId: 'b', placeInHeat: 2 },
        { athleteId: 'e', placeInHeat: 3 },
      ];
      round2Upper[1].participants = [
        { athleteId: 'c', placeInHeat: 1 },
        { athleteId: 'd', placeInHeat: 2 },
        { athleteId: 'h', placeInHeat: 3 },
      ];
      round2Lower[0].participants = [
        { athleteId: 'f', placeInHeat: 1 },
        { athleteId: 'g', placeInHeat: 2 },
        { athleteId: 'i', placeInHeat: 3 },
        { athleteId: 'j', placeInHeat: 4 },
      ];

      const round3UpperIds = Pairs.getUpperFromRound(round2Upper);
      const round3LowerIds = Pairs.getLowerFromRound(round2Upper).concat(Pairs.getUpperFromRound(round2Lower));
      expect(round3UpperIds).toEqual(['a', 'b', 'c', 'd']);
      expect(round3LowerIds).toEqual(['e', 'h', 'f', 'g']);

      const round3Upper = Pairs.buildHeatsFromParticipantIds(round3UpperIds, boatClass);
      const round3Lower = Pairs.buildHeatsFromParticipantIds(round3LowerIds, boatClass);
      expect(round3Upper).toHaveLength(1);
      expect(round3Lower).toHaveLength(1);

      round3Upper[0].participants = [
        { athleteId: 'a', placeInHeat: 1 },
        { athleteId: 'b', placeInHeat: 2 },
        { athleteId: 'c', placeInHeat: 3 },
        { athleteId: 'd', placeInHeat: 4 },
      ];
      round3Lower[0].participants = [
        { athleteId: 'e', placeInHeat: 1 },
        { athleteId: 'f', placeInHeat: 2 },
        { athleteId: 'g', placeInHeat: 3 },
        { athleteId: 'h', placeInHeat: 4 },
      ];

      const fullCrossHeats = {
        [boatClass]: {
          round1,
          round2Upper,
          round2Lower,
          round3Upper,
          round3Lower,
        },
      };

      const places = Pairs.computeCrossPlacesFromHeats(fullCrossHeats);
      expect(places).toHaveLength(10);
      const resultIds = new Set(places.map((p) => p.athleteId));
      expect(resultIds).toEqual(new Set(ids10));
      const placesNum = places.map((p) => p.place).sort((a, b) => a - b);
      expect(placesNum).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      expect(places.find((p) => p.athleteId === 'a').place).toBe(1);
      expect(places.find((p) => p.athleteId === 'b').place).toBe(2);
      expect(places.find((p) => p.athleteId === 'c').place).toBe(3);
      expect(places.find((p) => p.athleteId === 'd').place).toBe(4);
      expect(places.find((p) => p.athleteId === 'e').place).toBe(5);
      expect(places.find((p) => p.athleteId === 'f').place).toBe(6);
      expect(places.find((p) => p.athleteId === 'g').place).toBe(7);
      expect(places.find((p) => p.athleteId === 'h').place).toBe(8);
      expect(places.find((p) => p.athleteId === 'i').place).toBe(9);
      expect(places.find((p) => p.athleteId === 'j').place).toBe(10);
    });
  });
});
