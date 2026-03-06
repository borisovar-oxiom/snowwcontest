/**
 * Полные сценарии кросса для случаев с шестью и шестнадцатью участниками одного класса.
 */
import {describe, expect, it} from 'vitest';

const Pairs = window.SnowContestAdminPairs;

describe('heats — шесть и шестнадцать участников одного класса', () => {
  describe('Полный сценарий: 6 атлетов (id 1–6), три тура и итоговая таблица', () => {
    it('строит хиты из id 1–6, проходит два следующих тура и считает итоговую таблицу мест', () => {
      const boatClass = 'К1М';
      const athleteIds = ['1', '2', '3', '4', '5', '6'];

      // round1: создаём хиты из списка id
      const round1 = Pairs.buildHeatsFromParticipantIds(athleteIds, boatClass);

      // Явно задаём места в первом туре для каждого хита
      expect(round1[0].athleteIds[0]).toEqual('1');
      expect(round1[0].athleteIds[1]).toEqual('4');
      expect(round1[0].athleteIds[2]).toEqual('5');
      round1[0].participants = [
        { athleteId: round1[0].athleteIds[0], placeInHeat: 1 },
        { athleteId: round1[0].athleteIds[1], placeInHeat: 2 },
        { athleteId: round1[0].athleteIds[2], placeInHeat: 3 },
      ];

      const athlete2 = round1[1].athleteIds[0];
      const athlete3 = round1[1].athleteIds[1];
      const athlete6 = round1[1].athleteIds[2];
      expect(athlete2).toEqual('2');
      expect(athlete3).toEqual('3');
      expect(athlete6).toEqual('6');
      round1[1].participants = [
        { athleteId: athlete2, placeInHeat: 1 },
        { athleteId: athlete3, placeInHeat: 2 },
        { athleteId: athlete6, placeInHeat: 3 },
      ];

      // round2: верхняя и нижняя сетка из результатов round1
      const { upperIds, lowerIds } = Pairs.getFromRound(round1);

      const round2Upper = Pairs.buildHeatsFromParticipantIds(upperIds, boatClass);
      const round2Lower = Pairs.buildHeatsFromParticipantIds(lowerIds, boatClass);

      expect(round2Upper).toHaveLength(1);
      expect(round2Lower).toHaveLength(1);

      expect(round2Upper[0].athleteIds[0]).toEqual('1');
      expect(round2Upper[0].athleteIds[1]).toEqual('2');
      expect(round2Upper[0].athleteIds[2]).toEqual('3');
      expect(round2Upper[0].athleteIds[3]).toEqual('4');
      round2Upper[0].participants = [
        { athleteId: round2Upper[0].athleteIds[0], placeInHeat: 1 },
        { athleteId: round2Upper[0].athleteIds[1], placeInHeat: 2 },
        { athleteId: round2Upper[0].athleteIds[2], placeInHeat: 3 },
        { athleteId: round2Upper[0].athleteIds[3], placeInHeat: 4 },
      ];

      expect(round2Lower[0].athleteIds[0]).toEqual('5');
      expect(round2Lower[0].athleteIds[1]).toEqual('6');
      round2Lower[0].participants = [
        { athleteId: round2Lower[0].athleteIds[0], placeInHeat: 1 },
        { athleteId: round2Lower[0].athleteIds[1], placeInHeat: 2 },
      ];

      const crossHeats = {
        [boatClass]: {
          round1,
          round2Upper,
          round2Lower,
        },
      };

      const crossPlaces = Pairs.computeCrossPlacesFromHeats(crossHeats);
      expect(crossPlaces).toHaveLength(6);
      expect(crossPlaces[0].athleteId).toEqual('1');
      expect(crossPlaces[0].place).toEqual(1);
      expect(crossPlaces[1].athleteId).toEqual('2');
      expect(crossPlaces[1].place).toEqual(2);
      expect(crossPlaces[2].athleteId).toEqual('3');
      expect(crossPlaces[2].place).toEqual(3);
      expect(crossPlaces[3].athleteId).toEqual('4');
      expect(crossPlaces[3].place).toEqual(4);
      expect(crossPlaces[4].athleteId).toEqual('5');
      expect(crossPlaces[4].place).toEqual(5);
      expect(crossPlaces[5].athleteId).toEqual('6');
      expect(crossPlaces[5].place).toEqual(6);
    });
  });

  describe('Полный сценарий: 16 атлетов (id 1–16), три тура и итоговая таблица', () => {
    it('строит хиты из id 1–16, проходит два следующих тура и считает итоговую таблицу мест', () => {
      const boatClass = 'К1М';
      const athleteIds = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
      ];

      // round1: создаём хиты из списка id
      const round1 = Pairs.buildHeatsFromParticipantIds(athleteIds, boatClass);
      expect(round1).toHaveLength(4);
      expect(round1[0].athleteIds).toEqual(['1', '8', '9', '16']);
      expect(round1[1].athleteIds).toEqual(['2', '7', '10', '15']);
      expect(round1[2].athleteIds).toEqual(['3', '6', '11', '14']);
      expect(round1[3].athleteIds).toEqual(['4', '5', '12', '13']);

      round1[0].participants = [
        { athleteId: round1[0].athleteIds[0], placeInHeat: 1 },
        { athleteId: round1[0].athleteIds[1], placeInHeat: 2 },
        { athleteId: round1[0].athleteIds[2], placeInHeat: 3 },
        { athleteId: round1[0].athleteIds[3], placeInHeat: 4 },
      ];

      round1[1].participants = [
        { athleteId: round1[1].athleteIds[0], placeInHeat: 1 },
        { athleteId: round1[1].athleteIds[1], placeInHeat: 2 },
        { athleteId: round1[1].athleteIds[2], placeInHeat: 3 },
        { athleteId: round1[1].athleteIds[3], placeInHeat: 4 },
      ];

      round1[2].participants = [
        { athleteId: round1[2].athleteIds[0], placeInHeat: 1 },
        { athleteId: round1[2].athleteIds[1], placeInHeat: 2 },
        { athleteId: round1[2].athleteIds[2], placeInHeat: 3 },
        { athleteId: round1[2].athleteIds[3], placeInHeat: 4 },
      ];

      round1[3].participants = [
        { athleteId: round1[3].athleteIds[0], placeInHeat: 1 },
        { athleteId: round1[3].athleteIds[1], placeInHeat: 2 },
        { athleteId: round1[3].athleteIds[2], placeInHeat: 3 },
        { athleteId: round1[3].athleteIds[3], placeInHeat: 4 },
      ];

      // round2: верхняя и нижняя сетка из результатов round1
      const { upperIds, lowerIds } = Pairs.getFromRound(round1);

      expect(upperIds).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      expect(lowerIds).toEqual(['9', '10', '11', '12', '13', '14', '15', '16']);

      const round2Upper = Pairs.buildHeatsFromParticipantIds(upperIds, boatClass);
      const round2Lower = Pairs.buildHeatsFromParticipantIds(lowerIds, boatClass);

      expect(round2Upper).toHaveLength(2);
      expect(round2Lower).toHaveLength(2);
      expect(round2Upper[0].athleteIds).toEqual(['1', '4', '5', '8']);
      expect(round2Upper[1].athleteIds).toEqual(['2', '3', '6', '7']);
      expect(round2Lower[0].athleteIds).toEqual(['9', '12', '13', '16']);
      expect(round2Lower[1].athleteIds).toEqual(['10', '11', '14', '15']);

      // Заполняем места во втором туре по порядку внутри каждого хита (после проверки id)
      round2Upper[0].participants = [
        { athleteId: round2Upper[0].athleteIds[0], placeInHeat: 1 },
        { athleteId: round2Upper[0].athleteIds[1], placeInHeat: 2 },
        { athleteId: round2Upper[0].athleteIds[2], placeInHeat: 3 },
        { athleteId: round2Upper[0].athleteIds[3], placeInHeat: 4 },
      ];

      round2Upper[1].participants = [
        { athleteId: round2Upper[1].athleteIds[0], placeInHeat: 1 },
        { athleteId: round2Upper[1].athleteIds[1], placeInHeat: 2 },
        { athleteId: round2Upper[1].athleteIds[2], placeInHeat: 3 },
        { athleteId: round2Upper[1].athleteIds[3], placeInHeat: 4 },
      ];

      round2Lower[0].participants = [
        { athleteId: round2Lower[0].athleteIds[0], placeInHeat: 1 },
        { athleteId: round2Lower[0].athleteIds[1], placeInHeat: 2 },
        { athleteId: round2Lower[0].athleteIds[2], placeInHeat: 3 },
        { athleteId: round2Lower[0].athleteIds[3], placeInHeat: 4 },
      ];

      round2Lower[1].participants = [
        { athleteId: round2Lower[1].athleteIds[0], placeInHeat: 1 },
        { athleteId: round2Lower[1].athleteIds[1], placeInHeat: 2 },
        { athleteId: round2Lower[1].athleteIds[2], placeInHeat: 3 },
        { athleteId: round2Lower[1].athleteIds[3], placeInHeat: 4 },
      ];

      const crossHeats = {
        [boatClass]: {
          round1,
          round2Upper,
          round2Lower,
        },
      };
    });
  });
});

