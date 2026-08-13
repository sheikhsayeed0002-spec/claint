import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { SITE_NAME } from '@/lib/seo'

export const CHAMPIONSHIP_LOCATION = 'Atlanta, Georgia, USA'
export const CHAMPIONSHIP_DATES = 'July 19 – 25, 2027'
export const CHAMPIONSHIP_DATES_ISO = { start: '2027-07-19', end: '2027-07-25' }

export function ChampionshipBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-center text-[11px] font-bold tracking-[0.12em] text-white uppercase sm:text-xs">
        Global Checkers / Draughts — {CHAMPIONSHIP_LOCATION} · {CHAMPIONSHIP_DATES}
      </p>
    )
  }

  return (
    <section className="relative z-10 bg-[#071040] py-7 text-white sm:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="container-page flex flex-col items-center text-center">
        <p className="text-[10px] font-bold tracking-[0.28em] text-primary-light uppercase sm:text-[11px]">
          {SITE_NAME}
        </p>
        <h2 className="mt-2 max-w-4xl font-display text-xl font-extrabold tracking-tight text-white sm:text-3xl">
          Global Checkers / Draughts Competition
        </h2>
        <p className="mt-3 inline-flex items-center gap-2 text-base font-semibold text-white sm:text-xl">
          <MapPin size={18} className="text-primary-light" aria-hidden />
          {CHAMPIONSHIP_LOCATION}
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold tracking-wide text-primary-light sm:text-4xl">
          19 July – 25 July, 2027
        </p>
        <Link
          to="/register"
          className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(14,165,233,0.7)] transition-colors hover:bg-primary-light"
        >
          Register to Compete
        </Link>
      </div>
    </section>
  )
}
