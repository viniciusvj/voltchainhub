'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type DisputeReason =
  | 'not-delivered'
  | 'wrong-amount'
  | 'reading-quality'
  | 'other';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REASONS: { value: DisputeReason; label: string }[] = [
  { value: 'not-delivered', label: 'Energia não entregue' },
  { value: 'wrong-amount', label: 'Quantidade incorreta' },
  { value: 'reading-quality', label: 'Qualidade da leitura' },
  { value: 'other', label: 'Outro' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function DisputeModal({ isOpen, onClose, tradeId }: DisputeModalProps) {
  const [reason, setReason] = useState<DisputeReason>('not-delivered');
  const [description, setDescription] = useState('');
  const [fileAttached, setFileAttached] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('not-delivered');
      setDescription('');
      setFileAttached(false);
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    // Mock async submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => onClose(), 1800);
    }, 1500);
  }

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-modal-title"
    >
      {/* Card */}
      <div className="w-full max-w-md bg-volt-dark-800 border border-volt-dark-600 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-volt-dark-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <h2
              id="dispute-modal-title"
              className="text-base font-bold text-white"
            >
              Abrir Disputa
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-volt-dark-700 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 px-6 py-10">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-base font-bold text-white">
              Disputa enviada!
            </p>
            <p className="text-sm text-gray-400 text-center">
              Sua disputa foi registrada. Nossa equipe analisará dentro de 24h.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto max-h-[70vh]">
            {/* Trade ID */}
            <div className="flex items-center gap-2 bg-volt-dark-700 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500">Trade ID:</span>
              <span className="text-xs font-mono font-semibold text-white flex-1">
                {tradeId}
              </span>
            </div>

            {/* Reason radios */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Motivo da disputa
              </label>
              <div className="flex flex-col gap-2">
                {REASONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                      reason === value
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-volt-dark-600 bg-volt-dark-700 hover:border-volt-dark-500'
                    )}
                  >
                    <input
                      type="radio"
                      name="dispute-reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="accent-red-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description textarea */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dispute-description"
                className="text-sm font-medium text-gray-300"
              >
                Descrição detalhada{' '}
                <span className="text-red-400">*</span>
              </label>
              <textarea
                id="dispute-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema com detalhes suficientes para análise..."
                className="w-full px-3 py-2.5 bg-volt-dark-700 border border-volt-dark-600 rounded-lg text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-red-500/50 transition-colors"
              />
              <p className="text-xs text-gray-600 text-right">
                {description.length}/500
              </p>
            </div>

            {/* Evidence upload placeholder */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">
                Evidências (opcional)
              </label>
              <button
                type="button"
                onClick={() => setFileAttached(!fileAttached)}
                className={cn(
                  'flex flex-col items-center gap-2 w-full py-5 border-2 border-dashed rounded-xl transition-all',
                  fileAttached
                    ? 'border-[#0066FF]/50 bg-[#0066FF]/5 text-[#0066FF]'
                    : 'border-volt-dark-600 text-gray-500 hover:border-volt-dark-500 hover:text-gray-400'
                )}
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">
                  {fileAttached
                    ? 'evidencia_trade.png selecionada'
                    : 'Clique para anexar arquivo ou captura de tela'}
                </span>
                {!fileAttached && (
                  <span className="text-xs text-gray-600">
                    PNG, JPG, PDF — máx. 5 MB
                  </span>
                )}
              </button>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-[#FFB800] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#FFB800]">
                Disputas são analisadas por árbitros descentralizados. O
                processo pode levar até 24 horas. Disputas infundadas podem
                resultar em penalidades de reputação.
              </p>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        {!submitted && (
          <div className="flex gap-3 px-6 py-4 border-t border-volt-dark-600">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-volt-dark-600 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || submitting}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                description.trim() && !submitting
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30'
                  : 'bg-volt-dark-600 text-gray-500 cursor-not-allowed'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Enviar Disputa
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
