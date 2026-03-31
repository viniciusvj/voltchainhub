/** Maps OpenEMS channel IDs to domain concepts */
export const CHANNEL_MAP = {
  production: '_sum/ProductionActivePower',
  consumption: '_sum/ConsumptionActivePower',
  grid: '_sum/GridActivePower',
  soc: 'ess0/Soc',
} as const;

export type ChannelKey = keyof typeof CHANNEL_MAP;
