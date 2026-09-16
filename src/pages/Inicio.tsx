import { Icon } from '../icons';
import type { Landing, Link as TLink, Settings } from '../types';

function multiline(s: string) {
  return s.split('\n').map((line, i, a) => (
    <span key={i}>{line}{i < a.length - 1 ? <br /> : null}</span>
  ));
}

function extAttrs(href: string) {
  const ext = !(href.startsWith('#') || href.startsWith('/'));
  return ext ? { target: '_blank', rel: 'noreferrer' } : {};
}

function CtaLink({ link, cls }: { link: TLink; cls: string }) {
  return <a className={cls} href={link.href || '#'} {...extAttrs(link.href)}>{link.label}</a>;
}

export function Inicio({ settings, landing }: { settings: Settings; landing: Landing; ready: boolean }) {
  const { hero, features, banner } = landing;
  const discord = settings.discordUrl || '#';

  return (
    <>
      {/* ── HERO ── */}
      <section
        className="hero"
        style={hero.bg ? { backgroundImage: `url(${hero.bg})` } : undefined}
      >
        <div className="hero-shade" />
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">{hero.eyebrow}</span>
            <h1>{multiline(hero.title)}</h1>
            <p className="lead">{hero.subtitle}</p>
            <div className="hero-cta">
              <a className="btn pill-discord" href={hero.ctaPrimary.href || discord} {...extAttrs(hero.ctaPrimary.href || discord)}>
                <Icon name="discord" size={18} /> Discord
              </a>
              <CtaLink link={hero.ctaSecondary} cls="btn" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section wrap">
        <div className="feat-head">
          <span className="eyebrow">{landing.featuresEyebrow}</span>
          <h2>{multiline(landing.featuresTitle)}</h2>
          <p className="muted">{landing.featuresSubtitle}</p>
        </div>
        <div className="feats">
          {features.map((f, i) => (
            <div className="feat hover-lift" key={i}>
              <div className="feat-ic"><Icon name={f.icon} size={22} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <a className="feat-link" href={f.link.href || '#'} {...extAttrs(f.link.href)}>
                {f.link.label} <Icon name="arrow" size={15} />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── BANNER ── */}
      <section className="wrap" style={{ paddingBottom: 40 }}>
        <div className="banner">
          {banner.bg
            ? <img src={banner.bg} alt="" />
            : <div className="banner-fallback" />}
          <div className="banner-in">
            <h2>{multiline(banner.title)}</h2>
            <p>{banner.text}</p>
            <div className="hero-cta">
              <a className="btn pill-discord" href={discord} target="_blank" rel="noreferrer">
                <Icon name="discord" size={18} /> Discord
              </a>
              {settings.tebexUrl
                ? <a className="btn" href={settings.tebexUrl} target="_blank" rel="noreferrer">Tienda</a>
                : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
