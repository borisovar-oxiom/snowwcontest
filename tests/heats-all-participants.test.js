/**
 * Тесты хитов кросса для случая с десятью участниками одного класса.
 * allHeatsFilled не проверяется по запросу.
 */
import { describe, it, expect } from 'vitest';

const Pairs = window.SnowContestAdminPairs;
const Heats = window.SnowContestHeatsShared;

describe('heats — разное количество участников одного класса', () => {
  const boatClass = 'К1М';

  describe('buildHeatsFromParticipantIds1', () => {
    it('для 1', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1']);
    });
  });

  describe('buildHeatsFromParticipantIds2', () => {
    it('для 2', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','2']);
    });
  });

  describe('buildHeatsFromParticipantIds3', () => {
    it('для 3', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','2','3']);
    });
  });

  describe('buildHeatsFromParticipantIds4', () => {
    it('для 4', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','2','3','4']);
    });
  });

  describe('buildHeatsFromParticipantIds5', () => {
    it('для 5', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','4','5']);
      expect(heats[1].athleteIds).toEqual(['2','3']);
    });
  });

  describe('buildHeatsFromParticipantIds6', () => {
    it('для 6', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','4','5']);
      expect(heats[1].athleteIds).toEqual(['2','3','6']);
    });
  });

  describe('buildHeatsFromParticipantIds7', () => {
    it('для 7', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','4','5']);
      expect(heats[1].athleteIds).toEqual(['2','3','6','7']);
    });
  });

  describe('buildHeatsFromParticipantIds8', () => {
    it('для 8', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','4','5','8']);
      expect(heats[1].athleteIds).toEqual(['2','3','6','7']);
    });
  });

  describe('buildHeatsFromParticipantIds9', () => {
    it('для 9', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9'], boatClass);
      expect(heats[0].athleteIds).toEqual(['1','6','7']);
      expect(heats[1].athleteIds).toEqual(['2','5','8']);
      expect(heats[2].athleteIds).toEqual(['3','4','9']);
    });
  });

  describe('buildHeatsFromParticipantIds10', () => {
    it('для 10', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9','10'], boatClass);
      expect(heats).toHaveLength(3);
      expect(heats[0].athleteIds).toEqual(['1', '6', '7']);
      expect(heats[1].athleteIds).toEqual(['2', '5', '8']);
      expect(heats[2].athleteIds).toEqual(['3', '4', '9', '10']);
    });
  });

  describe('buildHeatsFromParticipantIds11', () => {
    it('для 11', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9','10','11'], boatClass);
      expect(heats).toHaveLength(3);
      expect(heats[0].athleteIds).toEqual(['1', '6', '7']);
      expect(heats[1].athleteIds).toEqual(['2', '5', '8', '11']);
      expect(heats[2].athleteIds).toEqual(['3', '4', '9', '10']);
    });
  });

  describe('buildHeatsFromParticipantIds12', () => {
    it('для 12', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9','10','11','12'], boatClass);
      expect(heats).toHaveLength(3);
      expect(heats[0].athleteIds).toEqual(['1', '6', '7', '12']);
      expect(heats[1].athleteIds).toEqual(['2', '5', '8', '11']);
      expect(heats[2].athleteIds).toEqual(['3', '4', '9', '10']);
    });
  });

  describe('buildHeatsFromParticipantIds13', () => {
    it('для 13', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9','10','11','12','13'], boatClass);
      expect(heats).toHaveLength(4);
      expect(heats[0].athleteIds).toEqual(['1', '8', '9']);
      expect(heats[1].athleteIds).toEqual(['2', '7', '10']);
      expect(heats[2].athleteIds).toEqual(['3', '6', '11']);
      expect(heats[3].athleteIds).toEqual(['4', '5', '12', '13']);
    });
  });

  describe('buildHeatsFromParticipantIds14', () => {
    it('для 14', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9','10','11','12','13','14'], boatClass);
      expect(heats).toHaveLength(4);
      expect(heats[0].athleteIds).toEqual(['1', '8', '9']);
      expect(heats[1].athleteIds).toEqual(['2', '7', '10']);
      expect(heats[2].athleteIds).toEqual(['3', '6', '11', '14']);
      expect(heats[3].athleteIds).toEqual(['4', '5', '12', '13']);
    });
  });

  describe('buildHeatsFromParticipantIds15', () => {
    it('для 15', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'], boatClass);
      expect(heats).toHaveLength(4);
      expect(heats[0].athleteIds).toEqual(['1', '8', '9']);
      expect(heats[1].athleteIds).toEqual(['2', '7', '10', '15']);
      expect(heats[2].athleteIds).toEqual(['3', '6', '11', '14']);
      expect(heats[3].athleteIds).toEqual(['4', '5', '12', '13']);
    });
  });

  describe('buildHeatsFromParticipantIds16', () => {
    it('для 16', () => {
      const heats = Pairs.buildHeatsFromParticipantIds(['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'], boatClass);
      expect(heats).toHaveLength(4);
      expect(heats[0].athleteIds).toEqual(['1', '8', '9', '16']);
      expect(heats[1].athleteIds).toEqual(['2', '7', '10', '15']);
      expect(heats[2].athleteIds).toEqual(['3', '6', '11', '14']);
      expect(heats[3].athleteIds).toEqual(['4', '5', '12', '13']);
    });
  });
});