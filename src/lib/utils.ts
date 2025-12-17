/**
 * @deprecated This file is kept for backward compatibility.
 * Please import from the specific domain modules:
 * - `~/lib/common/utils` for cn()
 * - `~/lib/blockchain/utils` for blockchain utilities
 * - `~/lib/images/utils` for image utilities
 * - `~/lib/movies/utils` for movie utilities
 * - `~/lib/farcaster/metadata` for Farcaster metadata
 */

// Re-export for backward compatibility
export { cn } from './common/utils';
export { formatCELOBalance, hasSufficientCELOForGas } from './blockchain/utils';
export {
  ensureFullPosterUrl,
  isTmdbRelativePath,
  convertTmdbPathToUrl,
  filterMoviesWithPosters,
  hasValidPoster,
  getMoviesWithPosterFallback
} from './images/utils';
export {
  getContractIdForMovie,
  getMoviesWithDerivedContractIds
} from './movies/utils';
export { getFarcasterMetadata } from './farcaster/metadata';
