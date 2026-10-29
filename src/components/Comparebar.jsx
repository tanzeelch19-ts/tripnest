import { Link, useLocation } from 'react-router-dom'
import { Scale, X } from 'lucide-react'
import { clearCompare, MAX_COMPARE, useCompareIds } from '../services/Shortlist'

export default function CompareBar() {
  const ids = useCompareIds()
  const { pathname } = useLocation()
  if (ids.length === 0 || pathname === '/compare') return null

  return (
    <div
      role="region"
      aria-label="Stays to compare"
      className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(92vw,620px)] items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-3 shadow-lg"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Scale size={18} aria-hidden="true" />
        Comparing {ids.length} of {MAX_COMPARE}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={clearCompare}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:text-ink"
        >
          <X size={14} aria-hidden="true" />
          Clear
        </button>
        <Link
          to="/compare"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink no-underline"
        >
          Compare
        </Link>
      </div>
    </div>
  )
}