import type { DollarAlert } from "../services/alerts";

interface Props {
  alert: DollarAlert | null;
  visible: boolean;
  onClose: () => void;
}

export function DollarAlertBanner({ alert, visible, onClose }: Props) {
  if (!alert || !visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-[360px] rounded-2xl border border-red-500/40 bg-black/90 p-4 text-white shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-400">
            🚨 ALERTA DE BANCO
          </p>

          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white">
            {alert.message_text}
          </p>

          <p className="mt-3 text-xs text-white/60">
            Avisado: {alert.telegram_sent_at_ve_pretty}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-full px-2 text-white/60 hover:bg-white/10 hover:text-white"
        >
          
        </button>
      </div>
    </div>
  );
}