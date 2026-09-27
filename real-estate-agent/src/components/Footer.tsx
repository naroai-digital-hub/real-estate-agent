import type { BusinessSettings } from '../lib/types'
import { Icon, SmartImage } from './ui'
import { IMAGES } from '../lib/images'

export function CtaBand() {
  return (
    <section className="cta-band">
      <div className="bg">
        <SmartImage src={IMAGES.ctaBand} alt="Modern home exterior at dusk" />
      </div>
      <div className="veil" />
      <div className="wrap">
        <p className="kicker">Ready when you are</p>
        <h2>Your next property move starts with a conversation.</h2>
        <p>
          Reserve a one-on-one consultation in under two minutes.
          Choose your session, pick a time, and we will take care of the rest.
        </p>
        <a href="#booking" className="btn btn-gold">
          <Icon name="calendar" /> Schedule Your Consultation
        </a>
      </div>
    </section>
  )
}


export default function Footer({ settings }: { settings: BusinessSettings | null }) {
  const name = settings?.business_name ?? 'Muse Property Group'
  return (
    <footer id="contact">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <a href="#top" className="brand">
              <span className="brand-mark">
                <Icon name="key" />
              </span>
              <span>
                <span className="brand-name">{name}</span>
                <br />
                <span className="brand-sub">Real Estate</span>
              </span>
            </a>
            <p>
              Boutique real estate advisory for buyers, sellers and investors.
              Book a consultation and plan your next move with confidence.
            </p>
          </div>

          <div>
            <h5>Explore</h5>
            <ul className="foot-links">
              <li><a href="#services">Services</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#booking">Book a consultation</a></li>
              <li><a href="#top">Back to top</a></li>
            </ul>
          </div>

          <div>
            <h5>Services</h5>
            <ul className="foot-links">
              <li><a href="#services">Buyer Consultation</a></li>
              <li><a href="#services">Seller Consultation</a></li>
              <li><a href="#services">Property Viewing</a></li>
              <li><a href="#services">Home Valuation</a></li>
            </ul>
          </div>

          <div>
            <h5>Contact</h5>
            <ul className="foot-contact">
              {settings?.business_phone && (
                <li>
                  <Icon name="phone" />
                  <a href={`tel:${settings.business_phone.replace(/[^+\d]/g, '')}`} style={{ textDecoration: 'none' }}>
                    {settings.business_phone}
                  </a>
                </li>
              )}
              {settings?.business_email && (
                <li>
                  <Icon name="mail" />
                  <a href={`mailto:${settings.business_email}`} style={{ textDecoration: 'none' }}>
                    {settings.business_email}
                  </a>
                </li>
              )}
              {settings?.business_address && (
                <li>
                  <Icon name="mapPin" />
                  <span>{settings.business_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {name}. All rights reserved.</span>
          <a href="#/admin">Agent login</a>
        </div>
      </div>
    </footer>
  )
}
