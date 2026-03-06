/**
 * Тесты сортировки пар параллельных спусков по рейтингу первого участника (пара с организатором в середине).
 */
import { describe, it, expect, beforeEach } from 'vitest';

const { getParallelPairsOrderByFirstAthleteRating } = window.SnowContestAdminPairs;
const { setData, getData } = window.SnowContestAdminData;

describe('admin-pairs sort', () => {
  beforeEach(() => {
    setData({
      athletes: [
        { id: '1', displayName: 'Первый', boatClass: 'К1М' },
        { id: '2', displayName: 'Второй', boatClass: 'К1М' },
        { id: '3', displayName: 'Третий', boatClass: 'К1М' },
        { id: '4', displayName: 'Четвёртый', boatClass: 'К1М' },
        { id: '5', displayName: 'Пятый', boatClass: 'К1М' },
      ],
      qualificationAttempts: [
        { athleteId: '1', redTrackSeconds: 40, greenTrackSeconds: 20 },
        { athleteId: '2', redTrackSeconds: 41, greenTrackSeconds: 20 },
        { athleteId: '3', redTrackSeconds: 42, greenTrackSeconds: 20 },
        { athleteId: '4', redTrackSeconds: 43, greenTrackSeconds: 20 },
        { athleteId: '5', redTrackSeconds: 44, greenTrackSeconds: 20 },
      ],
      h2hResults: [],
      parallelPairs: [],
      crossPlaces: [],
      crossHeats: null,
      meta: { qualificationCalculated: true, stage1Calculated: false, finalCalculated: false },
    });
  });

  describe('getParallelPairsOrderByFirstAthleteRating', () => {
    it('возвращает пустой массив при отсутствии пар', () => {
      expect(getParallelPairsOrderByFirstAthleteRating()).toEqual([]);
    });

    it('сортирует пары по месту в квалификации первого участника (пара с организатором в середине)', () => {
      const d = getData();
      d.parallelPairs = [
        { athlete1Id: '3', athlete2Id: null, athlete2Label: 'Организатор', outcomeAttempt1: null, outcomeAttempt2: null },
        { athlete1Id: '1', athlete2Id: '2', outcomeAttempt1: null, outcomeAttempt2: null },
        { athlete1Id: '4', athlete2Id: '5', outcomeAttempt1: null, outcomeAttempt2: null },
      ];
      setData(d);

      const order = getParallelPairsOrderByFirstAthleteRating();

      expect(order).toHaveLength(3);
      expect(order).toEqual([1, 0, 2]);
      expect(d.parallelPairs[order[0]].athlete1Id).toBe('1');
      expect(d.parallelPairs[order[1]].athlete1Id).toBe('3');
      expect(d.parallelPairs[order[1]].athlete2Id).toBeNull();
      expect(d.parallelPairs[order[2]].athlete1Id).toBe('4');
    });

    it('при ошибке квалификации возвращает порядок по умолчанию (0, 1, …, n-1)', () => {
      const d = getData();
      d.qualificationAttempts = [];
      d.parallelPairs = [
        { athlete1Id: '1', athlete2Id: '2', outcomeAttempt1: null, outcomeAttempt2: null },
        { athlete1Id: '3', athlete2Id: '4', outcomeAttempt1: null, outcomeAttempt2: null },
      ];
      setData(d);

      const order = getParallelPairsOrderByFirstAthleteRating();

      expect(order).toEqual([0, 1]);
    });
  });
});
