/**
 * Тесты хитов кросса для случая с двумя участниками одного класса.
 */
import { describe, it, expect } from 'vitest';

const Pairs = window.SnowContestAdminPairs;
const Heats = window.SnowContestHeatsShared;

describe('heats — два участника одного класса', () => {
  const boatClass = 'К1М';
  const athleteA = { id: 'a', displayName: 'Участник A', boatClass };
  const athleteB = { id: 'b', displayName: 'Участник B', boatClass };

  describe('getHeatConfig', () => {
    it('для n=2 возвращает один хит, до 4 человек в хите', () => {
      const cfg = Pairs.getHeatConfig(2);
      expect(cfg).toEqual({ numHeats: 1, perHeat: 4 });
    });
  });

  describe('getHeatSizes', () => {
    it('для n=2, 1 хит распределяет обоих в один хит', () => {
      const sizes = Pairs.getHeatSizes(2, 1, 4);
      expect(sizes).toEqual([2]);
    });
  });

  describe('buildHeatsFromParticipantIds', () => {
    it('для двух id создаёт один хит с обоими участниками', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['a', 'b'], boatClass);
      expect(heats).toHaveLength(1);
      expect(heats[0].heatIndex).toBe(1);
      expect(heats[0].boatClass).toBe(boatClass);
      expect(heats[0].athleteIds).toEqual(['a', 'b']);
      expect(heats[0].participants).toHaveLength(2);
      expect(heats[0].participants.map(p => p.athleteId)).toEqual(['a', 'b']);
      expect(heats[0].participants.every(p => p.placeInHeat === null)).toBe(true);
    });
  });

  describe('buildCrossHeats', () => {
    it('для двух атлетов одного класса формирует один хит round1 с обоими', () => {
      const d = {
        athletes: [athleteA, athleteB],
      };
      const crossHeats = Pairs.buildCrossHeats(d);
      expect(crossHeats[boatClass]).toBeDefined();
      expect(crossHeats[boatClass].round1).toHaveLength(1);
      const heat = crossHeats[boatClass].round1[0];
      expect(heat.heatIndex).toBe(1);
      expect(heat.athleteIds).toHaveLength(2);
      expect(heat.athleteIds).toContain('a');
      expect(heat.athleteIds).toContain('b');
      expect(heat.participants).toHaveLength(2);
      expect(heat.participants.every(p => p.placeInHeat === null)).toBe(true);
    });
  });

  describe('getHeatParticipants (heats-shared)', () => {
    it('возвращает участников из heat.participants или по athleteIds', () => {
      const heatWithParticipants = {
        heatIndex: 1,
        participants: [
          { athleteId: 'a', placeInHeat: 1 },
          { athleteId: 'b', placeInHeat: 2 },
        ],
      };
      const participants = Heats.getHeatParticipants(heatWithParticipants);
      expect(participants).toHaveLength(2);
      expect(participants[0].athleteId).toBe('a');
      expect(participants[0].placeInHeat).toBe(1);

      const heatWithIds = { heatIndex: 1, athleteIds: ['a', 'b'] };
      const fromIds = Heats.getHeatParticipants(heatWithIds);
      expect(fromIds).toHaveLength(2);
      expect(fromIds.map(p => p.athleteId)).toEqual(['a', 'b']);
      expect(fromIds.every(p => p.placeInHeat === null)).toBe(true);
    });
  });

  describe('allHeatsFilled', () => {
    it('возвращает false, пока места в хите не заполнены', () => {
      const classHeats = {
        round1: [
          {
            heatIndex: 1,
            participants: [
              { athleteId: 'a', placeInHeat: null },
              { athleteId: 'b', placeInHeat: null },
            ],
          },
        ],
      };
      expect(Heats.allHeatsFilled(classHeats)).toBe(false);
    });
    it('возвращает true, когда в единственном хите проставлены места 1 и 2', () => {
      const classHeats = {
        round1: [
          {
            heatIndex: 1,
            participants: [
              { athleteId: 'a', placeInHeat: 1 },
              { athleteId: 'b', placeInHeat: 2 },
            ],
          },
        ],
      };
      expect(Heats.allHeatsFilled(classHeats)).toBe(true);
    });
  });

  describe('getUpperFromRound / getLowerFromRound', () => {
    it('из одного хита с местами 1 и 2 getUpperFromRound возвращает обоих по порядку', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'b', placeInHeat: 2 },
          ],
        },
      ];
      expect(Pairs.getUpperFromRound(heats)).toEqual(['a', 'b']);
    });
    it('из одного хита с местами 1 и 2 getLowerFromRound возвращает пустой массив', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'b', placeInHeat: 2 },
          ],
        },
      ];
      expect(Pairs.getLowerFromRound(heats)).toEqual([]);
    });
  });

  describe('isRoundComplete', () => {
    it('возвращает false, если места не проставлены', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: null },
            { athleteId: 'b', placeInHeat: 2 },
          ],
        },
      ];
      expect(Pairs.isRoundComplete(heats)).toBe(false);
    });
    it('возвращает true для одного хита с местами 1 и 2', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'b', placeInHeat: 2 },
          ],
        },
      ];
      expect(Pairs.isRoundComplete(heats)).toBe(true);
    });
    it('возвращает false при дубликате мест', () => {
      const heats = [
        {
          heatIndex: 1,
          participants: [
            { athleteId: 'a', placeInHeat: 1 },
            { athleteId: 'b', placeInHeat: 1 },
          ],
        },
      ];
      expect(Pairs.isRoundComplete(heats)).toBe(false);
    });
  });

  describe('computeCrossPlacesFromHeats', () => {
    it('для одного класса с одним хитом и местами 1, 2 возвращает места по порядку', () => {
      const crossHeats = {
        [boatClass]: {
          round1: [
            {
              heatIndex: 1,
              participants: [
                { athleteId: 'a', placeInHeat: 1 },
                { athleteId: 'b', placeInHeat: 2 },
              ],
            },
          ],
        },
      };
      const places = Pairs.computeCrossPlacesFromHeats(crossHeats);
      expect(places).toHaveLength(2);
      const placeA = places.find(p => p.athleteId === 'a');
      const placeB = places.find(p => p.athleteId === 'b');
      expect(placeA).toBeDefined();
      expect(placeB).toBeDefined();
      expect(placeA.place).toBe(1);
      expect(placeB.place).toBe(2);
      expect(placeA.boatClass).toBe(boatClass);
      expect(placeB.boatClass).toBe(boatClass);
    });
  });

  describe('computeCrossPlacesFromHeats — итог по месту в хите', () => {
    it('назначает итоговые места строго по месту в хите (a — 2-е, b — 1-е в хите → места 2 и 1)', () => {
      const crossHeats = {
        [boatClass]: {
          round1: [
            {
              heatIndex: 1,
              participants: [
                { athleteId: 'a', placeInHeat: 2 },
                { athleteId: 'b', placeInHeat: 1 },
              ],
            },
          ],
        },
      };
      const places = Pairs.computeCrossPlacesFromHeats(crossHeats);
      expect(places).toHaveLength(2);
      const placeA = places.find(p => p.athleteId === 'a');
      const placeB = places.find(p => p.athleteId === 'b');
      expect(placeA).toBeDefined();
      expect(placeB).toBeDefined();
      expect(placeA.place).toBe(2);
      expect(placeB.place).toBe(1);
      expect(placeA.boatClass).toBe(boatClass);
      expect(placeB.boatClass).toBe(boatClass);
    });
  });

  describe('sortParticipantsByPlace', () => {
    it('сортирует участников по месту в хите', () => {
      const participants = [
        { athleteId: 'b', placeInHeat: 2 },
        { athleteId: 'a', placeInHeat: 1 },
      ];
      const sorted = Heats.sortParticipantsByPlace(participants);
      expect(sorted.map(p => p.athleteId)).toEqual(['a', 'b']);
      expect(sorted.map(p => p.placeInHeat)).toEqual([1, 2]);
    });
  });

  describe('sortParticipantsByPlace — при любом порядке на входе', () => {
    it('сортирует по месту в хите при обратном порядке участников (a:2, b:1 → b, a)', () => {
      const participants = [
        { athleteId: 'a', placeInHeat: 2 },
        { athleteId: 'b', placeInHeat: 1 },
      ];
      const sorted = Heats.sortParticipantsByPlace(participants);
      expect(sorted.map(p => p.athleteId)).toEqual(['b', 'a']);
      expect(sorted.map(p => p.placeInHeat)).toEqual([1, 2]);
    });
  });
});
