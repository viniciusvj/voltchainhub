export interface ChannelValues {
  productionActivePowerW: number;
  consumptionActivePowerW: number;
  gridActivePowerW: number;
  socPercent: number | null;
}

export interface OpenEmsGateway {
  fetchChannelValues(edgeId: string): Promise<ChannelValues>;
  isConnected(): boolean;
}
