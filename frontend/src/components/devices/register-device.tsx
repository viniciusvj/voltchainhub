'use client';

import { useState } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Wallet,
  Link as LinkIcon,
} from 'lucide-react';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { deviceRegistryAbi } from '@/contracts/abis/DeviceRegistry';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/contracts/addresses';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  name:      string;
  deviceId:  string;
  pubKeyX:   string;
  pubKeyY:   string;
  model:     string;
  capacity:  string;
  location:  string;
  ipfsCid:   string;
}

interface FieldError {
  [key: string]: string | undefined;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INVERTER_MODELS = [
  'Fronius Primo',
  'Fronius Symo',
  'Growatt MIC 3000',
  'Growatt SPH',
  'Deye SUN-12K',
  'BYD HVS 5.1',
  'BYD HVM 8.3',
  'Outro',
];

const STEPS = [
  { labelKey: 'dev.step.info', short: '1' },
  { labelKey: 'dev.step.attestation', short: '2' },
  { labelKey: 'dev.step.confirm', short: '3' },
] as const;

const EMPTY_FORM: FormData = {
  name:     '',
  deviceId: '',
  pubKeyX:  '',
  pubKeyY:  '',
  model:    '',
  capacity: '',
  location: '',
  ipfsCid:  '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;

function isBytes32(v: string) {
  return BYTES32_RE.test(v.trim());
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-0 w-full mb-6">
      {STEPS.map((step, idx) => {
        const done   = idx < current;
        const active = idx === current;
        const last   = idx === STEPS.length - 1;

        return (
          <div key={step.labelKey} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                  done   && 'bg-[#0066FF] border-[#0066FF] text-white',
                  active && 'border-[#0066FF] text-[#0066FF] bg-[#0066FF]/10',
                  !done && !active && 'border-volt-dark-600 text-gray-600'
                )}
              >
                {done ? <Check className="w-4 h-4" /> : step.short}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 whitespace-nowrap',
                  active ? 'text-[#0066FF] font-medium' : done ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {t(step.labelKey)}
              </span>
            </div>

            {/* Connector line */}
            {!last && (
              <div
                className={cn(
                  'flex-1 h-0.5 mb-4 mx-1 transition-colors',
                  done ? 'bg-[#0066FF]' : 'bg-volt-dark-600'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm text-gray-400 mb-1.5">
      {children}
      {required && <span className="text-[#0066FF] ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  error,
  monospace,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  monospace?: boolean;
  type?: string;
}) {
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-volt-dark-700 border rounded-lg px-3 py-2.5 text-sm text-gray-100',
          'placeholder-gray-600 outline-none transition-colors',
          'focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/30',
          error ? 'border-red-500/60' : 'border-volt-dark-600',
          monospace && 'font-mono text-xs'
        )}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full bg-volt-dark-700 border rounded-lg px-3 py-2.5 text-sm text-gray-100',
          'outline-none transition-colors appearance-none cursor-pointer',
          'focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/30',
          error ? 'border-red-500/60' : 'border-volt-dark-600',
          !value && 'text-gray-600'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o} className="bg-volt-dark-700">
            {o}
          </option>
        ))}
      </select>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ── Step content components ───────────────────────────────────────────────────

function Step1({
  data,
  errors,
  onChange,
}: {
  data: FormData;
  errors: FieldError;
  onChange: (field: keyof FormData, value: string) => void;
}) {
  const { t } = useI18n();
  // 'Outro' e o unico rotulo traduzivel; os demais modelos sao nomes proprios.
  const models = INVERTER_MODELS.map((m) => (m === 'Outro' ? t('dev.other') : m));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Nome */}
      <div className="sm:col-span-2">
        <Label required>{t('dev.name')}</Label>
        <Input
          value={data.name}
          onChange={(v) => onChange('name', v)}
          placeholder={t('dev.namePh')}
          error={errors.name}
        />
      </div>

      {/* Device ID */}
      <div className="sm:col-span-2">
        <Label required>{t('dev.deviceId')}</Label>
        <Input
          value={data.deviceId}
          onChange={(v) => onChange('deviceId', v)}
          placeholder="0x0000000000000000000000000000000000000000000000000000000000000001"
          error={errors.deviceId}
          monospace
        />
        <p className="text-xs text-gray-600 mt-1">{t('dev.hexHint')}</p>
      </div>

      {/* Pub Key X */}
      <div>
        <Label required>{t('dev.pubX')}</Label>
        <Input
          value={data.pubKeyX}
          onChange={(v) => onChange('pubKeyX', v)}
          placeholder="0x..."
          error={errors.pubKeyX}
          monospace
        />
      </div>

      {/* Pub Key Y */}
      <div>
        <Label required>{t('dev.pubY')}</Label>
        <Input
          value={data.pubKeyY}
          onChange={(v) => onChange('pubKeyY', v)}
          placeholder="0x..."
          error={errors.pubKeyY}
          monospace
        />
      </div>

      {/* Modelo inversor */}
      <div>
        <Label required>{t('dev.model')}</Label>
        <Select
          value={data.model}
          onChange={(v) => onChange('model', v)}
          options={models}
          placeholder={t('dev.modelPh')}
          error={errors.model}
        />
      </div>

      {/* Capacidade */}
      <div>
        <Label required>{t('dev.capacity')}</Label>
        <Input
          value={data.capacity}
          onChange={(v) => onChange('capacity', v)}
          placeholder="ex: 5.0"
          error={errors.capacity}
          type="number"
        />
      </div>

      {/* Localização */}
      <div className="sm:col-span-2">
        <Label required>{t('dev.location')}</Label>
        <Input
          value={data.location}
          onChange={(v) => onChange('location', v)}
          placeholder={t('dev.locationPh')}
          error={errors.location}
        />
      </div>

      {/* IPFS CID */}
      <div className="sm:col-span-2">
        <Label>{t('dev.ipfs')} <span className="text-gray-600 font-normal">{t('dev.optional')}</span></Label>
        <Input
          value={data.ipfsCid}
          onChange={(v) => onChange('ipfsCid', v)}
          placeholder="QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
        />
      </div>
    </div>
  );
}

function Step2({ data }: { data: FormData }) {
  const { t } = useI18n();
  const fields: { label: string; value: string; mono?: boolean }[] = [
    { label: t('dev.deviceIdShort'), value: data.deviceId || '-', mono: true },
    { label: t('dev.pubXShort'),     value: data.pubKeyX  || '-', mono: true },
    { label: t('dev.pubYShort'),     value: data.pubKeyY  || '-', mono: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-medium text-gray-200 mb-2">{t('dev.attestTitle')}</p>
        <p className="text-xs leading-relaxed">
          {t('dev.attestPre')}<span className="text-[#0066FF] font-mono">DeviceRegistry</span>{t('dev.attestPost')}
        </p>
      </div>

      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">{f.label}</span>
            <span
              className={cn(
                'text-sm text-gray-200 break-all bg-volt-dark-700 border border-volt-dark-600 rounded px-2.5 py-1.5',
                f.mono && 'font-mono text-xs'
              )}
            >
              {f.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-xs text-[#FFB800] bg-[#FFB800]/5 border border-[#FFB800]/20 rounded-lg p-3">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          {t('dev.attestWarn')}
        </p>
      </div>
    </div>
  );
}

function Step3({ data, submitting }: { data: FormData; submitting: boolean }) {
  const { t } = useI18n();
  const summary = [
    { label: t('dev.sumName'),     value: data.name },
    { label: t('dev.sumModel'),    value: data.model },
    { label: t('dev.sumCapacity'), value: `${data.capacity} kW` },
    { label: t('dev.sumLocation'), value: data.location },
    { label: t('dev.sumIpfs'),     value: data.ipfsCid || t('dev.notProvided') },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-volt-dark-700 border border-volt-dark-600 rounded-lg divide-y divide-volt-dark-600">
        {summary.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="text-gray-200 font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-xs text-[#0066FF] bg-[#0066FF]/5 border border-[#0066FF]/20 rounded-lg p-3">
        <LinkIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          {t('dev.txInfo')}
        </p>
      </div>

      {submitting && (
        <div className="flex items-center gap-3 text-sm text-gray-400 bg-volt-dark-700 border border-volt-dark-600 rounded-lg px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-[#0066FF]" />
          {t('dev.sending')}
        </div>
      )}
    </div>
  );
}

// ── RegisterDevice (main) ─────────────────────────────────────────────────────

export function RegisterDevice() {
  const { isConnected } = useAccount();
  const { t } = useI18n();

  const [step,       setStep]       = useState(0);
  const [form,       setForm]       = useState<FormData>(EMPTY_FORM);
  const [errors,     setErrors]     = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [txHash,     setTxHash]     = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1(): boolean {
    const newErrors: FieldError = {};

    if (!form.name.trim())          newErrors.name     = t('dev.errName');
    if (!form.deviceId.trim())      newErrors.deviceId = t('dev.errDeviceId');
    else if (!isBytes32(form.deviceId)) newErrors.deviceId = t('dev.errBytes32');

    if (!form.pubKeyX.trim())       newErrors.pubKeyX  = t('dev.errPubX');
    else if (!isBytes32(form.pubKeyX))  newErrors.pubKeyX  = t('dev.errBytes32fmt');

    if (!form.pubKeyY.trim())       newErrors.pubKeyY  = t('dev.errPubY');
    else if (!isBytes32(form.pubKeyY))  newErrors.pubKeyY  = t('dev.errBytes32fmt');

    if (!form.model)                newErrors.model    = t('dev.errModel');
    if (!form.capacity.trim())      newErrors.capacity = t('dev.errCapacity');
    else if (isNaN(Number(form.capacity)) || Number(form.capacity) <= 0)
      newErrors.capacity = t('dev.errCapacityNum');

    if (!form.location.trim())      newErrors.location = t('dev.errLocation');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const metadata = JSON.stringify({
        name: form.name,
        model: form.model,
        capacityWh: Number(form.capacity),
        location: form.location,
      });
      // attestationSig must be non-empty; the real P-256 attestation is verified
      // off-chain, so a placeholder byte is used until the firmware signs.
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID].deviceRegistry,
        abi: deviceRegistryAbi,
        functionName: 'registerDevice',
        args: [
          form.deviceId as `0x${string}`,
          form.pubKeyX as `0x${string}`,
          form.pubKeyY as `0x${string}`,
          '0x00',
          metadata,
        ],
        chainId: DEFAULT_CHAIN_ID,
      });
      setTxHash(hash);
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('dev.errSubmit'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setStep(0);
    setForm(EMPTY_FORM);
    setErrors({});
    setDone(false);
    setTxHash(null);
    setSubmitError(null);
  }

  return (
    <div className="bg-volt-dark-800 border border-volt-dark-600 rounded-xl p-6">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-200">{t('dev.title')}</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {t('dev.subtitle')}
        </p>
      </div>

      {/* Wallet gate */}
      {!isConnected ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-12 h-12 rounded-full bg-volt-dark-700 border border-volt-dark-600 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-gray-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">{t('dev.walletNotConnected')}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t('dev.connectPrompt')}
            </p>
          </div>
          <ConnectButton label={t('connect')} />
        </div>
      ) : done ? (
        /* Success state */
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-14 h-14 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center">
            <Check className="w-7 h-7 text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-200">{t('dev.registered')}</p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium text-gray-300">{form.name}</span>{t('dev.addedSuffix')}
            </p>
            {txHash && (
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0066FF] hover:underline mt-2 inline-block break-all"
              >
                {t('dev.viewTx')}
              </a>
            )}
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-[#0066FF] hover:underline"
          >
            {t('dev.registerAnother')}
          </button>
        </div>
      ) : (
        /* Multi-step form */
        <>
          <StepIndicator current={step} />

          {/* Step body */}
          <div className="min-h-[280px]">
            {step === 0 && <Step1 data={form} errors={errors} onChange={handleChange} />}
            {step === 1 && <Step2 data={form} />}
            {step === 2 && <Step3 data={form} submitting={submitting} />}
          </div>

          {submitError && (
            <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 break-words">
              {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-volt-dark-600">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium',
                'border border-volt-dark-600 text-gray-400 hover:text-gray-200 hover:border-gray-500',
                'transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('dev.back')}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold',
                  'bg-[#0066FF] text-white hover:bg-[#0055DD] transition-colors'
                )}
              >
                {t('dev.next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold',
                  'bg-[#0066FF] text-white hover:bg-[#0055DD] transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('dev.registering')}
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    {t('dev.registerOnchain')}
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
