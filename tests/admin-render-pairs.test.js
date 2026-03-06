/**
 * Тесты таблицы параллельных спусков: цикл исхода при клике (победа → НФ → сброс, клик по противнику победителя → НФ).
 */
import { describe, it, expect } from 'vitest';

const { getNextOutcomeForClick } = window.SnowContestAdminRenderPairs;

describe('admin-render-pairs', () => {
  describe('getNextOutcomeForClick', () => {
    describe('цикл по участнику A', () => {
      it('пустой → клик A даёт A_WIN', () => {
        expect(getNextOutcomeForClick(null, 'A')).toBe('A_WIN');
      });
      it('B победил → клик по A выставляет A НФ (A_DNF)', () => {
        expect(getNextOutcomeForClick('B_WIN', 'A')).toBe('A_DNF');
      });
      it('A победил → повторный клик A переключает победу на B (B_WIN)', () => {
        expect(getNextOutcomeForClick('A_WIN', 'A')).toBe('B_WIN');
      });
      it('A НФ → клик A сбрасывает (null)', () => {
        expect(getNextOutcomeForClick('A_DNF', 'A')).toBe(null);
      });
      it('оба НФ → клик A сбрасывает (null)', () => {
        expect(getNextOutcomeForClick('BOTH_DNF', 'A')).toBe(null);
      });
      it('B НФ → клик A даёт оба НФ', () => {
        expect(getNextOutcomeForClick('B_DNF', 'A')).toBe('BOTH_DNF');
      });
    });

    describe('цикл по участнику B', () => {
      it('пустой → клик B даёт B_WIN', () => {
        expect(getNextOutcomeForClick(null, 'B')).toBe('B_WIN');
      });
      it('A победил → клик по B выставляет B НФ (B_DNF)', () => {
        expect(getNextOutcomeForClick('A_WIN', 'B')).toBe('B_DNF');
      });
      it('B победил → повторный клик B переключает победу на A (A_WIN)', () => {
        expect(getNextOutcomeForClick('B_WIN', 'B')).toBe('A_WIN');
      });
      it('B НФ → клик B сбрасывает (null)', () => {
        expect(getNextOutcomeForClick('B_DNF', 'B')).toBe(null);
      });
      it('оба НФ → клик B сбрасывает (null)', () => {
        expect(getNextOutcomeForClick('BOTH_DNF', 'B')).toBe(null);
      });
      it('A НФ → клик B даёт оба НФ', () => {
        expect(getNextOutcomeForClick('A_DNF', 'B')).toBe('BOTH_DNF');
      });
    });
  });
});
