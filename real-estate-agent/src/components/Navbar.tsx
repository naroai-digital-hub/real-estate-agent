import { useEffect, useState } from 'react'
import { Icon } from './ui'

export default function Navbar({
  businessName,
  phone,
  email,
}: {
  businessName: string
  phone: string
  email: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#services', label: 'Services' },
    { href: '#about', label: 'About' },
    { href: '#booking', label: 'Booking' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>Premium real estate guidance, tailored to you</span>
          <div className="topbar-group">
            {phone && (
              <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
                <Icon name="phone" /> {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`}>
                <Icon name="mail" /> {email}
              </a>
            )}
          </div>
        </div>
      </div>

      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap">
          <a href="#top" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark">
              <Icon name="key" />
            </span>
            <span>
              <span className="brand-name">{businessName}</span>
              <br />
              <span className="brand-sub">Real Estate</span>
            </span>
          </a>

          <div className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="nav-cta">
            <a href="#booking" className="btn btn-navy" style={{ padding: '12px 24px' }}>
              <Icon name="calendar" /> Book a Consultation
            </a>
            <button
              className="nav-burger"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <Icon name={open ? 'x' : 'menu'} />
            </button>
          </div>
        </div>

        <div className={`mobile-menu${open ? ' open' : ''}`}>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#booking" className="btn btn-navy" onClick={() => setOpen(false)}>
            <Icon name="calendar" /> Book a Consultation
          </a>
        </div>
      </nav>
    </>
  )
}
