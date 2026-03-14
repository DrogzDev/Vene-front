import { useEffect, useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import { addMonths, format, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import "react-day-picker/dist/style.css"

type HistoryDatePickerProps = {
  selectedDate: Date | null
  onConfirm: (date: Date | null) => void
  availableDates?: string[]
  loading?: boolean
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatSelectedLabel(date: Date | null) {
  if (!date) return "Elegir fecha"

  const text = format(date, "EEEE, d 'de' MMMM", { locale: es })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function HistoryDatePicker({
  selectedDate,
  onConfirm,
  availableDates = [],
  loading = false,
}: HistoryDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate)
  const [displayMonth, setDisplayMonth] = useState<Date>(selectedDate ?? new Date())

  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates])
  const hasAvailableDates = availableDates.length > 0

  function handleOpen() {
    const baseDate = selectedDate ?? new Date()
    setTempDate(selectedDate)
    setDisplayMonth(baseDate)
    setOpen(true)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }

  function handleClose() {
    setVisible(false)
    setTimeout(() => {
      setOpen(false)
    }, 280)
  }

  function handleCancel() {
    setTempDate(selectedDate)
    handleClose()
  }

  function handleConfirm() {
    onConfirm(tempDate)
    handleClose()
  }

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <>
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#2d3844] bg-[#151b23] px-4 py-2 text-xs font-medium text-[#aeb8c2] transition hover:border-[#415062] hover:bg-[#1a212b] hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M3 10h18" />
          </svg>

          <span>{formatSelectedLabel(selectedDate)}</span>
        </button>

        {loading && <p className="text-xs text-[#8c98a5]">Buscando histórico...</p>}
      </div>

      {open && (
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ${
            visible ? "bg-black/35 backdrop-blur-md" : "bg-black/0 backdrop-blur-0"
          }`}
          onClick={handleClose}
        >
          <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-3 sm:pb-5">
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-[430px] rounded-[32px] bg-[#f7f7f8] shadow-[0_-10px_40px_rgba(0,0,0,0.22)] transition-all duration-300 ${
                visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
            >
              <div className="flex justify-center pt-3">
                <div className="h-1.5 w-12 rounded-full bg-[#d2d4d8]" />
              </div>

              <div className="px-5 pb-5 pt-3">
                <div className="mb-5 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white transition hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="h-5 w-5"
                    >
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-5 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setDisplayMonth((prev) => subMonths(prev, 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e3e4e8] bg-white text-[#22242a] transition hover:bg-[#efeff2]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="h-4 w-4"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  <div className="min-w-0 flex-1 px-4 text-center">
                    <p className="text-[20px] font-semibold capitalize tracking-[-0.02em] text-[#22242a]">
                      {format(displayMonth, "MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDisplayMonth((prev) => addMonths(prev, 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e3e4e8] bg-white text-[#22242a] transition hover:bg-[#efeff2]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="h-4 w-4"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                <div className="rounded-[24px] bg-[#f7f7f8]">
                  <DayPicker
                    mode="single"
                    month={displayMonth}
                    onMonthChange={setDisplayMonth}
                    selected={tempDate ?? undefined}
                    onSelect={(date) => {
                      if (!date) return
                      setTempDate(date)
                    }}
                    locale={es}
                    showOutsideDays
                    disabled={
                      hasAvailableDates
                        ? (date) => !availableDateSet.has(toDateKey(date))
                        : undefined
                    }
                    classNames={{
                      root: "w-full",
                      months: "flex justify-center",
                      month: "w-full",
                      caption: "hidden",
                      nav: "hidden",
                      month_grid: "w-full border-collapse",
                      weekdays: "mb-3 grid grid-cols-7 gap-y-1",
                      weekday: "text-center text-[13px] font-semibold uppercase text-[#8d9098]",
                      weeks: "space-y-2",
                      week: "grid grid-cols-7 place-items-center",
                      day: "h-11 w-11",
                      day_button:
                        "flex h-11 w-11 items-center justify-center rounded-full text-[17px] font-medium text-[#2c2d33] transition-colors duration-150",
                      selected:
                        "[&>button]:bg-black [&>button]:text-white [&>button]:shadow-none [&>button:hover]:bg-black [&>button:hover]:text-white",
                      today:
                        "[&>button]:border [&>button]:border-[#d7d9de] [&>button]:bg-white [&>button]:text-[#2c2d33]",
                      outside: "[&>button]:text-[#c9ccd3]",
                      disabled:
                        "[&>button]:text-[#d4d7dd] [&>button]:opacity-100 [&>button]:cursor-not-allowed [&>button:hover]:bg-transparent [&>button:hover]:text-[#d4d7dd]",
                    }}
                    modifiersClassNames={{
                      today: "",
                      selected: "",
                      disabled: "",
                    }}
                    modifiersStyles={{
                      selected: {
                        backgroundColor: "transparent",
                      },
                    }}
                    components={{
                      DayButton: ({ children, ...props }) => {
                        const isDisabled = Boolean(props.disabled)
                        const isSelected = Boolean(props.modifiers?.selected)
                        const isToday = Boolean(props.modifiers?.today)

                        let buttonClass =
                          "flex h-11 w-11 items-center justify-center rounded-full text-[17px] font-medium transition-colors duration-150"

                        if (isSelected) {
                          buttonClass += " bg-black text-white"
                        } else if (isDisabled) {
                          buttonClass += " text-[#d4d7dd] cursor-not-allowed"
                        } else if (isToday) {
                          buttonClass += " border border-[#d7d9de] bg-white text-[#2c2d33] hover:bg-[#eef0f3]"
                        } else {
                          buttonClass += " text-[#2c2d33] hover:bg-black hover:text-white"
                        }

                        return (
                          <button {...props} className={buttonClass}>
                            {children}
                          </button>
                        )
                      },
                    }}
                  />
                </div>

                {!hasAvailableDates && (
                  <p className="mt-3 text-center text-xs text-[#8b8d96]">
                    Aún no hay fechas históricas disponibles.
                  </p>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-full bg-[#ececf0] px-4 py-3.5 text-sm font-semibold text-[#3a3b42] transition hover:bg-[#e3e4e9]"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!tempDate}
                    className="rounded-full bg-[#16171b] px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Seleccionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}