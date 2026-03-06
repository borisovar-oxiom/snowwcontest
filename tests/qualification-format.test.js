/**
 * Тесты форматирования квалификации и черновика.
 */
import { describe, it, expect } from 'vitest';

const { SnowContestQualificationFormat } = window;

describe('qualification-format', () => {
  describe('formatQualificationValue', () => {
    it('для null возвращает nullSymbol или "-"', () => {
      expect(SnowContestQualificationFormat.formatQualificationValue(null)).toBe('-');
      expect(SnowContestQualificationFormat.formatQualificationValue(null, '—')).toBe('—');
    });
    it('для числа возвращает два знака после запятой', () => {
      expect(SnowContestQualificationFormat.formatQualificationValue(40.123)).toBe('40.12');
      expect(SnowContestQualificationFormat.formatQualificationValue(0)).toBe('0.00');
    });
    it('для не числа возвращает как есть или пустую строку', () => {
      expect(SnowContestQualificationFormat.formatQualificationValue(undefined)).toBe('');
    });
  });

  describe('formatQualificationTotalTime', () => {
    it('если нет красной или зелёной — пустая строка', () => {
      expect(SnowContestQualificationFormat.formatQualificationTotalTime({})).toBe('');
      expect(SnowContestQualificationFormat.formatQualificationTotalTime({ redTrackSeconds: 40 })).toBe('');
    });
    it('если null по одной трассе — "время + НФ" или nullSymbol', () => {
      expect(
        SnowContestQualificationFormat.formatQualificationTotalTime({
          redTrackSeconds: null,
          greenTrackSeconds: 20,
        })
      ).toBe('20.00 + НФ');
      expect(
        SnowContestQualificationFormat.formatQualificationTotalTime(
          { redTrackSeconds: null, greenTrackSeconds: 20 },
          '—'
        )
      ).toBe('20.00 + —');
    });
    it('сумма двух трасс с двумя знаками', () => {
      expect(
        SnowContestQualificationFormat.formatQualificationTotalTime({
          redTrackSeconds: 40,
          greenTrackSeconds: 20,
        })
      ).toBe('60.00');
    });
    it('при наличии tie-break добавляет в скобках', () => {
      expect(
        SnowContestQualificationFormat.formatQualificationTotalTime({
          redTrackSeconds: 40,
          greenTrackSeconds: 20,
          redTieBreakSeconds: 39.5,
        })
      ).toBe('60.00 (39.50)');
    });
  });

  describe('getQualificationDraftSortValue', () => {
    it('при отсутствии чисел возвращает +Infinity', () => {
      expect(SnowContestQualificationFormat.getQualificationDraftSortValue({})).toBe(Number.POSITIVE_INFINITY);
    });
    it('при одной заполненной трассе — среднее (полусумма)', () => {
      expect(
        SnowContestQualificationFormat.getQualificationDraftSortValue({ redTrackSeconds: 40 })
      ).toBe(40);
    });
    it('при двух трассах — среднее', () => {
      expect(
        SnowContestQualificationFormat.getQualificationDraftSortValue({
          redTrackSeconds: 40,
          greenTrackSeconds: 20,
        })
      ).toBe(30);
    });
  });
});
