/**
 * Тесты UI: бейджи классов, экранирование HTML.
 */
import { describe, it, expect } from 'vitest';

const { SnowContestUI } = window;

describe('ui', () => {
  describe('badge', () => {
    it('возвращает span с классом для К1М, К1Ж, П1М, П1Ж', () => {
      expect(SnowContestUI.badge('К1М')).toContain('badge-k1m');
      expect(SnowContestUI.badge('К1М')).toContain('>К1М</span>');
      expect(SnowContestUI.badge('К1Ж')).toContain('badge-k1w');
      expect(SnowContestUI.badge('П1М')).toContain('badge-p1m');
      expect(SnowContestUI.badge('П1Ж')).toContain('badge-p1w');
    });
    it('для неизвестного класса возвращает пустой класс бейджа', () => {
      expect(SnowContestUI.badge('Х1')).toContain('<span class="badge ">Х1</span>');
    });
  });

  describe('escapeHtml', () => {
    it('экранирует амперсанд, угловые скобки, кавычки, null и undefined', () => {
      expect(SnowContestUI.escapeHtml('a & b')).toBe('a &amp; b');
      expect(SnowContestUI.escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(SnowContestUI.escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
      expect(SnowContestUI.escapeHtml("'apostrophe'")).toBe('&#39;apostrophe&#39;');
      expect(SnowContestUI.escapeHtml(null)).toBe('');
      expect(SnowContestUI.escapeHtml(undefined)).toBe('');
    });
    it('число приводит к строке', () => {
      expect(SnowContestUI.escapeHtml(42)).toBe('42');
    });
  });

  describe('showMsg / hideMsg', () => {
    it('showMsg не падает при отсутствии элемента msg', () => {
      expect(() => SnowContestUI.showMsg('test', false)).not.toThrow();
    });
    it('hideMsg не падает при отсутствии элемента', () => {
      expect(() => SnowContestUI.hideMsg()).not.toThrow();
    });
  });
});
