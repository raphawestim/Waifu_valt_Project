import type { UserGame, UserGameMetadata } from '../types/games.types';

export function getGameMetadata(game?: UserGame | null): UserGameMetadata {
  return (game?.metadata || {}) as UserGameMetadata;
}

export function getPreferredGameImage(game: UserGame): string | undefined {
  const steam = getGameMetadata(game).steam;
  return steam?.heroUrl || steam?.coverUrl || game.coverUrl;
}

export function getSteamLogoUrl(game?: UserGame | null): string | undefined {
  return getGameMetadata(game).steam?.logoUrl;
}
