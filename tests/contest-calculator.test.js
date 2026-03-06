/**
 * Тесты расчёта соревнований: квалификация, снежный этап, финал по классам.
 */
import { describe, it, expect } from 'vitest';

const { SnowContest } = window;

describe('contest-calculator', () => {
  describe('createAthlete', () => {
    it('создаёт атлета с id, displayName, boatClass', () => {
      const a = SnowContest.createAthlete('id1', 'Иванов', 'К1М');
      expect(a).toEqual({ id: 'id1', displayName: 'Иванов', boatClass: 'К1М' });
    });
  });

  describe('createQualificationAttempt', () => {
    it('считает totalSeconds и isDnf при двух трассах', () => {
      const q = SnowContest.createQualificationAttempt(40, 20);
      expect(q.redTrackSeconds).toBe(40);
      expect(q.greenTrackSeconds).toBe(20);
      expect(q.totalSeconds).toBe(60);
      expect(q.isDnf).toBe(false);
    });
    it('помечает НФ при null на одной из трасс', () => {
      const q = SnowContest.createQualificationAttempt(null, 20);
      expect(q.isDnf).toBe(true);
      expect(q.totalSeconds).toBe(Number.MAX_VALUE + 20);
    });
    it('принимает redTieBreakSeconds', () => {
      const q = SnowContest.createQualificationAttempt(40, 20, 39.5);
      expect(q.redTieBreakSeconds).toBe(39.5);
    });
  });

  describe('createH2hResult', () => {
    it('считает h2hPoints: wins*2 + losses', () => {
      const h = SnowContest.createH2hResult('a1', 2, 1, 0);
      expect(h.athleteId).toBe('a1');
      expect(h.h2hPoints).toBe(2 * 2 + 1);
    });
  });

  describe('buildQualificationStandings', () => {
    it('сортирует по суммарному времени и начисляет очки N, N-1, ..., 1', () => {
      const athletes = [
        SnowContest.createAthlete('A1', 'A1', 'К1М'),
        SnowContest.createAthlete('A2', 'A2', 'К1М'),
        SnowContest.createAthlete('A3', 'A3', 'К1М'),
      ];
      const attempts = {
        A1: SnowContest.createQualificationAttempt(40, 20),
        A2: SnowContest.createQualificationAttempt(35, 25),
        A3: SnowContest.createQualificationAttempt(39, 22),
      };
      const result = SnowContest.buildQualificationStandings(athletes, attempts);
      expect(result.map(r => r.athlete.id)).toEqual(['A2', 'A1', 'A3']);
      expect(result.map(r => r.place)).toEqual([1, 2, 3]);
      expect(result.map(r => r.qualificationPoints)).toEqual([3, 2, 1]);
    });

    it('при равенстве суммы сортирует по красной, затем по зелёной', () => {
      const athletes = [
        SnowContest.createAthlete('A', 'A', 'К1М'),
        SnowContest.createAthlete('B', 'B', 'К1М'),
        SnowContest.createAthlete('C', 'C', 'К1М'),
      ];
      const attempts = {
        A: SnowContest.createQualificationAttempt(40, 20),
        B: SnowContest.createQualificationAttempt(35, 25),
        C: SnowContest.createQualificationAttempt(39, 22),
      };
      const result = SnowContest.buildQualificationStandings(athletes, attempts);
      expect(result.map(r => r.athlete.id)).toEqual(['B', 'A', 'C']);
    });

    it('НФ в конце и получают минимальные очки', () => {
      const athletes = ['A', 'B', 'C'].map(id => SnowContest.createAthlete(id, id, 'К1М'));
      const attempts = {
        A: SnowContest.createQualificationAttempt(40, 20),
        B: SnowContest.createQualificationAttempt(null, 20),
        C: SnowContest.createQualificationAttempt(null, null),
      };
      const result = SnowContest.buildQualificationStandings(athletes, attempts);
      expect(result.map(r => r.athlete.id)).toEqual(['A', 'B', 'C']);
      expect(result[2].qualificationPoints).toBe(1);
    });

    it('при полном равенстве без tie-break бросает ошибку', () => {
      const athletes = [
        SnowContest.createAthlete('A', 'A', 'К1М'),
        SnowContest.createAthlete('B', 'B', 'К1М'),
      ];
      const attempts = {
        A: SnowContest.createQualificationAttempt(40, 20),
        B: SnowContest.createQualificationAttempt(40, 20),
      };
      expect(() => SnowContest.buildQualificationStandings(athletes, attempts)).toThrow(
        /повторный заезд по красной трассе/
      );
    });

    it('при равенстве с tie-break сортирует по redTieBreakSeconds', () => {
      const athletes = ['A', 'B', 'C', 'D'].map(id => SnowContest.createAthlete(id, id, 'К1М'));
      const attempts = {
        A: SnowContest.createQualificationAttempt(40, 20, 39.8),
        B: SnowContest.createQualificationAttempt(40, 20, 39.4),
        C: SnowContest.createQualificationAttempt(30, 20),
        D: SnowContest.createQualificationAttempt(50, 20),
      };
      const result = SnowContest.buildQualificationStandings(athletes, attempts);
      expect(result.map(r => r.athlete.id)).toEqual(['C', 'B', 'A', 'D']);
    });

    it('если нет данных для атлета — бросает ошибку', () => {
      const athletes = [SnowContest.createAthlete('X', 'X', 'К1М')];
      const attempts = {};
      expect(() => SnowContest.buildQualificationStandings(athletes, attempts)).toThrow(
        /Нет данных для этапа квалификации/
      );
    });
  });

  describe('buildStage1Results', () => {
    it('R1 = qualificationPoints + h2hPoints, сортировка по R1', () => {
      const athletes = ['A', 'B'].map(id => SnowContest.createAthlete(id, id, 'К1М'));
      const attempts = {
        A: SnowContest.createQualificationAttempt(40, 20),
        B: SnowContest.createQualificationAttempt(50, 20),
      };
      const qual = SnowContest.buildQualificationStandings(athletes, attempts);
      const h2hResults = {
        A: SnowContest.createH2hResult('A', 1, 0, 0),
        B: SnowContest.createH2hResult('B', 0, 0, 0),
      };
      const stage1 = SnowContest.buildStage1Results(qual, h2hResults);
      expect(stage1[0].athlete.id).toBe('A');
      expect(stage1[0].r1).toBe(2 + 2);
      expect(stage1[1].r1).toBe(1 + 0);
    });

    it('при отсутствии h2h для атлета бросает ошибку', () => {
      const athletes = [SnowContest.createAthlete('X', 'X', 'К1М')];
      const attempts = { X: SnowContest.createQualificationAttempt(40, 20) };
      const qual = SnowContest.buildQualificationStandings(athletes, attempts);
      expect(() => SnowContest.buildStage1Results(qual, {})).toThrow(/Нет данных для этапа снежного/);
    });

    it('при равных баллах за первый этап (R1) выше место у того, у кого лучше место в квалификации', () => {
      // A: 1-е место в квалификации (2 очка), 0 очков H2H → R1 = 2
      // B: 2-е место в квалификации (1 очко), 1 очко H2H → R1 = 2
      const athletes = [
        SnowContest.createAthlete('A', 'A', 'К1М'),
        SnowContest.createAthlete('B', 'B', 'К1М'),
      ];
      const attempts = {
        A: SnowContest.createQualificationAttempt(40, 20),
        B: SnowContest.createQualificationAttempt(50, 20),
      };
      const qual = SnowContest.buildQualificationStandings(athletes, attempts);
      const h2hResults = {
        A: SnowContest.createH2hResult('A', 0, 0, 0),
        B: SnowContest.createH2hResult('B', 0, 1, 0),
      };
      const stage1 = SnowContest.buildStage1Results(qual, h2hResults);
      expect(stage1[0].r1).toBe(stage1[1].r1);
      expect(stage1[0].athlete.id).toBe('A');
      expect(stage1[0].qualificationPlace).toBe(1);
      expect(stage1[1].qualificationPlace).toBe(2);
    });

    it('при равных баллах за первый этап (R1) выше место у того, у кого лучше место в квалификации — при любом порядке на входе', () => {        
      // A: 2-е место в квалификации (1 очко), 1 очко H2H → R1 = 2
      // B: 1-е место в квалификации (2 очка), 0 очков H2H → R1 = 2
      const athletes = [
        SnowContest.createAthlete('A', 'A', 'К1М'),
        SnowContest.createAthlete('B', 'B', 'К1М'),
      ];
      const attempts = {
        A: SnowContest.createQualificationAttempt(60, 20),
        B: SnowContest.createQualificationAttempt(50, 20),
      };
      const qual = SnowContest.buildQualificationStandings(athletes, attempts);
      const h2hResults = {
        A: SnowContest.createH2hResult('A', 0, 1, 0),
        B: SnowContest.createH2hResult('B', 0, 0, 0),
      };
      const stage1 = SnowContest.buildStage1Results(qual, h2hResults);
      expect(stage1[0].r1).toBe(stage1[1].r1);
      expect(stage1[0].athlete.id).toBe('B');
      expect(stage1[0].qualificationPlace).toBe(1);
      expect(stage1[1].qualificationPlace).toBe(2);
    });
  });

  describe('buildFinalResultsByClass', () => {
    it('R2 по месту в кроссе, R = R1 + R2, финал по классам', () => {
      const athletes = [
        SnowContest.createAthlete('a1', 'a1', 'К1М'),
        SnowContest.createAthlete('a2', 'a2', 'К1М'),
      ];
      const attempts = {
        a1: SnowContest.createQualificationAttempt(40, 20),
        a2: SnowContest.createQualificationAttempt(50, 20),
      };
      const h2h = {
        a1: SnowContest.createH2hResult('a1', 0, 0, 0),
        a2: SnowContest.createH2hResult('a2', 0, 0, 0),
      };
      const qual = SnowContest.buildQualificationStandings(athletes, attempts);
      const stage1 = SnowContest.buildStage1Results(qual, h2h);
      const crossPlaces = { a1: 1, a2: 2 };
      const finalResults = SnowContest.buildFinalResultsByClass(stage1, crossPlaces);
      expect(finalResults.length).toBe(2);
      expect(finalResults[0].athlete.id).toBe('a1');
      expect(finalResults[0].r2).toBe(2);
      expect(finalResults[0].totalRating).toBe(finalResults[0].r1 + 2);
      expect(finalResults[1].r2).toBe(1);
    });

    it('при месте в кроссе <= 0 бросает ошибку', () => {
      const athletes = [SnowContest.createAthlete('x', 'x', 'К1М')];
      const attempts = { x: SnowContest.createQualificationAttempt(40, 20) };
      const h2h = { x: SnowContest.createH2hResult('x', 0, 0, 0) };
      const qual = SnowContest.buildQualificationStandings(athletes, attempts);
      const stage1 = SnowContest.buildStage1Results(qual, h2h);
      expect(() => SnowContest.buildFinalResultsByClass(stage1, { x: 0 })).toThrow(
        /место в кроссе должно быть больше нуля/
      );
    });
  });

  describe('runContest', () => {
    it('принимает данные админки и возвращает qualification, stage1, finalResults', () => {
      const data = {
        athletes: [
          { id: '1', displayName: 'Первый', boatClass: 'К1М' },
          { id: '2', displayName: 'Второй', boatClass: 'К1М' },
        ],
        qualificationAttempts: [
          { athleteId: '1', redTrackSeconds: 40, greenTrackSeconds: 20 },
          { athleteId: '2', redTrackSeconds: 50, greenTrackSeconds: 20 },
        ],
        h2hResults: [
          { athleteId: '1', wins: 0, losses: 0, dnfs: 0 },
          { athleteId: '2', wins: 0, losses: 0, dnfs: 0 },
        ],
        crossPlaces: [
          { athleteId: '1', place: 1 },
          { athleteId: '2', place: 2 },
        ],
      };
      const result = SnowContest.runContest(data);
      expect(result.qualification).toHaveLength(2);
      expect(result.stage1).toHaveLength(2);
      expect(result.finalResults).toHaveLength(2);
      expect(result.boatClassLabels).toEqual(SnowContest.BOAT_CLASS_LABELS);
    });
  });
});
