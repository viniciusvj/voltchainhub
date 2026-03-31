export const luzTokenAbi = [
  // ── Custom functions ────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to',      type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount',  type: 'uint256' },
      { name: 'data',    type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'burn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from',    type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id',      type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'encodeTokenId',
    stateMutability: 'pure',
    inputs: [
      { name: 'device',     type: 'address' },
      { name: 'slot',       type: 'uint32'  },
      { name: 'sourceType', type: 'uint8'   },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // ── Standard ERC-1155 functions ─────────────────────────────────────────────
  {
    type: 'function',
    name: 'balanceOfBatch',
    stateMutability: 'view',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids',      type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool'    },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'account',  type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'safeTransferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from',    type: 'address' },
      { name: 'to',      type: 'address' },
      { name: 'id',      type: 'uint256' },
      { name: 'amount',  type: 'uint256' },
      { name: 'data',    type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'safeBatchTransferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from',    type: 'address'   },
      { name: 'to',      type: 'address'   },
      { name: 'ids',     type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'data',    type: 'bytes'     },
    ],
    outputs: [],
  },

  // ── Events ──────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'TokenMinted',
    inputs: [
      { name: 'to',      type: 'address', indexed: true  },
      { name: 'tokenId', type: 'uint256', indexed: true  },
      { name: 'amount',  type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TokenBurned',
    inputs: [
      { name: 'from',    type: 'address', indexed: true  },
      { name: 'tokenId', type: 'uint256', indexed: true  },
      { name: 'amount',  type: 'uint256', indexed: false },
    ],
  },
  // Standard ERC-1155 events
  {
    type: 'event',
    name: 'TransferSingle',
    inputs: [
      { name: 'operator', type: 'address', indexed: true  },
      { name: 'from',     type: 'address', indexed: true  },
      { name: 'to',       type: 'address', indexed: true  },
      { name: 'id',       type: 'uint256', indexed: false },
      { name: 'value',    type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TransferBatch',
    inputs: [
      { name: 'operator', type: 'address',   indexed: true  },
      { name: 'from',     type: 'address',   indexed: true  },
      { name: 'to',       type: 'address',   indexed: true  },
      { name: 'ids',      type: 'uint256[]', indexed: false },
      { name: 'values',   type: 'uint256[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ApprovalForAll',
    inputs: [
      { name: 'account',  type: 'address', indexed: true  },
      { name: 'operator', type: 'address', indexed: true  },
      { name: 'approved', type: 'bool',    indexed: false },
    ],
  },
] as const;
