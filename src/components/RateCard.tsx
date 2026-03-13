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
        rounded-2xl border border-[#27313d] bg-gradient-to-br from-[#161c24] to-[#10161d] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)]
        transition-all duration-200
        ${isClickable ? "cursor-pointer hover:border-[#3b4755] hover:bg-[#18202a] active:scale-[0.985]" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <p className={`mt-1 text-xs font-medium ${changeColor}`}>{change}</p>
          <p className="mt-1 text-xs text-slate-500">{updatedAt}</p>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold text-slate-100">{price}</p>
          <p className="mt-1 text-xs text-slate-400">{rate}</p>
        </div>
      </div>
    </article>
  )
}