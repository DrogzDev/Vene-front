type RateCardProps = {
  title: string
  price: string
  rate: string
  change: string
  changeColor: string
  updatedAt: string
  onClick?: () => void
}

export default function RateCard({
  title,
  price,
  rate,
  change,
  changeColor,
  updatedAt,
  onClick,
}: RateCardProps) {
  const isClickable = !!onClick

  return (
    <article
      onClick={onClick}
      className={`
        rounded-2xl border border-[#27313d] bg-gradient-to-br from-[#161c24] to-[#10161d] 
        p-3 sm:p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]
        transition-all duration-200
        ${isClickable ? "cursor-pointer hover:border-[#3b4755] hover:bg-[#18202a] active:scale-[0.985]" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 overflow-hidden">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 break-words">
            {title}
          </h3>
          <p className={`mt-1 text-xs font-medium ${changeColor} break-words`}>
            {change}
          </p>
          <p className="mt-1 text-xs text-slate-500 break-words">
            {updatedAt}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm sm:text-base font-bold text-slate-100 whitespace-nowrap">
            {price}
          </p>
          <p className="mt-1 text-xs text-slate-400 whitespace-nowrap">
            {rate}
          </p>
        </div>
      </div>
    </article>
  )
}