import type { DollarAlert } from "../services/alerts";

interface Props {
  alert: DollarAlert | null;
  visible: boolean;
  onClose: () => void;
}

export function DollarAlertBanner({ alert, visible, onClose }: Props) {
  if (!alert || !visible) return null;

  return (
    <div className="fixed top-4 right-16 z-50 w-[380px] rounded-2xl border border-red-500/40 bg-black/90 p-5 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-start gap-4">
        {/* SVG DE ALERTA BONITO (CAMPANA CON EXCLAMACIÓN) */}
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-400"
          >
            {/* Cuerpo de la campana */}
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            {/* Exclamación dentro de la campana (opcional) */}
            <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" />
            <line x1="12" y1="13" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-red-400">
            🚨 BANCAMIGA detectado
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white">
            {alert.message_text}
          </p>
          <p className="mt-3 text-xs text-white/60">
            Avisado: {alert.telegram_sent_at_ve_pretty || alert.telegram_sent_at_ve}
          </p>
        </div>

        <button
          onClick={onClose}
          className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}