/**
 * Константы ключей хранилища и идентификаторов.
 */

const STORAGE_KEY = 'snowcontest_data';
const PUBLICATION_KEY = 'snowcontest_publication';

const TAB_IDS = ['qualification', 'pairs', 'stage1', 'heats', 'final'];

const BOAT_CLASS_TO_HASH = { 'К1М': 'K1M', 'К1Ж': 'K1W', 'П1М': 'P1M', 'П1Ж': 'P1W' };

const CLUB_COLUMN_HEADER = 'Город';

if (typeof window !== 'undefined') {
  window.SnowContestConstants = {
    STORAGE_KEY,
    PUBLICATION_KEY,
    TAB_IDS,
    BOAT_CLASS_TO_HASH,
    CLUB_COLUMN_HEADER
  };
}
