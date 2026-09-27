import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type {
  BlockedDate,
  BusinessHours,
  BusinessSettings,
  Service,
} from '../lib/types'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ServicesSection from '../components/ServicesSection'
import AboutSection, { ProcessStrip } from '../components/AboutSection'
import BookingSection from '../components/BookingSection'
import Footer, { CtaBand } from '../components/Footer'

const DEFAULT_SETTINGS: BusinessSettings = {
  id: '',
  business_name: 'Muse Property Group',
  business_email: '',
  business_phone: '',
  business_address: '',
  slot_interval_minutes: 30,
  booking_notice_hours: 24,
  created_at: '',
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS)
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [preselectId, setPreselectId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [svcRes, setRes, hoursRes, blockedRes] = await Promise.all([
          supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true }),
          supabase.from('business_settings').select('*').limit(1).maybeSingle(),
          supabase.from('business_hours').select('*').order('weekday'),
          supabase.from('blocked_dates').select('*').order('blocked_date'),
        ])
        if (!alive) return
        if (svcRes.data) setServices(svcRes.data as Service[])
        if (setRes.data) setSettings(setRes.data as BusinessSettings)
        if (hoursRes.data) setBusinessHours(hoursRes.data as BusinessHours[])
        if (blockedRes.data) setBlockedDates(blockedRes.data as BlockedDate[])
      } catch {
        // Public site stays usable with defaults if Supabase is unreachable.
      } finally {
        if (alive) setServicesLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  const handleBookService = useCallback((s: Service) => {
    setPreselectId(s.id)
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const consumePreselect = useCallback(() => setPreselectId(null), [])

  return (
    <>
      <Navbar
        businessName={settings.business_name}
        phone={settings.business_phone}
        email={settings.business_email}
      />
      <main>
        <Hero businessName={settings.business_name} />
        <ServicesSection
          services={services}
          loading={servicesLoading}
          onBook={handleBookService}
        />
        <ProcessStrip />
        <AboutSection businessName={settings.business_name} />
        <BookingSection
          services={services}
          settings={settings}
          businessHours={businessHours}
          blockedDates={blockedDates}
          preselectId={preselectId}
          onPreselectConsumed={consumePreselect}
        />
        <CtaBand />
      </main>
      <Footer settings={settings} />
    </>
  )
}
