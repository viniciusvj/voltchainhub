import { DeviceStats }    from '@/components/devices/device-stats';
import { DeviceList }     from '@/components/devices/device-list';
import { DeviceReadings } from '@/components/devices/device-readings';
import { RegisterDevice } from '@/components/devices/register-device';
import { PageHeader }     from '@/components/page-header';

export const metadata = {
  title: 'Dispositivos | VoltchainHub',
  description: 'Gerencie seus nós ESP32-S3 e monitore leituras de energia em tempo real.',
};

export default function DevicesPage() {
  return (
    <div className="space-y-6 max-w-screen-2xl">

      {/* Page heading */}
      <PageHeader titleKey="page.devices.title" subKey="page.devices.sub" />

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
