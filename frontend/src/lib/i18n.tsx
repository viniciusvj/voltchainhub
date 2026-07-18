'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Lightweight client-side i18n for the app chrome (nav/topbar/footer).
// v1 covers the persistent navigation frame in PT/EN/ES; page bodies are still
// PT and are the next extension. Locale persists in localStorage.

export type Locale = 'pt' | 'en' | 'es'

type Entry = { pt: string; en: string; es: string }
type Dict = Record<string, Entry>

// `satisfies` (nao `: Dict`) preserva o tipo literal do objeto, entao
// `keyof typeof DICT` vira a uniao das chaves reais e o t() valida chave em
// tempo de compilacao (chave inexistente = erro de build).
const DICT = {
  'nav.dashboard': { pt: 'Dashboard', en: 'Dashboard', es: 'Panel' },
  'nav.market': { pt: 'Marketplace', en: 'Marketplace', es: 'Mercado' },
  'nav.devices': { pt: 'Dispositivos', en: 'Devices', es: 'Dispositivos' },
  'nav.trades': { pt: 'Trades', en: 'Trades', es: 'Operaciones' },
  'nav.profile': { pt: 'Perfil', en: 'Profile', es: 'Perfil' },
  'nav.backToSite': { pt: 'Voltar ao site', en: 'Back to site', es: 'Volver al sitio' },
  'top.home': { pt: 'Início', en: 'Home', es: 'Inicio' },
  'top.whitepaper': { pt: 'Whitepaper', en: 'Whitepaper', es: 'Whitepaper' },
  'top.testnet': { pt: 'Testnet Amoy', en: 'Amoy testnet', es: 'Testnet Amoy' },
  'connect': { pt: 'Conectar Carteira', en: 'Connect Wallet', es: 'Conectar Cartera' },

  // Cabecalhos das paginas (titulo + subtitulo)
  'page.dashboard.title': { pt: 'Dashboard', en: 'Dashboard', es: 'Panel' },
  'page.dashboard.sub': { pt: 'Visão geral da sua energia descentralizada', en: 'Overview of your decentralized energy', es: 'Vista general de tu energía descentralizada' },
  'page.market.title': { pt: 'Marketplace de Energia', en: 'Energy Marketplace', es: 'Mercado de Energía' },
  'page.market.sub': { pt: 'Compre e venda energia P2P no mercado descentralizado', en: 'Buy and sell P2P energy on the decentralized market', es: 'Compra y vende energía P2P en el mercado descentralizado' },
  'page.devices.title': { pt: 'Dispositivos', en: 'Devices', es: 'Dispositivos' },
  'page.devices.sub': { pt: 'Gerencie seus nós ESP32-S3 e monitore leituras em tempo real', en: 'Manage your ESP32-S3 nodes and monitor readings in real time', es: 'Gestiona tus nodos ESP32-S3 y monitorea lecturas en tiempo real' },
  'page.trades.title': { pt: 'Trades P2P', en: 'P2P Trades', es: 'Operaciones P2P' },
  'page.trades.sub': { pt: 'Gerencie suas transações de energia peer-to-peer', en: 'Manage your peer-to-peer energy transactions', es: 'Gestiona tus transacciones de energía peer-to-peer' },
  'page.profile.title': { pt: 'Perfil', en: 'Profile', es: 'Perfil' },
  'page.profile.sub': { pt: 'Sua carteira e estatísticas de prosumidor', en: 'Your wallet and prosumer stats', es: 'Tu cartera y estadísticas de prosumidor' },

  // Abas de trades
  'tabs.myTrades': { pt: 'Meus trades', en: 'My trades', es: 'Mis operaciones' },
  'tabs.history': { pt: 'Histórico', en: 'History', es: 'Historial' },

  // Formulario de trade (comprar/vender)
  'form.buy': { pt: 'Comprar', en: 'Buy', es: 'Comprar' },
  'form.sell': { pt: 'Vender', en: 'Sell', es: 'Vender' },
  'form.limit': { pt: 'Ordem Limitada', en: 'Limit Order', es: 'Orden Limitada' },
  'form.market': { pt: 'Ordem de Mercado', en: 'Market Order', es: 'Orden de Mercado' },
  'form.connectPrompt': { pt: 'Conecte sua carteira para negociar energia', en: 'Connect your wallet to trade energy', es: 'Conecta tu cartera para negociar energía' },
  'form.price': { pt: 'Preço', en: 'Price', es: 'Precio' },
  'form.amount': { pt: 'Quantidade', en: 'Amount', es: 'Cantidad' },
  'form.decrease': { pt: 'Diminuir preço', en: 'Decrease price', es: 'Disminuir precio' },
  'form.increase': { pt: 'Aumentar preço', en: 'Increase price', es: 'Aumentar precio' },
  'form.seller': { pt: 'Vendedor', en: 'Seller', es: 'Vendedor' },
  'form.sellerAddr': { pt: '(endereço 0x)', en: '(0x address)', es: '(dirección 0x)' },
  'form.sellerHint': { pt: 'O vendedor precisa ter aprovado o vault e ter LuzTokens; senão a transação reverte.', en: 'The seller must have approved the vault and hold LuzTokens; otherwise the transaction reverts.', es: 'El vendedor debe haber aprobado el vault y tener LuzTokens; de lo contrario la transacción se revierte.' },
  'form.subtotal': { pt: 'Subtotal', en: 'Subtotal', es: 'Subtotal' },
  'form.protocolFee': { pt: 'Taxa protocolo (0,5%)', en: 'Protocol fee (0.5%)', es: 'Comisión del protocolo (0,5%)' },
  'form.estTotal': { pt: 'Total estimado', en: 'Estimated total', es: 'Total estimado' },
  'form.lockEscrow': { pt: 'Travar escrow (comprar)', en: 'Lock escrow (buy)', es: 'Bloquear escrow (comprar)' },
  'form.approveVault': { pt: 'Aprovar vault (vender)', en: 'Approve vault (sell)', es: 'Aprobar vault (vender)' },
  'form.txSent': { pt: 'Transação enviada, ver no PolygonScan', en: 'Transaction sent, view on PolygonScan', es: 'Transacción enviada, ver en PolygonScan' },
  'form.footer': { pt: 'Taxa do protocolo: 0,5% • Liquidação via EnergyVault (testnet Amoy)', en: 'Protocol fee: 0.5% • Settlement via EnergyVault (Amoy testnet)', es: 'Comisión del protocolo: 0,5% • Liquidación vía EnergyVault (testnet Amoy)' },
  'form.errSeller': { pt: 'Informe o endereço do vendedor (0x...).', en: 'Enter the seller address (0x...).', es: 'Ingresa la dirección del vendedor (0x...).' },
  'form.errTx': { pt: 'Falha na transação', en: 'Transaction failed', es: 'Falla en la transacción' },

  // Wizard de registro de dispositivo
  'dev.step.info': { pt: 'Informações', en: 'Information', es: 'Información' },
  'dev.step.attestation': { pt: 'Attestation', en: 'Attestation', es: 'Attestation' },
  'dev.step.confirm': { pt: 'Confirmação', en: 'Confirmation', es: 'Confirmación' },
  'dev.name': { pt: 'Nome do dispositivo', en: 'Device name', es: 'Nombre del dispositivo' },
  'dev.namePh': { pt: 'ex: Nó Solar Garagem', en: 'e.g. Garage Solar Node', es: 'ej: Nodo Solar Garaje' },
  'dev.deviceId': { pt: 'ID do Dispositivo (bytes32)', en: 'Device ID (bytes32)', es: 'ID del Dispositivo (bytes32)' },
  'dev.hexHint': { pt: 'Formato: 0x seguido de 64 hex chars', en: 'Format: 0x followed by 64 hex chars', es: 'Formato: 0x seguido de 64 hex chars' },
  'dev.pubX': { pt: 'Chave Pública X (bytes32)', en: 'Public Key X (bytes32)', es: 'Clave Pública X (bytes32)' },
  'dev.pubY': { pt: 'Chave Pública Y (bytes32)', en: 'Public Key Y (bytes32)', es: 'Clave Pública Y (bytes32)' },
  'dev.model': { pt: 'Modelo do inversor', en: 'Inverter model', es: 'Modelo del inversor' },
  'dev.modelPh': { pt: 'Selecione o modelo', en: 'Select the model', es: 'Selecciona el modelo' },
  'dev.other': { pt: 'Outro', en: 'Other', es: 'Otro' },
  'dev.capacity': { pt: 'Capacidade instalada (kW)', en: 'Installed capacity (kW)', es: 'Capacidad instalada (kW)' },
  'dev.location': { pt: 'Localização', en: 'Location', es: 'Ubicación' },
  'dev.locationPh': { pt: 'ex: Belo Horizonte, MG', en: 'e.g. Belo Horizonte, Brazil', es: 'ej: Belo Horizonte, Brasil' },
  'dev.ipfs': { pt: 'Metadata IPFS CID', en: 'IPFS CID metadata', es: 'Metadata IPFS CID' },
  'dev.optional': { pt: '(opcional)', en: '(optional)', es: '(opcional)' },
  'dev.deviceIdShort': { pt: 'ID do Dispositivo', en: 'Device ID', es: 'ID del Dispositivo' },
  'dev.pubXShort': { pt: 'Chave Pública X', en: 'Public Key X', es: 'Clave Pública X' },
  'dev.pubYShort': { pt: 'Chave Pública Y', en: 'Public Key Y', es: 'Clave Pública Y' },
  'dev.attestTitle': { pt: 'Attestation on-chain', en: 'On-chain attestation', es: 'Attestation on-chain' },
  'dev.attestPre': { pt: 'O contrato ', en: 'The ', es: 'El contrato ' },
  'dev.attestPost': { pt: ' irá verificar o par de chaves públicas (X, Y) e vincular o ID do dispositivo ao seu endereço de carteira. Esta etapa não envolve ativos, apenas a identidade criptográfica do ESP32-S3.', en: ' contract will verify the public key pair (X, Y) and bind the device ID to your wallet address. This step involves no assets, only the ESP32-S3 cryptographic identity.', es: ' verificará el par de claves públicas (X, Y) y vinculará el ID del dispositivo a tu dirección de cartera. Este paso no involucra activos, solo la identidad criptográfica del ESP32-S3.' },
  'dev.attestWarn': { pt: 'Certifique-se de que o firmware do ESP32-S3 está configurado com as mesmas chaves antes de confirmar. Chaves incorretas exigirão um novo registro.', en: 'Make sure the ESP32-S3 firmware is configured with the same keys before confirming. Incorrect keys will require a new registration.', es: 'Asegúrate de que el firmware del ESP32-S3 esté configurado con las mismas claves antes de confirmar. Claves incorrectas exigirán un nuevo registro.' },
  'dev.sumName': { pt: 'Nome', en: 'Name', es: 'Nombre' },
  'dev.sumModel': { pt: 'Modelo', en: 'Model', es: 'Modelo' },
  'dev.sumCapacity': { pt: 'Capacidade', en: 'Capacity', es: 'Capacidad' },
  'dev.sumLocation': { pt: 'Localização', en: 'Location', es: 'Ubicación' },
  'dev.sumIpfs': { pt: 'IPFS CID', en: 'IPFS CID', es: 'IPFS CID' },
  'dev.notProvided': { pt: 'Não informado', en: 'Not provided', es: 'No informado' },
  'dev.txInfo': { pt: 'A transação será enviada para a Polygon Amoy Testnet. Custo estimado: < 0,01 MATIC. Aguarde a confirmação do bloco antes de fechar esta janela.', en: 'The transaction will be sent to Polygon Amoy Testnet. Estimated cost: < 0.01 MATIC. Wait for block confirmation before closing this window.', es: 'La transacción se enviará a Polygon Amoy Testnet. Costo estimado: < 0,01 MATIC. Espera la confirmación del bloque antes de cerrar esta ventana.' },
  'dev.sending': { pt: 'Enviando transação…', en: 'Sending transaction…', es: 'Enviando transacción…' },
  'dev.title': { pt: 'Registrar Novo Dispositivo', en: 'Register New Device', es: 'Registrar Nuevo Dispositivo' },
  'dev.subtitle': { pt: 'Conecte um ESP32-S3 à rede VoltchainHub via contrato DeviceRegistry', en: 'Connect an ESP32-S3 to the VoltchainHub network via the DeviceRegistry contract', es: 'Conecta un ESP32-S3 a la red VoltchainHub vía contrato DeviceRegistry' },
  'dev.walletNotConnected': { pt: 'Carteira não conectada', en: 'Wallet not connected', es: 'Cartera no conectada' },
  'dev.connectPrompt': { pt: 'Conecte sua carteira para registrar dispositivos', en: 'Connect your wallet to register devices', es: 'Conecta tu cartera para registrar dispositivos' },
  'dev.registered': { pt: 'Dispositivo registrado!', en: 'Device registered!', es: '¡Dispositivo registrado!' },
  'dev.addedSuffix': { pt: ' foi adicionado à rede com sucesso.', en: ' was successfully added to the network.', es: ' fue añadido a la red con éxito.' },
  'dev.viewTx': { pt: 'Ver transação no PolygonScan', en: 'View transaction on PolygonScan', es: 'Ver transacción en PolygonScan' },
  'dev.registerAnother': { pt: 'Registrar outro dispositivo', en: 'Register another device', es: 'Registrar otro dispositivo' },
  'dev.back': { pt: 'Voltar', en: 'Back', es: 'Volver' },
  'dev.next': { pt: 'Próximo', en: 'Next', es: 'Siguiente' },
  'dev.registering': { pt: 'Registrando…', en: 'Registering…', es: 'Registrando…' },
  'dev.registerOnchain': { pt: 'Registrar on-chain', en: 'Register on-chain', es: 'Registrar on-chain' },
  'dev.errName': { pt: 'Nome é obrigatório', en: 'Name is required', es: 'El nombre es obligatorio' },
  'dev.errDeviceId': { pt: 'ID do dispositivo é obrigatório', en: 'Device ID is required', es: 'El ID del dispositivo es obligatorio' },
  'dev.errBytes32': { pt: 'Deve ser 0x seguido de 64 hex chars', en: 'Must be 0x followed by 64 hex chars', es: 'Debe ser 0x seguido de 64 hex chars' },
  'dev.errPubX': { pt: 'Chave X é obrigatória', en: 'Key X is required', es: 'La clave X es obligatoria' },
  'dev.errBytes32fmt': { pt: 'Formato bytes32 inválido', en: 'Invalid bytes32 format', es: 'Formato bytes32 inválido' },
  'dev.errPubY': { pt: 'Chave Y é obrigatória', en: 'Key Y is required', es: 'La clave Y es obligatoria' },
  'dev.errModel': { pt: 'Selecione um modelo', en: 'Select a model', es: 'Selecciona un modelo' },
  'dev.errCapacity': { pt: 'Capacidade é obrigatória', en: 'Capacity is required', es: 'La capacidad es obligatoria' },
  'dev.errCapacityNum': { pt: 'Informe um valor numérico positivo', en: 'Enter a positive numeric value', es: 'Ingresa un valor numérico positivo' },
  'dev.errLocation': { pt: 'Localização é obrigatória', en: 'Location is required', es: 'La ubicación es obligatoria' },
  'dev.errSubmit': { pt: 'Falha ao enviar a transação', en: 'Failed to send the transaction', es: 'Falla al enviar la transacción' },

  // Card de onboarding do vendedor
  'sell.title': { pt: 'Vender energia', en: 'Sell energy', es: 'Vender energía' },
  'sell.subtitle': { pt: 'Habilite seus LuzTokens para escrow no vault', en: 'Enable your LuzTokens for escrow in the vault', es: 'Habilita tus LuzTokens para escrow en el vault' },
  'sell.balance': { pt: 'Seu saldo', en: 'Your balance', es: 'Tu saldo' },
  'sell.vaultApproved': { pt: 'Vault aprovado', en: 'Vault approved', es: 'Vault aprobado' },
  'sell.yes': { pt: 'Sim', en: 'Yes', es: 'Sí' },
  'sell.no': { pt: 'Não', en: 'No', es: 'No' },
  'sell.revoke': { pt: 'Revogar aprovação', en: 'Revoke approval', es: 'Revocar aprobación' },
  'sell.enable': { pt: 'Habilitar venda (aprovar vault)', en: 'Enable selling (approve vault)', es: 'Habilitar venta (aprobar vault)' },
  'sell.hint': { pt: 'Um comprador só consegue travar um trade com você depois desta aprovação.', en: 'A buyer can only lock a trade with you after this approval.', es: 'Un comprador solo puede bloquear una operación contigo tras esta aprobación.' },
} satisfies Dict

interface I18nCtx {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: keyof typeof DICT) => string
}

const Ctx = createContext<I18nCtx>({ locale: 'pt', setLocale: () => {}, t: (k) => DICT[k]?.pt ?? String(k) })

const isLocale = (v: string | null): v is Locale => v === 'pt' || v === 'en' || v === 'es'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  // Precedencia na carga: ?lang= na URL (deep-link compartilhavel) > localStorage
  // > padrao 'pt'. O parametro da URL tambem persiste no localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (isLocale(fromUrl)) {
      setLocaleState(fromUrl)
      try { localStorage.setItem('vch-locale', fromUrl) } catch {}
      return
    }
    try {
      const stored = localStorage.getItem('vch-locale')
      if (isLocale(stored)) setLocaleState(stored)
    } catch {}
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('vch-locale', l)
      // Reflete o idioma na URL sem recarregar, pra o link ficar compartilhavel.
      const u = new URL(window.location.href)
      u.searchParams.set('lang', l)
      window.history.replaceState({}, '', u)
    } catch {}
  }

  const t = (key: keyof typeof DICT) => DICT[key]?.[locale] ?? DICT[key]?.pt ?? String(key)

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
