// state.ts
export const activeTimers = new Map<string, NodeJS.Timeout>();
export const playerClickHistory = new Map<string, number>();
export const activePowerups = new Map<
  string,
  { type: string; expiresAt: number }
>();
export const playerPowerupCooldown = new Map<string, number>();
export const playerLastSyncTime = new Map<string, number>();
export const flaggedPlayers = new Set<string>();
