import type { Service } from '../lib/types'
import { formatDuration, formatPrice } from '../lib/booking'
import { serviceImageFor } from '../lib/images'
import { Icon, SmartImage } from './ui'

export default function ServicesSection({
  services,
  loading,
  onBook,
}: {
  services: Service[]
  loading: boolean
  onBook: (service: Service) => void
}) {
  return (
    <section className="section" id="services">
      <div className="wrap">
        <div className="services-head">
          <div>
            <p className="kicker">Real Estate Services</p>
            <h2 className="h-display">Consultations designed around your move</h2>
          </div>
          <p className="lead" style={{ maxWidth: 380 }}>
            Every appointment is one-on-one and tailored to your goals —
            choose the session that fits where you are today.
          </p>
        </div>

        {loading ? (
          <div className="state-box">
            <p>Loading services…</p>
          </div>
        ) : services.length === 0 ? (
          <div className="state-box">
            <Icon name="briefcase" />
            <h4>No services available yet</h4>
            <p>Please check back soon — new consultation options are added regularly.</p>
          </div>
        ) : (
          <div className="svc-grid">
            {services.map((s) => (
              <article className="svc-card" key={s.id}>
                <div className="svc-media">
                  <SmartImage src={serviceImageFor(s.name)} alt={s.name} />
                  <span className={`svc-price${s.price <= 0 ? ' free' : ''}`}>
                    {formatPrice(s.price)}
                  </span>
                </div>
                <div className="svc-body">
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <div className="svc-meta">
                    <span>
                      <Icon name="clock" /> {formatDuration(s.duration_minutes)}
                    </span>
                    <span>
                      <Icon name="user" /> 1-on-1 session
                    </span>
                  </div>
                  <button className="svc-book" onClick={() => onBook(s)}>
                    <Icon name="calendar" /> Book this service
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
