export const energyVaultAbi = [
  // ── Functions ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'lockTrade',
    stateMutability: 'payable',
    inputs: [
      { name: 'seller',           type: 'address' },
      { name: 'tokenId',          type: 'uint256' },
      { name: 'energyAmount',     type: 'uint256' },
      { name: 'pricePerKwh',      type: 'uint256' },
      { name: 'deliveryDeadline', type: 'uint64'  },
    ],
    outputs: [{ name: 'tradeId', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'confirmDelivery',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tradeId', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'settleTrade',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tradeId', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'disputeTrade',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tradeId', type: 'bytes32' },
      { name: 'reason',  type: 'string'  },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'expireTrade',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tradeId', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getTrade',
    stateMutability: 'view',
    inputs: [
      { name: 'tradeId', type: 'bytes32' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'seller',       type: 'address' },
          { name: 'buyer',        type: 'address' },
          { name: 'tokenId',      type: 'uint256' },
          { name: 'energyAmount', type: 'uint256' },
          { name: 'pricePerKwh',  type: 'uint256' },
          { name: 'deadline',     type: 'uint64'  },
          { name: 'status',       type: 'uint8'   },
        ],
      },
    ],
  },

  // ── Events ───────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'TradeLocked',
    inputs: [
      { name: 'tradeId', type: 'bytes32', indexed: true  },
      { name: 'seller',  type: 'address', indexed: false },
      { name: 'buyer',   type: 'address', indexed: false },
      { name: 'amount',  type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TradeSettled',
    inputs: [
      { name: 'tradeId',    type: 'bytes32', indexed: true  },
      { name: 'energyWh',   type: 'uint256', indexed: false },
      { name: 'valueMatic', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TradeDisputed',
    inputs: [
      { name: 'tradeId', type: 'bytes32', indexed: true  },
      { name: 'reason',  type: 'string',  indexed: false },
    ],
  },
] as const;
