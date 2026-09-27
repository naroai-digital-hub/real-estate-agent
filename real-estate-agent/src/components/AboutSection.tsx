import { Icon, SmartImage } from './ui'
import { IMAGES } from '../lib/images'

const POINTS = [
  {
    title: 'Local market knowledge',
    text: 'Neighborhood-level insight on pricing, demand and timing — so your decisions rest on facts, not guesswork.',
  },
  {
    title: 'Guidance for buyers & sellers',
    text: 'From first-time buyers to seasoned sellers, every plan is built around your goals, budget and timeline.',
  },
  {
    title: 'Clear, honest communication',
    text: 'Straight answers at every step. You always know what is happening, what comes next, and why.',
  },
  {
    title: 'A calm, professional process',
    text: 'Property moves are big decisions. We keep the experience organized, transparent and stress-free.',
  },
]

const STEPS = [
  {
    icon: 'briefcase',
    title: 'Choose your session',
    text: 'Pick the consultation that matches your goal — buying, selling, valuing or investing.',
  },
  {
    icon: 'calendar',
    title: 'Pick a time that suits you',
    text: 'See live availability and reserve a slot in under two minutes. In-person or virtual.',
  },
  {
    icon: 'users',
    title: 'Meet your agent',
    text: 'A focused one-on-one conversation about your property plans and the smartest next steps.',
  },
  {
    icon: 'key',
    title: 'Move forward with clarity',
    text: 'Leave with a clear strategy — whether that is a search plan, a listing roadmap, or numbers you trust.',
  },
] as const

export function ProcessStrip() {
  return (
    <section className="section process">
      <div className="wrap">
        <div className="center">
          <p className="kicker" style={{ justifyContent: 'center' }}>How it works</p>
          <h2 className="h-display">Booking is the easy part</h2>
          <p className="lead">
            Four simple steps between you and a clear, confident property plan.
          </p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={s.title}>
              <span className="step-num">0{i + 1}</span>
              <div className="step-icon">
                <Icon name={s.icon} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AboutSection({ businessName }: { businessName: string }) {
  return (
    <section className="section" id="about">
      <div className="wrap about-grid">
        <div className="about-visual">
          <div className="about-img-main">
            <SmartImage
              src={IMAGES.aboutMain}
              alt="Real estate professional reviewing documents with a client"
            />
          </div>
          <div className="about-img-layer">
            <SmartImage src={IMAGES.aboutLayer} alt="Agent and client shaking hands after a successful consultation" />
          </div>
          <div className="about-badge-card">
            <span className="ic">
              <Icon name="shield" />
            </span>
            <div>
              <b>Client-first advisory</b>
              <span>Honest guidance, zero pressure</span>
            </div>
          </div>
        </div>

        <div className="about-copy">
          <p className="kicker">About {businessName}</p>
          <h2 className="h-display">A property partner you can actually talk to</h2>
          <p>
            {businessName} is built on a simple belief: the best property
            decisions come from clear information and unhurried conversation.
            Whether you are buying your first home, selling a family property
            or weighing an investment, you get direct access to an agent who
            listens first and advises second.
          </p>
          <ul className="about-list">
            {POINTS.map((p) => (
              <li key={p.title}>
                <span className="tick">
                  <Icon name="check" />
                </span>
                <div>
                  <b>{p.title}</b>
                  <span>{p.text}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="agent-card">
            <span
              style={{
                width: 64, height: 64, borderRadius: '50%', flex: 'none',
                background: 'linear-gradient(135deg, #d4b476, #b98e46)',
                display: 'grid', placeItems: 'center', color: '#0d1b2e',
              }}
            >
              <Icon name="key" style={{ width: 28, height: 28 }} />
            </span>
            <div>
              <b>Your dedicated agent</b>
              <span>One point of contact from first consultation to final signature.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
