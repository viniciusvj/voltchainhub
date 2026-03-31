export const energyOracleAbi = [
  // ── Functions ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'submitReading',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'reading',
        type: 'tuple',
        components: [
          { name: 'deviceId',  type: 'bytes32' },
          { name: 'wattHours', type: 'uint256' },
          { name: 'timestamp', type: 'uint64'  },
          { name: 'slot',      type: 'uint32'  },
          { name: 'signature', type: 'bytes'   },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'confirmReading',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'readingId',  type: 'bytes32' },
      { name: 'oracleSig',  type: 'bytes'   },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'contestReading',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'readingId', type: 'bytes32' },
      { name: 'evidence',  type: 'bytes'   },
    ],
    outputs: [],
  },

  // ── Events ───────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'ReadingSubmitted',
    inputs: [
      { name: 'readingId', type: 'bytes32', indexed: true  },
      { name: 'deviceId',  type: 'bytes32', indexed: true  },
      { name: 'wh',        type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ReadingConfirmed',
    inputs: [
      { name: 'readingId', type: 'bytes32', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'ReadingContested',
    inputs: [
      { name: 'readingId', type: 'bytes32', indexed: true  },
      { name: 'contester', type: 'address', indexed: false },
    ],
  },
] as const;
