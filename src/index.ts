/**
 * lumina-gem — public entry point
 *
 * Everything a consumer needs is re-exported from here.
 */

export { LuminaRenderer, createGem }       from './renderer';
export type { LuminaOptions }              from './renderer';

export { stringToDNA, derive }             from './hash';
export type { GemDNA }                     from './hash';

export { buildGeometry, listCuts }          from './geometries/index';
export type { GemCut }                     from './geometries/index';
