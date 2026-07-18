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

  // Cards do dashboard
  'db.balance.connect': { pt: 'Conecte sua carteira para ver seu saldo', en: 'Connect your wallet to see your balance', es: 'Conecta tu cartera para ver tu saldo' },
  'db.balance.title': { pt: 'Saldo LUZ Token', en: 'LUZ Token balance', es: 'Saldo LUZ Token' },
  'db.balance.source': { pt: 'LuzToken #1 na Amoy', en: 'LuzToken #1 on Amoy', es: 'LuzToken #1 en Amoy' },
  'db.market.title': { pt: 'Preço P2P', en: 'P2P price', es: 'Precio P2P' },
  'db.market.perKwh': { pt: 'por kWh', en: 'per kWh', es: 'por kWh' },
  'db.market.dayMin': { pt: 'Mínima do dia', en: 'Day low', es: 'Mínimo del día' },
  'db.market.dayMax': { pt: 'Máxima do dia', en: 'Day high', es: 'Máximo del día' },
  'db.stats.network': { pt: 'Rede', en: 'Network', es: 'Red' },
  'db.stats.testnet': { pt: 'testnet', en: 'testnet', es: 'testnet' },
  'db.stats.fee': { pt: 'Fee do protocolo', en: 'Protocol fee', es: 'Comisión del protocolo' },
  'db.stats.feeValue': { pt: '0,5%', en: '0.5%', es: '0,5%' },
  'db.stats.feeSub': { pt: 'swap atômico via Uniswap v3', en: 'atomic swap via Uniswap v3', es: 'swap atómico vía Uniswap v3' },
  'db.stats.devices': { pt: 'Dispositivos na rede', en: 'Devices on the network', es: 'Dispositivos en la red' },
  'db.stats.devicesSub': { pt: 'on-chain, DeviceRegistry', en: 'on-chain, DeviceRegistry', es: 'on-chain, DeviceRegistry' },
  'db.stats.contracts': { pt: 'Contratos verificados', en: 'Verified contracts', es: 'Contratos verificados' },
  'db.net.title': { pt: 'Rede VoltchainHub', en: 'VoltchainHub network', es: 'Red VoltchainHub' },
  'db.net.subtitle': { pt: 'Dados on-chain da testnet Amoy, em tempo real', en: 'Real-time on-chain data from the Amoy testnet', es: 'Datos on-chain de la testnet Amoy, en tiempo real' },
  'db.net.noApiPre': { pt: 'Métricas da rede ficam disponíveis quando a API estiver publicada (configure ', en: 'Network metrics become available once the API is published (set ', es: 'Las métricas de la red están disponibles cuando la API esté publicada (configura ' },
  'db.net.noApiPost': { pt: ').', en: ').', es: ').' },
  'db.net.loading': { pt: 'Carregando métricas…', en: 'Loading metrics…', es: 'Cargando métricas…' },
  'db.net.error': { pt: 'Não foi possível carregar as métricas.', en: 'Could not load the metrics.', es: 'No se pudieron cargar las métricas.' },
  'db.net.devices': { pt: 'Dispositivos registrados', en: 'Registered devices', es: 'Dispositivos registrados' },
  'db.net.luz': { pt: 'LuzTokens emitidos (kWh)', en: 'LuzTokens issued (kWh)', es: 'LuzTokens emitidos (kWh)' },
  'db.net.trades': { pt: 'Trades no vault', en: 'Trades in the vault', es: 'Operaciones en el vault' },
  'db.net.prefs': { pt: 'Preferências de pagamento', en: 'Payment preferences', es: 'Preferencias de pago' },
  'db.gov.title': { pt: 'Governança de pagamento', en: 'Payment governance', es: 'Gobernanza de pago' },
  'db.gov.subtitle': { pt: 'Moeda de recebimento escolhida pelos prosumidores', en: 'Payout currency chosen by prosumers', es: 'Moneda de cobro elegida por los prosumidores' },
  'db.gov.noApiPre': { pt: 'Dados de governança ficam disponíveis quando a API do backend estiver publicada (configure ', en: 'Governance data becomes available once the backend API is published (set ', es: 'Los datos de gobernanza están disponibles cuando la API del backend esté publicada (configura ' },
  'db.gov.loading': { pt: 'Carregando estatísticas…', en: 'Loading stats…', es: 'Cargando estadísticas…' },
  'db.gov.error': { pt: 'Não foi possível carregar as estatísticas.', en: 'Could not load the stats.', es: 'No se pudieron cargar las estadísticas.' },
  'db.gov.prefsSet': { pt: 'preferências definidas', en: 'preferences set', es: 'preferencias definidas' },
  'db.gov.avgSlippage': { pt: 'Slippage máximo médio:', en: 'Average max slippage:', es: 'Slippage máximo promedio:' },
  'db.gov.catNative': { pt: 'Nativo/wrapped', en: 'Native/wrapped', es: 'Nativo/wrapped' },
  'db.gov.catOther': { pt: 'Outros', en: 'Other', es: 'Otros' },
  'db.tx.title': { pt: 'Transações Recentes', en: 'Recent Transactions', es: 'Transacciones Recientes' },
  'db.tx.viewAll': { pt: 'Ver todas', en: 'View all', es: 'Ver todas' },
  'db.tx.soldTo': { pt: 'Venda para', en: 'Sale to', es: 'Venta a' },
  'db.tx.boughtFrom': { pt: 'Compra de', en: 'Purchase from', es: 'Compra de' },
  'db.tx.settled': { pt: 'Liquidada', en: 'Settled', es: 'Liquidada' },
  'db.tx.pending': { pt: 'Pendente', en: 'Pending', es: 'Pendiente' },
  'db.tx.escrow': { pt: 'Em Escrow', en: 'In Escrow', es: 'En Escrow' },
  'db.chart.title': { pt: 'Geração vs. Consumo', en: 'Generation vs. Consumption', es: 'Generación vs. Consumo' },
  'db.chart.subtitle': { pt: 'Energia em kWh por hora', en: 'Energy in kWh per hour', es: 'Energía en kWh por hora' },
  'db.chart.generation': { pt: 'Geração', en: 'Generation', es: 'Generación' },
  'db.chart.consumption': { pt: 'Consumo', en: 'Consumption', es: 'Consumo' },

  // Cards do perfil
  'pf.wallet.connectTitle': { pt: 'Conecte sua Carteira', en: 'Connect your Wallet', es: 'Conecta tu Cartera' },
  'pf.wallet.connectSub': { pt: 'Conecte sua carteira para ver detalhes, saldos e atividades do seu perfil de prosumidor.', en: 'Connect your wallet to see details, balances and activity of your prosumer profile.', es: 'Conecta tu cartera para ver detalles, saldos y actividad de tu perfil de prosumidor.' },
  'pf.wallet.title': { pt: 'Informações da Carteira', en: 'Wallet Details', es: 'Información de la Cartera' },
  'pf.wallet.copy': { pt: 'Copiar endereço', en: 'Copy address', es: 'Copiar dirección' },
  'pf.wallet.copied': { pt: 'Copiado!', en: 'Copied!', es: '¡Copiado!' },
  'pf.wallet.copiedMsg': { pt: 'Endereço copiado!', en: 'Address copied!', es: '¡Dirección copiada!' },
  'pf.wallet.maticBalance': { pt: 'Saldo MATIC', en: 'MATIC balance', es: 'Saldo MATIC' },
  'pf.wallet.allIds': { pt: 'kWh (todos os IDs)', en: 'kWh (all IDs)', es: 'kWh (todos los IDs)' },
  'pf.wallet.viewExplorer': { pt: 'Ver no Explorer', en: 'View on Explorer', es: 'Ver en el Explorer' },
  'pf.port.title': { pt: 'Portfólio de Tokens', en: 'Token Portfolio', es: 'Portafolio de Tokens' },
  'pf.port.solar': { pt: 'Solar', en: 'Solar', es: 'Solar' },
  'pf.port.battery': { pt: 'Bateria', en: 'Battery', es: 'Batería' },
  'pf.port.wind': { pt: 'Eólico', en: 'Wind', es: 'Eólico' },
  'pf.stats.title': { pt: 'Estatísticas de Prosumidor', en: 'Prosumer Stats', es: 'Estadísticas de Prosumidor' },
  'pf.stats.stars': { pt: 'estrelas', en: 'stars', es: 'estrellas' },
  'pf.stats.memberSince': { pt: 'Membro desde', en: 'Member since', es: 'Miembro desde' },
  'pf.stats.totalGenerated': { pt: 'Total Gerado', en: 'Total Generated', es: 'Total Generado' },
  'pf.stats.totalSold': { pt: 'Total Vendido', en: 'Total Sold', es: 'Total Vendido' },
  'pf.stats.totalBought': { pt: 'Total Comprado', en: 'Total Bought', es: 'Total Comprado' },
  'pf.stats.totalRevenue': { pt: 'Receita Total', en: 'Total Revenue', es: 'Ingresos Totales' },
  'pf.stats.totalSavings': { pt: 'Economia Total', en: 'Total Savings', es: 'Ahorro Total' },
  'pf.stats.completedTrades': { pt: 'Trades Concluídas', en: 'Completed Trades', es: 'Operaciones Completadas' },
  'pf.stats.registeredDevices': { pt: 'Dispositivos Registrados', en: 'Registered Devices', es: 'Dispositivos Registrados' },
  'pf.stats.averageUptime': { pt: 'Uptime Médio', en: 'Average Uptime', es: 'Uptime Promedio' },
  'pf.stats.reputation': { pt: 'Reputação', en: 'Reputation', es: 'Reputación' },
  'pf.activity.title': { pt: 'Atividade Recente', en: 'Recent Activity', es: 'Actividad Reciente' },
  'pf.activity.events': { pt: 'eventos', en: 'events', es: 'eventos' },
  'pf.activity.viewTx': { pt: 'Ver transação', en: 'View transaction', es: 'Ver transacción' },
  'pf.activity.less': { pt: 'Ver menos', en: 'Show less', es: 'Ver menos' },
  'pf.activity.more': { pt: 'Ver mais', en: 'Show more', es: 'Ver más' },
  'pf.activity.remaining': { pt: 'restantes', en: 'remaining', es: 'restantes' },

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

  // ── Market: livro de ordens ─────────────────────────────────────────────────
  'mk.ob.title': { pt: 'Livro de Ordens', en: 'Order Book', es: 'Libro de Órdenes' },
  'mk.ob.price': { pt: 'Preço (R$)', en: 'Price (R$)', es: 'Precio (R$)' },
  'mk.ob.qty': { pt: 'Qtd (kWh)', en: 'Qty (kWh)', es: 'Cant. (kWh)' },
  'mk.ob.total': { pt: 'Total (R$)', en: 'Total (R$)', es: 'Total (R$)' },
  'mk.ob.spread': { pt: 'Spread', en: 'Spread', es: 'Spread' },

  // ── Market: grafico de preco ────────────────────────────────────────────────
  'mk.pc.title': { pt: 'Preço P2P de Energia', en: 'P2P Energy Price', es: 'Precio P2P de Energía' },
  'mk.pc.high': { pt: 'Máxima', en: 'High', es: 'Máximo' },
  'mk.pc.low': { pt: 'Mínima', en: 'Low', es: 'Mínimo' },
  'mk.pc.avg': { pt: 'Média', en: 'Average', es: 'Media' },

  // ── Market: clearing info ───────────────────────────────────────────────────
  'mk.ci.next': { pt: 'Próximo Clearing', en: 'Next Clearing', es: 'Próximo Clearing' },
  'mk.ci.lastPrice': { pt: 'Preço Último Clearing', en: 'Last Clearing Price', es: 'Precio Último Clearing' },
  'mk.ci.settledVolume': { pt: 'Volume Liquidado', en: 'Settled Volume', es: 'Volumen Liquidado' },
  'mk.ci.activeAgents': { pt: 'Agentes Ativos', en: 'Active Agents', es: 'Agentes Activos' },
  'mk.ci.cycleNo': { pt: 'Ciclo nº', en: 'Cycle No.', es: 'Ciclo n.º' },
  'mk.ci.currentCycle': { pt: 'Ciclo atual', en: 'Current cycle', es: 'Ciclo actual' },
  'mk.ci.done': { pt: 'concluído', en: 'complete', es: 'completado' },

  // ── Market: historico de clearings ──────────────────────────────────────────
  'mk.mh.title': { pt: 'Histórico de Clearings', en: 'Clearing History', es: 'Historial de Clearings' },
  'mk.mh.subtitle': { pt: 'Últimas 10 liquidações', en: 'Last 10 settlements', es: 'Últimas 10 liquidaciones' },
  'mk.mh.time': { pt: 'Horário', en: 'Time', es: 'Hora' },
  'mk.mh.price': { pt: 'Preço Equilíbrio', en: 'Clearing Price', es: 'Precio de Equilibrio' },
  'mk.mh.volume': { pt: 'Volume', en: 'Volume', es: 'Volumen' },
  'mk.mh.agents': { pt: 'Agentes', en: 'Agents', es: 'Agentes' },
  'mk.mh.cycle': { pt: 'Ciclo', en: 'Cycle', es: 'Ciclo' },
  'mk.mh.status': { pt: 'Status', en: 'Status', es: 'Estado' },
  'mk.mh.settled': { pt: 'Liquidado', en: 'Settled', es: 'Liquidado' },

  // ── Trades: rotulos compartilhados ──────────────────────────────────────────
  'tr.purchase': { pt: 'Compra', en: 'Buy', es: 'Compra' },
  'tr.sale': { pt: 'Venda', en: 'Sell', es: 'Venta' },

  // ── Trades: estatisticas ────────────────────────────────────────────────────
  'tr.ts.activeEscrows': { pt: 'Escrows Ativos', en: 'Active Escrows', es: 'Escrows Activos' },
  'tr.ts.volume24h': { pt: 'Volume 24h', en: '24h Volume', es: 'Volumen 24h' },
  'tr.ts.openDisputes': { pt: 'Disputas Abertas', en: 'Open Disputes', es: 'Disputas Abiertas' },

  // ── Trades: wizard de nova trade ────────────────────────────────────────────
  'tr.nt.newTrade': { pt: 'Nova Trade', en: 'New Trade', es: 'Nueva Operación' },
  'tr.nt.newTradeSub': { pt: 'Configure e publique uma oferta de energia P2P', en: 'Set up and publish a P2P energy offer', es: 'Configura y publica una oferta de energía P2P' },
  'tr.nt.stepType': { pt: 'Tipo', en: 'Type', es: 'Tipo' },
  'tr.nt.stepDetails': { pt: 'Detalhes', en: 'Details', es: 'Detalles' },
  'tr.nt.stepConfirm': { pt: 'Confirmar', en: 'Confirm', es: 'Confirmar' },
  'tr.nt.selectDirection': { pt: 'Selecione a direção da sua trade', en: 'Select your trade direction', es: 'Selecciona la dirección de tu operación' },
  'tr.nt.buyEnergy': { pt: 'Comprar Energia', en: 'Buy Energy', es: 'Comprar Energía' },
  'tr.nt.buyDesc': { pt: 'Adquira energia de produtores da rede P2P', en: 'Buy energy from P2P network producers', es: 'Adquiere energía de productores de la red P2P' },
  'tr.nt.sellEnergy': { pt: 'Vender Energia', en: 'Sell Energy', es: 'Vender Energía' },
  'tr.nt.sellDesc': { pt: 'Venda seu excedente de energia na rede P2P', en: 'Sell your surplus energy on the P2P network', es: 'Vende tu excedente de energía en la red P2P' },
  'tr.nt.energyAmount': { pt: 'Quantidade de energia', en: 'Energy amount', es: 'Cantidad de energía' },
  'tr.nt.pricePerKwh': { pt: 'Preço por kWh (R$)', en: 'Price per kWh (R$)', es: 'Precio por kWh (R$)' },
  'tr.nt.deliveryDeadline': { pt: 'Prazo de entrega', en: 'Delivery deadline', es: 'Plazo de entrega' },
  'tr.nt.sourcePref': { pt: 'Preferência de fonte', en: 'Source preference', es: 'Preferencia de fuente' },
  'tr.nt.any': { pt: 'Qualquer', en: 'Any', es: 'Cualquiera' },
  'tr.nt.dl5': { pt: '5 minutos', en: '5 minutes', es: '5 minutos' },
  'tr.nt.dl15': { pt: '15 minutos', en: '15 minutes', es: '15 minutos' },
  'tr.nt.dl30': { pt: '30 minutos', en: '30 minutes', es: '30 minutos' },
  'tr.nt.dl1h': { pt: '1 hora', en: '1 hour', es: '1 hora' },
  'tr.nt.tradeSummary': { pt: 'Resumo da trade', en: 'Trade summary', es: 'Resumen de la operación' },
  'tr.nt.pricePerKwhShort': { pt: 'Preço/kWh', en: 'Price/kWh', es: 'Precio/kWh' },
  'tr.nt.deadline': { pt: 'Prazo', en: 'Deadline', es: 'Plazo' },
  'tr.nt.source': { pt: 'Fonte', en: 'Source', es: 'Fuente' },
  'tr.nt.valueBreakdown': { pt: 'Detalhamento de valores', en: 'Value breakdown', es: 'Desglose de valores' },
  'tr.nt.platformFee': { pt: 'Taxa da plataforma (0,5%)', en: 'Platform fee (0.5%)', es: 'Comisión de la plataforma (0,5%)' },
  'tr.nt.totalToPay': { pt: 'Total a pagar', en: 'Total to pay', es: 'Total a pagar' },
  'tr.nt.totalToReceive': { pt: 'Total a receber', en: 'Total to receive', es: 'Total a recibir' },
  'tr.nt.walletWarn': { pt: 'Conecte sua carteira para criar a trade. O contrato de escrow exige uma assinatura de transação na rede Polygon.', en: 'Connect your wallet to create the trade. The escrow contract requires a transaction signature on the Polygon network.', es: 'Conecta tu cartera para crear la operación. El contrato de escrow requiere una firma de transacción en la red Polygon.' },
  'tr.nt.escrowInfo': { pt: 'Os fundos serão bloqueados em escrow no contrato inteligente até a confirmação de entrega ou expiração do prazo.', en: 'Funds will be locked in escrow in the smart contract until delivery confirmation or deadline expiration.', es: 'Los fondos se bloquearán en escrow en el contrato inteligente hasta la confirmación de entrega o el vencimiento del plazo.' },
  'tr.nt.createTrade': { pt: 'Criar Trade', en: 'Create Trade', es: 'Crear Operación' },
  'tr.nt.tradeCreated': { pt: 'Trade criada!', en: 'Trade created!', es: '¡Operación creada!' },
  'tr.nt.escrowRegistered': { pt: 'Seu escrow foi registrado na blockchain. Aguardando contraparte.', en: 'Your escrow has been registered on the blockchain. Waiting for the counterparty.', es: 'Tu escrow fue registrado en la blockchain. Esperando a la contraparte.' },

  // ── Trades: historico ───────────────────────────────────────────────────────
  'tr.th.date': { pt: 'Data', en: 'Date', es: 'Fecha' },
  'tr.th.type': { pt: 'Tipo', en: 'Type', es: 'Tipo' },
  'tr.th.counterparty': { pt: 'Contraparte', en: 'Counterparty', es: 'Contraparte' },
  'tr.th.total': { pt: 'Total', en: 'Total', es: 'Total' },
  'tr.th.status': { pt: 'Status', en: 'Status', es: 'Estado' },
  'tr.th.expired': { pt: 'Expirada', en: 'Expired', es: 'Expirada' },
  'tr.th.disputed': { pt: 'Disputada', en: 'Disputed', es: 'Disputada' },
  'tr.th.showing': { pt: 'Mostrando', en: 'Showing', es: 'Mostrando' },
  'tr.th.of': { pt: 'de', en: 'of', es: 'de' },

  // ── Trades: meus trades on-chain ────────────────────────────────────────────
  'tr.mt.subtitle': { pt: 'Trades do EnergyVault (últimos ~50k blocos) da sua carteira', en: 'EnergyVault trades (last ~50k blocks) from your wallet', es: 'Operaciones del EnergyVault (últimos ~50k bloques) de tu cartera' },
  'tr.mt.reload': { pt: 'Recarregar', en: 'Reload', es: 'Recargar' },
  'tr.mt.reading': { pt: 'Lendo trades on-chain…', en: 'Reading on-chain trades…', es: 'Leyendo operaciones on-chain…' },
  'tr.mt.empty': { pt: 'Nenhum trade encontrado para esta carteira.', en: 'No trades found for this wallet.', es: 'No se encontraron operaciones para esta cartera.' },
  'tr.mt.connectPrompt': { pt: 'Conecte a carteira para ver seus trades on-chain.', en: 'Connect your wallet to see your on-chain trades.', es: 'Conecta la cartera para ver tus operaciones on-chain.' },
  'tr.mt.errRead': { pt: 'Falha ao ler os trades', en: 'Failed to read trades', es: 'Error al leer las operaciones' },
  'tr.mt.youBuy': { pt: 'Você compra', en: 'You buy', es: 'Compras' },
  'tr.mt.youSell': { pt: 'Você vende', en: 'You sell', es: 'Vendes' },
  'tr.mt.sending': { pt: 'Enviando…', en: 'Sending…', es: 'Enviando…' },
  'tr.mt.confirmDelivery': { pt: 'Confirmar entrega', en: 'Confirm delivery', es: 'Confirmar entrega' },
  'tr.mt.settle': { pt: 'Liquidar', en: 'Settle', es: 'Liquidar' },
  'tr.mt.stLocked': { pt: 'Travado', en: 'Locked', es: 'Bloqueado' },
  'tr.mt.stDelivered': { pt: 'Entregue', en: 'Delivered', es: 'Entregado' },
  'tr.mt.stExpired': { pt: 'Expirado', en: 'Expired', es: 'Expirado' },
  'tr.mt.stDisputed': { pt: 'Disputado', en: 'Disputed', es: 'Disputado' },

  // ── Trades: modal de disputa ────────────────────────────────────────────────
  'tr.dm.title': { pt: 'Abrir Disputa', en: 'Open Dispute', es: 'Abrir Disputa' },
  'tr.dm.close': { pt: 'Fechar modal', en: 'Close modal', es: 'Cerrar modal' },
  'tr.dm.sent': { pt: 'Disputa enviada!', en: 'Dispute submitted!', es: '¡Disputa enviada!' },
  'tr.dm.sentDesc': { pt: 'Sua disputa foi registrada. Nossa equipe analisará dentro de 24h.', en: 'Your dispute has been registered. Our team will review it within 24h.', es: 'Tu disputa fue registrada. Nuestro equipo la analizará dentro de 24h.' },
  'tr.dm.tradeId': { pt: 'Trade ID:', en: 'Trade ID:', es: 'Trade ID:' },
  'tr.dm.reasonLabel': { pt: 'Motivo da disputa', en: 'Dispute reason', es: 'Motivo de la disputa' },
  'tr.dm.reasonNotDelivered': { pt: 'Energia não entregue', en: 'Energy not delivered', es: 'Energía no entregada' },
  'tr.dm.reasonWrongAmount': { pt: 'Quantidade incorreta', en: 'Wrong amount', es: 'Cantidad incorrecta' },
  'tr.dm.reasonReadingQuality': { pt: 'Qualidade da leitura', en: 'Reading quality', es: 'Calidad de la lectura' },
  'tr.dm.descLabel': { pt: 'Descrição detalhada', en: 'Detailed description', es: 'Descripción detallada' },
  'tr.dm.descPh': { pt: 'Descreva o problema com detalhes suficientes para análise...', en: 'Describe the problem with enough detail for review...', es: 'Describe el problema con suficiente detalle para su análisis...' },
  'tr.dm.evidence': { pt: 'Evidências (opcional)', en: 'Evidence (optional)', es: 'Evidencias (opcional)' },
  'tr.dm.selected': { pt: 'selecionada', en: 'selected', es: 'seleccionada' },
  'tr.dm.attachPrompt': { pt: 'Clique para anexar arquivo ou captura de tela', en: 'Click to attach a file or screenshot', es: 'Haz clic para adjuntar archivo o captura de pantalla' },
  'tr.dm.fileTypes': { pt: 'PNG, JPG, PDF, máx. 5 MB', en: 'PNG, JPG, PDF, max. 5 MB', es: 'PNG, JPG, PDF, máx. 5 MB' },
  'tr.dm.warn': { pt: 'Disputas são analisadas por árbitros descentralizados. O processo pode levar até 24 horas. Disputas infundadas podem resultar em penalidades de reputação.', en: 'Disputes are reviewed by decentralized arbitrators. The process may take up to 24 hours. Unfounded disputes may result in reputation penalties.', es: 'Las disputas son analizadas por árbitros descentralizados. El proceso puede tardar hasta 24 horas. Las disputas infundadas pueden resultar en penalizaciones de reputación.' },
  'tr.dm.cancel': { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar' },
  'tr.dm.submitting': { pt: 'Enviando...', en: 'Sending...', es: 'Enviando...' },
  'tr.dm.submit': { pt: 'Enviar Disputa', en: 'Submit Dispute', es: 'Enviar Disputa' },

  // ── Devices: lista ──────────────────────────────────────────────────────────
  'dv.dl.title': { pt: 'Meus Dispositivos', en: 'My Devices', es: 'Mis Dispositivos' },
  'dv.dl.devicesWord': { pt: 'dispositivos', en: 'devices', es: 'dispositivos' },
  'dv.dl.generating': { pt: 'Gerando', en: 'Generating', es: 'Generando' },
  'dv.dl.consuming': { pt: 'Consumindo', en: 'Consuming', es: 'Consumiendo' },
  'dv.dl.charging': { pt: 'Carregando', en: 'Charging', es: 'Cargando' },
  'dv.dl.inverter': { pt: 'Inversor:', en: 'Inverter:', es: 'Inversor:' },
  'dv.dl.energyToday': { pt: 'Energia hoje', en: 'Energy today', es: 'Energía hoy' },
  'dv.dl.lastReading': { pt: 'Última leitura:', en: 'Last reading:', es: 'Última lectura:' },
  'dv.dl.details': { pt: 'Detalhes', en: 'Details', es: 'Detalles' },
  'dv.dl.wait': { pt: 'Aguarde…', en: 'Please wait…', es: 'Espera…' },
  'dv.dl.deactivate': { pt: 'Desativar', en: 'Deactivate', es: 'Desactivar' },

  // ── Devices: estatisticas ───────────────────────────────────────────────────
  'dv.ds.total': { pt: 'Total Dispositivos', en: 'Total Devices', es: 'Total Dispositivos' },
  'dv.ds.active': { pt: 'Dispositivos Ativos', en: 'Active Devices', es: 'Dispositivos Activos' },
  'dv.ds.energyToday': { pt: 'Energia Total Hoje', en: 'Total Energy Today', es: 'Energía Total Hoy' },
  'dv.ds.currentPower': { pt: 'Potência Atual', en: 'Current Power', es: 'Potencia Actual' },
  'dv.ds.subActive': { pt: '100% online', en: '100% online', es: '100% online' },
  'dv.ds.subEnergy': { pt: '+12% vs. ontem', en: '+12% vs. yesterday', es: '+12% vs. ayer' },
  'dv.ds.subPower': { pt: 'geração líquida', en: 'net generation', es: 'generación neta' },

  // ── Devices: leituras em tempo real ─────────────────────────────────────────
  'dv.dr.title': { pt: 'Leituras em Tempo Real', en: 'Real-Time Readings', es: 'Lecturas en Tiempo Real' },
  'dv.dr.lastHour': { pt: 'última hora', en: 'last hour', es: 'última hora' },
  'dv.dr.live': { pt: 'Ao vivo', en: 'Live', es: 'En vivo' },
  'dv.dr.peak': { pt: 'Pico', en: 'Peak', es: 'Pico' },
  'dv.dr.avg': { pt: 'Média', en: 'Average', es: 'Media' },
  'dv.dr.min': { pt: 'Mínimo', en: 'Minimum', es: 'Mínimo' },
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
