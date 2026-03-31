import { DeviceStats }    from '@/components/devices/device-stats';
import { DeviceList }     from '@/components/devices/device-list';
import { DeviceReadings } from '@/components/devices/device-readings';
import { RegisterDevice } from '@/components/devices/register-device';

export const metadata = {
  title: 'Dispositivos | VoltchainHub',
  description: 'Gerencie seus nós ESP32-S3 e monitore leituras de energia em tempo real.',
};

export default function DevicesPage() {
  return (
    <div className="space-y-6 max-w-screen-2xl">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dispositivos</h1>
        <p className="text-sm text-gray-400 mt-1">
          Gerencie seus nós ESP32-S3 e monitore leituras em tempo real
        </p>
      </div>

      {/* Summary stats bar */}
      <DeviceStats />

      {/* Device cards grid */}
      <DeviceList />

      {/* Real-time readings chart */}
      <DeviceReadings />

      {/* Register new device form */}
      <RegisterDevice />

    </div>
  );
}
