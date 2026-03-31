export const deviceRegistryAbi = [
  // ── Functions ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'registerDevice',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'deviceId',       type: 'bytes32' },
      { name: 'pubKeyX',        type: 'bytes32' },
      { name: 'pubKeyY',        type: 'bytes32' },
      { name: 'attestationSig', type: 'bytes'   },
      { name: 'metadata',       type: 'string'  },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'verifyReading',
    stateMutability: 'view',
    inputs: [
      { name: 'deviceId',    type: 'bytes32' },
      { name: 'readingHash', type: 'bytes32' },
      { name: 'signature',   type: 'bytes'   },
    ],
    outputs: [{ name: 'valid', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'deactivateDevice',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'deviceId', type: 'bytes32' },
      { name: 'reason',   type: 'string'  },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getDevice',
    stateMutability: 'view',
    inputs: [
      { name: 'deviceId', type: 'bytes32' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'owner',        type: 'address' },
          { name: 'publicKeyX',   type: 'bytes32' },
          { name: 'publicKeyY',   type: 'bytes32' },
          { name: 'registeredAt', type: 'uint64'  },
          { name: 'active',       type: 'bool'    },
          { name: 'metadata',     type: 'string'  },
        ],
      },
    ],
  },

  // ── Events ───────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'DeviceRegistered',
    inputs: [
      { name: 'deviceId', type: 'bytes32', indexed: true },
      { name: 'owner',    type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'DeviceDeactivated',
    inputs: [
      { name: 'deviceId', type: 'bytes32', indexed: true  },
      { name: 'reason',   type: 'string',  indexed: false },
    ],
  },
] as const;
