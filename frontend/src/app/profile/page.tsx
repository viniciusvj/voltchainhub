import { WalletInfo }       from '@/components/profile/wallet-info';
import { PortfolioSummary } from '@/components/profile/portfolio-summary';
import { ProsumidorStats }  from '@/components/profile/prosumidor-stats';
import { ActivityFeed }     from '@/components/profile/activity-feed';

export const metadata = {
  title: 'Perfil | VoltchainHub',
  description: 'Sua carteira e estatísticas de prosumidor na plataforma VoltchainHub.',
};

export default function ProfilePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Perfil</h1>
        <p className="text-sm text-gray-400 mt-1">
          Sua carteira e estatísticas de prosumidor
        </p>
      </div>

      {/* Top row — WalletInfo + PortfolioSummary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WalletInfo />
        <PortfolioSummary />
      </div>

      {/* Bottom row — ProsumidorStats + ActivityFeed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProsumidorStats />
        <ActivityFeed />
      </div>
    </div>
  );
}
