import icon from "../assets/icon.svg"

type HeaderProps = {
  onLogoClick?: () => void
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="animate-fade-up flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onLogoClick}
        className="flex items-center gap-3 rounded-2xl transition hover:opacity-90"
      >
        <img
          src={icon}
          alt="Vex Icon"
          className="h-12 w-12 rounded-2xl object-cover shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
        />

        <div>
          <h1 className="text-[2rem] font-bold leading-none tracking-tight text-[#e7e9ee]">
            Venecambio
          </h1>
          <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-[#7f8694]">
            Tasa libre de Venezuela
          </p>
        </div>
      </button>
    </header>
  )
}