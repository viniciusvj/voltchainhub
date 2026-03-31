export interface Device {
  id: string;
  publicKeyHex: string;
  owner: string;
  ratedCapacityWh: number;
  deviceType: 'solar' | 'battery' | 'load' | 'ev_charger';
  status: 'active' | 'suspended' | 'pending';
  registeredAt: number;
}
