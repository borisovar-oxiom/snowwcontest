import { describe, it, expect } from 'vitest';

const Pairs = window.SnowContestAdminPairs;
const Heats = window.SnowContestHeatsShared;

describe('Полный проход кросса — 9 участников одного класса', () => {
  const boatClass = 'К1М';
  const ids9 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
  const athletes9 = ids9.map((id) => ({
    id,
    displayName: `Участник ${id.toUpperCase()}`,
    boatClass,
  }));
  const escapeHtml = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  it('полный проход: 9 участников → 5 туров в сетке и таблица мест кросса', () => {
    const d = {
      crossHeats: {},
    };

    const round1 = Pairs.buildHeatsFromParticipantIds(ids9, boatClass);
    d.crossHeats[boatClass] = { round1 };

    expect(round1).toHaveLength(3);
    // Проверяем, что раздача в первом туре ровно такая, как ожидается для 9 участников.
    expect(round1[0].athleteIds).toEqual(['a', 'f', 'g']);
    expect(round1[1].athleteIds).toEqual(['b', 'e', 'h']);
    expect(round1[2].athleteIds).toEqual(['c', 'd', 'i']);

    round1[0].participants = [
      { athleteId: round1[0].athleteIds[0], placeInHeat: 1 }, // a
      { athleteId: round1[0].athleteIds[1], placeInHeat: 2 }, // f
      { athleteId: round1[0].athleteIds[2], placeInHeat: 3 }, // g
    ];
    round1[1].participants = [
      { athleteId: round1[1].athleteIds[0], placeInHeat: 1 }, // b
      { athleteId: round1[1].athleteIds[1], placeInHeat: 2 }, // e
      { athleteId: round1[1].athleteIds[2], placeInHeat: 3 }, // h
    ];
    round1[2].participants = [
      { athleteId: round1[2].athleteIds[0], placeInHeat: 1 }, // c
      { athleteId: round1[2].athleteIds[1], placeInHeat: 2 }, // d
      { athleteId: round1[2].athleteIds[2], placeInHeat: 3 }, // i
    ];

    expect(Pairs.isRoundComplete(round1)).toBe(true);

    Pairs.ensureNextRounds(d);

    // Проверяем флаги перехода в следующий тур
    expect(round1[0].participants[0].advancesUpper).toBe(true);
    expect(round1[1].participants[0].advancesUpper).toBe(true);
    expect(round1[2].participants[0].advancesUpper).toBe(true);
    expect(round1[2].participants[1].advancesUpper).toBe(true);
    expect(round1[1].participants[1].advancesUpper).toBe(true);
    expect(round1[0].participants[1].advancesUpper).toBe(true);
    expect(round1[0].participants[2].advancesUpper).toBe(false);
    expect(round1[1].participants[2].advancesUpper).toBe(false);
    expect(round1[2].participants[2].advancesUpper).toBe(false);

    const classHeatsAfterR1 = d.crossHeats[boatClass];
    const round2Upper = classHeatsAfterR1.round2Upper;
    const round2Lower = classHeatsAfterR1.round2Lower;

    expect(round2Upper).toBeDefined();
    expect(round2Lower).toBeDefined();
    expect(round2Upper.length).toBe(2);
      expect(round2Lower.length).toBe(1);

    // Проверяем состав хитов второго тура.
    expect(round2Upper[0].athleteIds).toEqual(['a', 'd', 'e']);
    expect(round2Upper[1].athleteIds).toEqual(['b', 'c', 'f']);
    expect(round2Lower[0].athleteIds).toEqual(['g', 'h', 'i']);

    round2Upper[0].participants = [
      { athleteId: round2Upper[0].athleteIds[0], placeInHeat: 1 }, // a
      { athleteId: round2Upper[0].athleteIds[1], placeInHeat: 2 }, // d
      { athleteId: round2Upper[0].athleteIds[2], placeInHeat: 3 }, // e
    ];
    round2Upper[1].participants = [
      { athleteId: round2Upper[1].athleteIds[0], placeInHeat: 1 }, // b
      { athleteId: round2Upper[1].athleteIds[1], placeInHeat: 2 }, // c
      { athleteId: round2Upper[1].athleteIds[2], placeInHeat: 3 }, // f
    ];
    round2Lower[0].participants = [
      { athleteId: round2Lower[0].athleteIds[0], placeInHeat: 1 }, // g
      { athleteId: round2Lower[0].athleteIds[1], placeInHeat: 2 }, // h
      { athleteId: round2Lower[0].athleteIds[2], placeInHeat: 3 }, // i
    ];

    expect(Pairs.isRoundComplete(round2Upper)).toBe(true);
    expect(Pairs.isRoundComplete(round2Lower)).toBe(true);

    Pairs.ensureNextRounds(d);

    // Проверяем флаги перехода в следующий тур для тура 2 (верхняя и нижняя сетки)
    expect(round2Upper[0].participants[0].advancesUpper).toBe(true);  // a
    expect(round2Upper[0].participants[1].advancesUpper).toBe(true);  // d
    expect(round2Upper[0].participants[2].advancesUpper).toBe(false); // e
    expect(round2Upper[1].participants[0].advancesUpper).toBe(true);  // b
    expect(round2Upper[1].participants[1].advancesUpper).toBe(true);  // c
    expect(round2Upper[1].participants[2].advancesUpper).toBe(false); // f

    // round2Lower: g, h, i → вверх (в следующий нижний тур) идут g и h.
    expect(round2Lower[0].participants[0].advancesUpper).toBe(true);  // g
    expect(round2Lower[0].participants[1].advancesUpper).toBe(true);  // h
    expect(round2Lower[0].participants[2].advancesUpper).toBe(false); // i

    const classHeatsAfterR2 = d.crossHeats[boatClass];
    const round3Upper = classHeatsAfterR2.round3Upper;
    const round3Lower = classHeatsAfterR2.round3Lower;

    expect(round3Upper).toBeDefined();
    expect(round3Lower).toBeDefined();
    expect(round3Upper).toHaveLength(1);
    expect(round3Lower).toHaveLength(1);

    // Проверяем состав хитов третьего тура.
    expect(round3Upper[0].athleteIds).toEqual(['a', 'b', 'c', 'd']);
    expect(round3Lower[0].athleteIds).toEqual(['e', 'f', 'g', 'h']);

    round3Upper[0].participants = [
      { athleteId: round3Upper[0].athleteIds[0], placeInHeat: 1 }, // a
      { athleteId: round3Upper[0].athleteIds[1], placeInHeat: 2 }, // b
      { athleteId: round3Upper[0].athleteIds[2], placeInHeat: 3 }, // c
      { athleteId: round3Upper[0].athleteIds[3], placeInHeat: 4 }, // d
    ];
    round3Lower[0].participants = [
      { athleteId: round3Lower[0].athleteIds[0], placeInHeat: 1 }, // e
      { athleteId: round3Lower[0].athleteIds[1], placeInHeat: 2 }, // f
      { athleteId: round3Lower[0].athleteIds[2], placeInHeat: 3 }, // g
      { athleteId: round3Lower[0].athleteIds[3], placeInHeat: 4 }, // h
    ];

    expect(Pairs.isRoundComplete(round3Upper)).toBe(true);
    expect(Pairs.isRoundComplete(round3Lower)).toBe(true);

    Pairs.ensureNextRounds(d);

    // Проверяем флаги перехода в следующий тур для тура 3 (верхняя и нижняя сетки)
    // round3Upper: a, b, c, d → вверх идут a и b.
    expect(round3Upper[0].participants[0].advancesUpper).toBe(true);  // a
    expect(round3Upper[0].participants[1].advancesUpper).toBe(true);  // b
    expect(round3Upper[0].participants[2].advancesUpper).toBe(false); // c
    expect(round3Upper[0].participants[3].advancesUpper).toBe(false); // d

    // round3Lower: e, f, g, h → вверх (в дополнительный тур) идут e и f.
    expect(round3Lower[0].participants[0].advancesUpper).toBe(true);  // e
    expect(round3Lower[0].participants[1].advancesUpper).toBe(true);  // f
    expect(round3Lower[0].participants[2].advancesUpper).toBe(false); // g
    expect(round3Lower[0].participants[3].advancesUpper).toBe(false); // h

    const classHeatsAfterR3 = d.crossHeats[boatClass];
    const round4Upper = classHeatsAfterR3.round4Upper;
    const round4Lower = classHeatsAfterR3.round4Lower;

    expect(round4Upper).toBeUndefined();
    expect(round4Lower).toBeDefined();
    expect(round4Lower).toHaveLength(1);
    
    // Проверяем состав хитов четвертого тура.
    expect(round4Lower[0].athleteIds).toEqual(['c', 'd', 'e', 'f']);

    round4Lower[0].participants = [
      { athleteId: round4Lower[0].athleteIds[0], placeInHeat: 1 }, // c
      { athleteId: round4Lower[0].athleteIds[1], placeInHeat: 2 }, // d
      { athleteId: round4Lower[0].athleteIds[2], placeInHeat: 3 }, // e
      { athleteId: round4Lower[0].athleteIds[3], placeInHeat: 4 }, // f
    ];

    expect(Pairs.isRoundComplete(round4Lower)).toBe(true);

    Pairs.ensureNextRounds(d);

    // Проверяем флаги перехода в следующий тур для тура 4 (нижняя сетка)
    // round4Lower: c, d, e, f → вверх (в суперфинал) идут c и d.
    expect(round4Lower[0].participants[0].advancesUpper).toBe(true);  // c
    expect(round4Lower[0].participants[1].advancesUpper).toBe(true);  // d
    expect(round4Lower[0].participants[2].advancesUpper).toBe(false); // e
    expect(round4Lower[0].participants[3].advancesUpper).toBe(false); // f

    const classHeatsAfterR4 = d.crossHeats[boatClass];
    const round5Upper = classHeatsAfterR4.round5Upper;
    const round5Lower = classHeatsAfterR4.round5Lower;

    expect(round5Upper).toBeDefined();
    expect(round5Upper).toHaveLength(1);
    expect(round5Lower).toBeUndefined();

    // Проверяем состав финального (суперфинального) тура.
    expect(round5Upper[0].athleteIds).toEqual(['a', 'b', 'c', 'd']);

    round5Upper[0].participants = [
      { athleteId: round5Upper[0].athleteIds[0], placeInHeat: 1 }, // a
      { athleteId: round5Upper[0].athleteIds[1], placeInHeat: 2 }, // b
      { athleteId: round5Upper[0].athleteIds[2], placeInHeat: 3 }, // c
      { athleteId: round5Upper[0].athleteIds[3], placeInHeat: 4 }, // d
    ];

    expect(Pairs.isRoundComplete(round5Upper)).toBe(true);

    // В финале не должен проставляться флаг advancesUpper,
    // так как это последний тур и дальше никто не проходит.
    round5Upper[0].participants.forEach((p) => {
      expect(Object.prototype.hasOwnProperty.call(p, 'advancesUpper')).toBe(false);
    });

    const classHeatsFinal = d.crossHeats[boatClass];
    expect(Heats.allHeatsFilled(classHeatsFinal)).toBe(true);

    const athleteById = new Map(athletes9.map((a) => [a.id, a]));
    const bracketRounds = Heats.buildBracketRounds(
      classHeatsFinal,
      athleteById,
      Heats.ROUND_LABELS,
      escapeHtml,
      (heat, _participants, sortedParticipants, athleteByIdLocal, esc) => {
        return sortedParticipants
          .map((p, idx) => {
            const athlete = athleteByIdLocal.get(p.athleteId);
            const name = athlete ? athlete.displayName || athlete.id : p.athleteId;
            return `<tr><td>${idx + 1}</td><td>${esc(name)}</td><td>${p.placeInHeat ?? ''}</td></tr>`;
          })
          .join('');
      }
    );

    expect(bracketRounds).toHaveLength(5);

    const crossPlaces = Pairs.computeCrossPlacesFromHeats(d.crossHeats);
    expect(crossPlaces).toHaveLength(9);
    const idsFromPlaces = new Set(crossPlaces.map((p) => p.athleteId));
    expect(idsFromPlaces).toEqual(new Set(ids9));
    const placesSorted = crossPlaces.map((p) => p.place).sort((a, b) => a - b);
    expect(placesSorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const placeOf = (id) => crossPlaces.find((p) => p.athleteId === id)?.place;
    expect(placeOf('a')).toBe(1);
    expect(placeOf('b')).toBe(2);
    expect(placeOf('c')).toBe(3);
    expect(placeOf('d')).toBe(4);
    expect(placeOf('e')).toBe(5);
    expect(placeOf('f')).toBe(6);
    expect(placeOf('g')).toBe(7);
    expect(placeOf('h')).toBe(8);
    expect(placeOf('i')).toBe(9);

    const withPlace = Heats.buildClassPlacesData(athletes9, crossPlaces, boatClass);
    expect(withPlace).toHaveLength(9);
    const orderedPlaces = withPlace.map((x) => x.place);
    expect(orderedPlaces).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const rowsHtml = Heats.buildClassPlacesRowsHtml(withPlace, escapeHtml);
    const rowCount = (rowsHtml.match(/<tr>/g) || []).length;
    expect(rowCount).toBe(9);

    const sectionHtml = Heats.buildClassPlacesSection(rowsHtml, true, '');
    expect(sectionHtml).toContain('Итоговые места в кроссе');
    expect(sectionHtml).toContain('cross-class-places-table');
  });
});

