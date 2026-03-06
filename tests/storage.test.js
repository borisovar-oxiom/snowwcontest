/**
 * Тесты работы с localStorage и публикацией.
 */
import { describe, it, expect, beforeEach } from 'vitest';

const { SnowContestStorage } = window;

const STORAGE_KEY = 'snowcontest_data';
const PUBLICATION_KEY = 'snowcontest_publication';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('normalizePublication', () => {
    it('нормализует parallelPairs: outcomeAttempt1 из outcome при отсутствии', () => {
      const source = {
        athletes: [],
        parallelPairs: [{ id: 'p1', outcome: 1 }],
      };
      const out = SnowContestStorage.normalizePublication(source);
      expect(out.parallelPairs[0].outcomeAttempt1).toBe(1);
      expect(out.parallelPairs[0].outcomeAttempt2).toBeNull();
    });
    it('сохраняет boatClassLabels и остальные поля', () => {
      const source = {
        athletes: [{ id: '1' }],
        qualification: [],
        boatClassLabels: { К1М: 'Каяк М' },
      };
      const out = SnowContestStorage.normalizePublication(source);
      expect(out.athletes).toEqual([{ id: '1' }]);
      expect(out.qualification).toEqual([]);
      expect(out.boatClassLabels).toEqual({ К1М: 'Каяк М' });
    });
  });

  describe('getPublication', () => {
    it('возвращает null при пустом хранилище', () => {
      expect(SnowContestStorage.getPublication()).toBeNull();
    });
    it('возвращает нормализованные данные по PUBLICATION_KEY', () => {
      const pub = { athletes: [], parallelPairs: [{ outcome: 2 }] };
      localStorage.setItem(PUBLICATION_KEY, JSON.stringify(pub));
      const out = SnowContestStorage.getPublication();
      expect(out).not.toBeNull();
      expect(out.parallelPairs[0].outcomeAttempt1).toBe(2);
    });
  });

  describe('loadData', () => {
    it('возвращает дефолт при пустом хранилище', () => {
      const out = SnowContestStorage.loadData();
      expect(out.athletes).toEqual([]);
      expect(out.qualificationAttempts).toEqual([]);
      expect(out.h2hResults).toEqual([]);
      expect(out.parallelPairs).toEqual([]);
      expect(out.crossPlaces).toEqual([]);
      expect(out.crossHeats).toBeNull();
      expect(out.meta.qualificationCalculated).toBe(false);
      expect(out.meta.stage1Calculated).toBe(false);
      expect(out.meta.finalCalculated).toBe(false);
    });
    it('загружает сохранённые данные и meta', () => {
      const data = {
        athletes: [{ id: '1' }],
        qualificationAttempts: [],
        h2hResults: [],
        parallelPairs: [],
        crossPlaces: [],
        meta: { qualificationCalculated: true, stage1Calculated: false, finalCalculated: false },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const out = SnowContestStorage.loadData();
      expect(out.athletes).toEqual([{ id: '1' }]);
      expect(out.meta.qualificationCalculated).toBe(true);
    });
  });

  describe('saveDataToStorage', () => {
    it('записывает данные в STORAGE_KEY', () => {
      const data = { athletes: [], qualificationAttempts: [] };
      SnowContestStorage.saveDataToStorage(data);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(data);
    });
  });

  describe('loadPublication', () => {
    it('при отсутствии ключа возвращает дефолт с boatClassLabels из SnowContest', () => {
      const out = SnowContestStorage.loadPublication();
      expect(out.athletes).toEqual([]);
      expect(out.qualification).toBeNull();
      expect(out.parallelPairs).toEqual([]);
      expect(out.stage1).toBeNull();
      expect(out.finalResults).toBeNull();
      expect(out.crossHeats).toBeNull();
      expect(out.crossPlaces).toBeNull();
      expect(Object.keys(out.boatClassLabels).length).toBeGreaterThan(0);
    });
    it('загружает сохранённую публикацию', () => {
      const pub = {
        athletes: [{ id: '1' }],
        qualification: [],
        parallelPairs: [],
        stage1: null,
        finalResults: null,
        crossHeats: null,
        crossPlaces: null,
        boatClassLabels: {},
      };
      localStorage.setItem(PUBLICATION_KEY, JSON.stringify(pub));
      const out = SnowContestStorage.loadPublication();
      expect(out.athletes).toEqual([{ id: '1' }]);
    });
  });

  describe('savePublication', () => {
    it('записывает публикацию в PUBLICATION_KEY', () => {
      const pub = { athletes: [], qualification: null, parallelPairs: [] };
      SnowContestStorage.savePublication(pub);
      expect(JSON.parse(localStorage.getItem(PUBLICATION_KEY))).toEqual(pub);
    });
  });
});
