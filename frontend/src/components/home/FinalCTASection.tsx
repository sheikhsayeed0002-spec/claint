import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, UserRound } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/context/AuthContext'
import { useRegistrantStore } from '@/store/registrantStore'
import { slideFromLeft, slideFromRight, staggerContainer, viewportOnce } from '@/lib/motion'

export function FinalCTASection() {
  const { t } = useTranslation()
  const { isPaidPlayer } = useAuth()
  const registrantId = useRegistrantStore((s) => s.registrantId)
  const showProfile = isPaidPlayer || Boolean(registrantId)
  const profileTo = isPaidPlayer ? '/account' : '/profile'

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <img
        src="/home/home-cta-glow.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-primary/40" />
      <div className="container-page section-y relative text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.h2 variants={slideFromLeft} className="text-h1 mx-auto max-w-3xl text-white">
            Atlanta, Georgia, USA — July 19–25, 2027
          </motion.h2>
          <motion.p variants={slideFromRight} className="text-body-lg mx-auto mt-4 max-w-xl text-white/85">
            Global Checkers / Draughts Championship. Register now — your player profile opens only after Stripe payment succeeds.
          </motion.p>
          <motion.div
            variants={slideFromLeft}
            className="mx-auto mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center sm:gap-4"
          >
            <Link to={showProfile ? profileTo : '/register'} className="min-w-0 sm:flex-none">
              <Button
                size="lg"
                icon={showProfile ? <UserRound size={18} /> : <ArrowRight size={18} />}
                className="w-full sm:w-auto"
              >
                {showProfile ? t('header.myProfile') : t('header.registerCta')}
              </Button>
            </Link>
            <Link to="/about" className="min-w-0 sm:flex-none">
              <Button size="lg" variant="outline" className="w-full border-white/40 text-white sm:w-auto">
                How It Works
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
