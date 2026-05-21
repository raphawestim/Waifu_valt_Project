import React from 'react';
import { vaultRegistry, type VaultId } from '../../../data/vaultRegistry';
import { AuthMenu } from '../../../shared/auth/AuthMenu';
import type { User } from '../../../types';
import { VaultChoiceCard } from '../components/VaultChoiceCard';

interface TheVaultPortalProps {
  user: User | null;
  showNsfwCard?: boolean;
  onEnterVault: (vaultId: VaultId) => void;
  onLogin: () => void;
  onRegister: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

export const TheVaultPortal: React.FC<TheVaultPortalProps> = ({
  user,
  showNsfwCard = true,
  onEnterVault,
  onLogin,
  onRegister,
  onProfile,
  onLogout,
}) => {
  const visibleVaults = vaultRegistry.filter((vault) => vault.id !== 'nsfw' || showNsfwCard);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050a] text-white selection:bg-violet-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.2),transparent_34%),radial-gradient(circle_at_78%_20%,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#05050a_0%,#0b0713_52%,#05050a_100%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[96rem] flex-col justify-center px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <span className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-violet-100">
              The Vault Portal
            </span>
            <h1 className="mt-5 text-6xl font-black leading-none tracking-tight text-white sm:text-7xl lg:text-8xl">
              The Vault
            </h1>
            <p className="mt-5 text-2xl font-black tracking-tight text-gray-100">Choose your vault</p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
              A premium command center for games, TCG decks, manga/anime discovery, RPG campaigns, AI tooling and private vault workflows.
            </p>
          </div>
          <AuthMenu user={user} onLogin={onLogin} onRegister={onRegister} onProfile={onProfile} onLogout={onLogout} />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleVaults.map((vault) => (
            <VaultChoiceCard
              key={vault.id}
              title={vault.title}
              subtitle={vault.subtitle}
              description={
                vault.id === 'nsfw' && !user
                  ? 'Login is required before this private vault can be enabled.'
                  : vault.description
              }
              buttonLabel={vault.buttonLabel}
              accent={vault.accent}
              badge={vault.badge}
              status={vault.status}
              locked={vault.id === 'nsfw' && !user}
              onEnter={() => onEnterVault(vault.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export const TheValtPortal = TheVaultPortal;
