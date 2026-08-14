import { Helmet } from 'react-helmet-async'
import { HeroSection } from '@/components/home/HeroSection'
import { ChampionshipBanner, CHAMPIONSHIP_DATES_ISO, CHAMPIONSHIP_LOCATION } from '@/components/home/ChampionshipBanner'
import { AboutTeaserSection } from '@/components/home/AboutTeaserSection'
import { StatsSection } from '@/components/home/StatsSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { VideosPreviewSection } from '@/components/home/VideosPreviewSection'
import { KeyDatesSection } from '@/components/home/KeyDatesSection'
import { BlogPreviewSection } from '@/components/home/BlogPreviewSection'
import { FAQSection } from '@/components/home/FAQSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { FinalCTASection } from '@/components/home/FinalCTASection'
import { eventJsonLd, organizationJsonLd, SITE_NAME, SITE_URL } from '@/lib/seo'

export default function Home() {
  const jsonLd = [
    organizationJsonLd(),
    eventJsonLd({
      name: 'Global Checkers / Draughts Championship',
      startDate: CHAMPIONSHIP_DATES_ISO.start,
      endDate: CHAMPIONSHIP_DATES_ISO.end,
      location: CHAMPIONSHIP_LOCATION,
    }),
  ]

  return (
    <>
      <Helmet>
        <title>{SITE_NAME}</title>
        <meta
          name="description"
          content="Hopeland Global Checkers (Draughts) Federation. Global Checkers/Draughts Championship — Atlanta, Georgia, USA, July 19–25, 2027. Register to compete."
        />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:title" content={SITE_NAME} />
        <meta
          property="og:description"
          content="Global Checkers / Draughts Championship in Atlanta, Georgia, USA — July 19–25, 2027."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <HeroSection />
      <ChampionshipBanner />
      <AboutTeaserSection />
      <StatsSection />
      <FeaturesSection />
      <VideosPreviewSection />
      <KeyDatesSection />
      <BlogPreviewSection />
      <FAQSection />
      <TestimonialsSection />
      <FinalCTASection />
    </>
  )
}
