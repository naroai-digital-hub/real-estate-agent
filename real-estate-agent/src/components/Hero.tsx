import { Icon, SmartImage } from './ui'
import { IMAGES } from '../lib/images'

const STATS = [
  { icon: 'mapPin', title: 'Local market expertise', text: 'Guidance grounded in your neighborhood' },
  { icon: 'shield', title: 'Trusted representation', text: 'Your interests come first, always' },
  { icon: 'users', title: 'Buyer & seller support', text: 'Clear steps from first call to keys' },
  { icon: 'trend', title: 'Data-informed strategy', text: 'Pricing and timing based on real numbers' },
] as const

export default function Hero({ businessName }: { businessName: string }) {
  return (
    <header className="hero" id="top">
      <div className="hero-bg">
        <SmartImage
          src={IMAGES.heroMain}
          alt="Bright, elegantly staged modern living room"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div className="hero-veil" />
      <div className="hero-glow" />

      <div className="wrap">
        <div className="hero-inner">
          <span className="hero-badge">
            <span className="dot">
              <Icon name="key" />
            </span>
            {businessName} · Boutique Real Estate Advisory
          </span>
          <h1>
            Find your way home, <em>with an expert</em> by your side.
          </h1>
          <p>
            Buying, selling or investing — book a one-on-one consultation and get
            clear, honest guidance on your next property move. No pressure,
            no jargon. Just a plan that fits your life.
          </p>
          <div className="hero-ctas">
            <a href="#booking" className="btn btn-gold">
              <Icon name="calendar" /> Book Your Consultation
            </a>
            <a href="#services" className="btn btn-ghost">
              Explore Services <Icon name="arrowR" />
            </a>
          </div>
        </div>
      </div>

      <aside className="hero-card" aria-hidden="true">
        <SmartImage src={IMAGES.heroCard} alt="" />
        <div className="hero-card-body">
          <b>Next consultation opening</b>
          <span>Buyer & seller sessions available this week</span>
          <div className="hero-card-row">
            <span className="pulse" /> Live availability — book in 2 minutes
          </div>
        </div>
      </aside>

      <div className="hero-stats">
        <div className="wrap">
          {STATS.map((s) => (
            <div className="hstat" key={s.title}>
              <Icon name={s.icon} />
              <div>
                <b>{s.title}</b>
                <span>{s.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
