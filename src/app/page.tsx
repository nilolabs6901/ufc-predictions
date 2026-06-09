'use client';

/**
 * UFC PREDICTIONS — HOME PAGE
 * Design: UFC.com Editorial / Sports Broadcast Dark (ported from Manus redesign)
 * Typography: Barlow Condensed (headings, all-caps) + Barlow (body)
 * Colors: #0D0D0D bg, #D20A0A accent, white text
 * Event: UFC Freedom 250 — Topuria vs Gaethje, The White House, Jun 14 2026
 * Navbar + Footer are provided globally by the root layout.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  Shield,
  Clock,
  BarChart3,
  ExternalLink,
  ArrowRight,
  Award,
  Activity,
} from 'lucide-react';

// ─── Local background assets (downloaded from the redesign handoff) ──────────
const HERO_BG = '/hero-freedom250.webp';
const OCTAGON_BG = '/event-card-bg.webp';
const STATS_BG = '/stats-bg.webp';

// ─── Data — UFC Freedom 250 (scraped from UFC.com, Jun 8 2026) ───────────────
const upcomingEvents = [
  {
    id: 'ufc-freedom-250',
    name: 'UFC Freedom 250',
    date: 'Sun, Jun 14, 2026',
    time: '8:00 PM EDT',
    location: 'The White House, Washington, D.C.',
    type: 'PPV',
    isLive: false,
    subtitle: 'Presented by Crypto.com and RAM',
    watchLink: 'https://ufc.ac/4v2K4zW',
    mainEvent: {
      fighter1: '(C) Ilia Topuria',
      fighter2: '(IC) Justin Gaethje',
      division: 'Lightweight Title Bout',
    },
    mainCard: [
      { fighter1: 'Ilia Topuria', fighter2: 'Justin Gaethje', division: 'Lightweight Title Bout', rank1: 'C', rank2: 'IC', odds1: null, odds2: null },
      { fighter1: 'Alex Pereira', fighter2: 'Ciryl Gane', division: 'Heavyweight Interim Title Bout', rank1: '#1', rank2: null, odds1: -115, odds2: -105 },
      { fighter1: "Sean O'Malley", fighter2: 'Aiemann Zahabi', division: 'Bantamweight Bout', rank1: '#3', rank2: '#6', odds1: -360, odds2: 280 },
      { fighter1: 'Josh Hokit', fighter2: 'Derrick Lewis', division: 'Heavyweight Bout', rank1: '#5', rank2: '#9', odds1: -330, odds2: 265 },
      { fighter1: 'Mauricio Ruffy', fighter2: 'Michael Chandler', division: 'Lightweight Bout', rank1: '#9', rank2: '#13', odds1: -700, odds2: 500 },
      { fighter1: 'Bo Nickal', fighter2: 'Kyle Daukaus', division: 'Middleweight Bout', rank1: null, rank2: null, odds1: -300, odds2: 240 },
      { fighter1: 'Diego Lopes', fighter2: 'Steve Garcia', division: 'Featherweight Bout', rank1: '#2', rank2: '#9', odds1: -185, odds2: 155 },
    ],
    fights: 7,
  },
  {
    id: 'ufc-fight-night-june-20-2026',
    name: 'UFC Fight Night: Kape vs Horiguchi',
    date: 'Sat, Jun 20, 2026',
    time: '6:00 PM EDT',
    location: 'UFC APEX, Las Vegas, NV',
    type: 'Fight Night',
    isLive: false,
    subtitle: null,
    watchLink: null,
    mainEvent: { fighter1: 'Manel Kape', fighter2: 'Kyoji Horiguchi', division: 'Flyweight Bout' },
    mainCard: [],
    fights: null,
  },
  {
    id: 'ufc-fight-night-june-27-2026',
    name: 'UFC Fight Night: Fiziev vs Torres',
    date: 'Sat, Jun 27, 2026',
    time: '1:00 PM EDT',
    location: 'National Gymnastics Arena, Baku, Azerbaijan',
    type: 'Fight Night',
    isLive: false,
    subtitle: null,
    watchLink: null,
    mainEvent: { fighter1: 'Rafael Fiziev', fighter2: 'Ignacio Torres', division: 'Lightweight Bout' },
    mainCard: [],
    fights: null,
  },
  {
    id: 'ufc-329',
    name: 'UFC 329: McGregor vs Holloway 2',
    date: 'Sat, Jul 11, 2026',
    time: '10:00 PM EDT',
    location: 'T-Mobile Arena, Las Vegas, NV',
    type: 'PPV',
    isLive: false,
    subtitle: null,
    watchLink: null,
    mainEvent: { fighter1: 'Conor McGregor', fighter2: 'Max Holloway', division: 'Featherweight Bout' },
    mainCard: [],
    fights: null,
  },
  {
    id: 'ufc-fight-night-july-25-2026',
    name: 'UFC Fight Night: Ankalaev vs Rountree Jr.',
    date: 'Sat, Jul 25, 2026',
    time: '1:00 PM EDT',
    location: 'Etihad Arena, Abu Dhabi, UAE',
    type: 'Fight Night',
    isLive: false,
    subtitle: null,
    watchLink: null,
    mainEvent: { fighter1: 'Magomed Ankalaev', fighter2: 'Khalil Rountree Jr.', division: 'Light Heavyweight Bout' },
    mainCard: [],
    fights: null,
  },
];

const recentEvents = [
  { id: 'ufc-fight-night-june-6-2026', name: 'UFC Fight Night: Muhammad vs Bonfim', date: 'Sat, Jun 6, 2026', fights: null },
  { id: 'ufc-fight-night-may-30-2026', name: 'UFC Fight Night: Song vs Figueiredo', date: 'Sat, May 30, 2026', fights: null },
  { id: 'ufc-fight-night-may-16-2026', name: 'UFC Fight Night: Allen vs Costa', date: 'Sat, May 16, 2026', fights: null },
  { id: 'ufc-fight-night-may-9-2026', name: 'UFC Fight Night: Chimaev vs Strickland', date: 'Sat, May 9, 2026', fights: null },
];

const modelFactors = [
  { label: 'Style Analysis', pct: 15, desc: 'Grapplers vs Strikers, pressure vs counter fighters', icon: Target },
  { label: 'Striking Stats', pct: 12, desc: 'SLPM, accuracy, defense, absorption rate', icon: Zap },
  { label: 'Grappling Stats', pct: 12, desc: 'Takedown avg, accuracy, defense, submissions', icon: Shield },
  { label: 'Historical Form', pct: 12, desc: 'Win streaks, recent performance, ring rust', icon: TrendingUp },
  { label: 'Market Signal', pct: 10, desc: 'Betting odds implied probability', icon: BarChart3 },
  { label: 'Durability', pct: 8, desc: "Times KO'd, times submitted, chin status", icon: Activity },
  { label: 'Championship Exp', pct: 4, desc: '5-round fight experience and late round wins', icon: Award },
  { label: 'Environment', pct: 8, desc: 'Altitude, cage size, travel distance', icon: Clock },
];

const keyFindings = [
  'UFC favorites win ~66% of the time (not 75% as commonly cited)',
  'Southpaws have ~3% advantage vs orthodox fighters',
  'Grapplers beat strikers ~60% of the time',
  'High altitude (>1500m) significantly impacts cardio',
];

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const nextEvent = upcomingEvents[0];

  return (
    <section style={{ position: 'relative', width: '100%', minHeight: '560px', overflow: 'hidden', backgroundColor: '#0D0D0D' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.3) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 60%)' }} />

      <div
        className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8"
        style={{ position: 'relative', zIndex: 10, paddingTop: '80px', paddingBottom: '80px', minHeight: '560px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div className="flex flex-wrap items-center gap-3 mb-4 animate-slide-up">
            <span
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              {nextEvent.type} · Next Event
            </span>
            <span
              style={{
                backgroundColor: 'rgba(201,162,39,0.15)',
                color: '#C9A227',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                border: '1px solid rgba(201,162,39,0.4)',
              }}
            >
              Making Chama Great Again
            </span>
          </div>

          <p
            className="animate-slide-up-delay-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}
          >
            {nextEvent.name} | {nextEvent.subtitle}
          </p>

          <h1
            className="animate-slide-up-delay-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(3rem, 9vw, 6.5rem)', lineHeight: 0.9, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: '12px', textShadow: '0 2px 30px rgba(0,0,0,0.6)' }}
          >
            TOPURIA VS GAETHJE
          </h1>

          <p
            className="animate-slide-up-delay-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 'clamp(0.85rem, 1.8vw, 1.1rem)', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}
          >
            History Will Be Made When The Octagon Touches Down At The White House
          </p>

          <p
            className="animate-slide-up-delay-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 'clamp(0.8rem, 1.6vw, 1rem)', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A227', marginBottom: '12px', fontStyle: 'italic' }}
          >
            Totally Gonna Chama On Your Mama
          </p>

          <div className="animate-slide-up-delay-2" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
              {nextEvent.mainEvent.fighter1}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: '#D20A0A', letterSpacing: '0.05em' }}>VS</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
              {nextEvent.mainEvent.fighter2}
            </span>
          </div>

          <p className="animate-slide-up-delay-2" style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 400, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '28px', letterSpacing: '0.04em' }}>
            {nextEvent.date} · {nextEvent.time} · {nextEvent.location}
          </p>

          <div className="flex flex-wrap gap-4 animate-slide-up-delay-3">
            <Link href={`/events/${nextEvent.id}`} className="ufc-btn-primary inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
              View Fight Card
              <ChevronRight size={16} />
            </Link>
            <a href="https://ufc.ac/4v2K4zW" target="_blank" rel="noopener noreferrer" className="ufc-btn-outline inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
              Watch on Paramount+
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: '14+', label: 'Analysis Factors' },
    { value: '66%', label: 'Favorite Win Rate' },
    { value: 'v1.0.0', label: 'Model Version' },
    { value: 'Research-Backed', label: 'Data-Driven' },
  ];
  return (
    <div style={{ backgroundColor: '#D20A0A' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '1.4rem', color: '#FFFFFF', letterSpacing: '0.02em' }}>{stat.value}</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, isUpcoming }: { event: (typeof upcomingEvents)[0] | (typeof recentEvents)[0]; isUpcoming: boolean }) {
  const upEvent = isUpcoming ? (event as (typeof upcomingEvents)[0]) : null;

  return (
    <Link href={`/events/${event.id}`}>
      <div className="event-card" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${OCTAGON_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(210,10,10,0.08) 0%, transparent 60%)' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: '24px' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isUpcoming && upEvent?.type && (
                <span style={{ backgroundColor: '#D20A0A', color: '#FFFFFF', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '2px 8px' }}>
                  {upEvent.type}
                </span>
              )}
            </div>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 500, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{event.date}</span>
          </div>

          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.03em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: '12px', lineHeight: 1.1 }}>
            {event.name}
          </h3>

          {isUpcoming && upEvent?.mainEvent && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginBottom: '16px' }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Main Event</p>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', color: '#FFFFFF' }}>{upEvent.mainEvent.fighter1}</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '0.9rem', color: '#D20A0A' }}>VS</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', color: '#FFFFFF' }}>{upEvent.mainEvent.fighter2}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 400, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              {event.fights ? `${event.fights} fights` : 'Card TBA'}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D20A0A', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Predictions
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Fight Card Section ──────────────────────────────────────────────────────
function confLabel(c: number) {
  return c >= 0.7 ? 'High' : c >= 0.55 ? 'Medium' : 'Low';
}

function FightCardSection() {
  const event = upcomingEvents[0];
  const fights = event.mainCard;
  const [details, setDetails] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(0); // main event expanded by default

  useEffect(() => {
    fetch(`/api/events/${event.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const map: Record<string, any> = {};
        for (const f of d?.fights?.mainCard ?? []) {
          map[[f.fighterA.name, f.fighterB.name].sort().join('|')] = f;
        }
        setDetails(map);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [event.id]);

  const detailFor = (f: (typeof fights)[0]) =>
    details[[f.fighter1, f.fighter2].sort().join('|')];

  return (
    <section style={{ backgroundColor: '#0D0D0D', padding: '64px 0' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="ufc-section-title" style={{ fontSize: '1.5rem', color: '#FFFFFF', marginBottom: '4px' }}>Main Card</h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', paddingLeft: '1.25rem' }}>
              {event.name} · {event.date} · {event.time}
            </p>
          </div>
          <a
            href="https://ufc.ac/4v2K4zW"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D20A0A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #D20A0A', padding: '8px 16px' }}
          >
            Watch on Paramount+
          </a>
        </div>

        <div className="flex flex-col gap-2">
          {fights.map((fight, i) => {
            const d = detailFor(fight);
            const pred = d?.prediction;
            const isOpen = openIdx === i;
            const imgA: string | null = d?.fighterA?.imageUrl ?? null;
            const imgB: string | null = d?.fighterB?.imageUrl ?? null;

            let aWin = false, pickName = '', pickProb = 0, aProb = 50, bProb = 50;
            if (d && pred) {
              aWin = pred.predictedWinnerId === d.fighterA.id;
              aProb = Math.round(pred.fighterAWinProb * 100);
              bProb = 100 - aProb;
              pickName = aWin ? d.fighterA.name : d.fighterB.name;
              pickProb = aWin ? aProb : bProb;
            }

            const avatar = (src: string | null) => (
              <span style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#2a2a2a', display: 'inline-block', border: '1px solid rgba(255,255,255,0.1)' }}>
                {src && (
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                )}
              </span>
            );

            return (
              <div
                key={i}
                style={{
                  backgroundColor: i === 0 ? 'rgba(210,10,10,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isOpen
                    ? '1px solid rgba(210,10,10,0.55)'
                    : i === 0
                    ? '1px solid rgba(210,10,10,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  transition: 'border-color 150ms ease-out',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', textAlign: 'left' }}
                >
                  {/* Fighter 1 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {fight.rank1 && (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.7rem', color: fight.rank1 === 'C' || fight.rank1 === 'IC' ? '#C9A84C' : 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', minWidth: '20px' }}>
                        {fight.rank1}
                      </span>
                    )}
                    {avatar(imgA)}
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', color: aWin && pred ? '#4ade80' : '#FFFFFF', letterSpacing: '0.03em' }}>{fight.fighter1}</p>
                      {fight.odds1 !== null && (
                        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.75rem', color: fight.odds1 < 0 ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
                          {fight.odds1 > 0 ? `+${fight.odds1}` : fight.odds1}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Center */}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '0.9rem', color: '#D20A0A', letterSpacing: '0.1em' }}>VS</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px', maxWidth: '120px' }}>{fight.division}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D20A0A' }}>
                      {isOpen ? 'Hide' : 'Prediction'}
                      <ChevronRight size={11} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }} />
                    </span>
                  </div>

                  {/* Fighter 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', color: !aWin && pred ? '#4ade80' : '#FFFFFF', letterSpacing: '0.03em' }}>{fight.fighter2}</p>
                      {fight.odds2 !== null && (
                        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.75rem', color: fight.odds2 > 0 ? 'rgba(255,255,255,0.5)' : '#4ade80' }}>
                          {fight.odds2 > 0 ? `+${fight.odds2}` : fight.odds2}
                        </p>
                      )}
                    </div>
                    {avatar(imgB)}
                    {fight.rank2 && (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.7rem', color: fight.rank2 === 'C' || fight.rank2 === 'IC' ? '#C9A84C' : 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', minWidth: '20px', textAlign: 'right' }}>
                        {fight.rank2}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expandable prediction panel */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '18px 24px', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    {!loaded ? (
                      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>Loading prediction…</p>
                    ) : !pred ? (
                      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>AI prediction unavailable for this bout.</p>
                    ) : (
                      <>
                        {/* Win probability bar */}
                        <div className="flex items-center justify-between" style={{ marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <span style={{ color: aWin ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>{d.fighterA.name} {aProb}%</span>
                          <span style={{ color: !aWin ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>{bProb}% {d.fighterB.name}</span>
                        </div>
                        <div style={{ display: 'flex', height: '8px', width: '100%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                          <div style={{ width: `${aProb}%`, backgroundColor: aWin ? '#22c55e' : '#D20A0A' }} />
                          <div style={{ width: `${bProb}%`, backgroundColor: !aWin ? '#22c55e' : 'rgba(255,255,255,0.25)' }} />
                        </div>

                        {/* Pick + confidence */}
                        <div className="flex items-center flex-wrap gap-2" style={{ marginTop: '14px' }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>AI Model Pick</span>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', color: '#FFFFFF', letterSpacing: '0.03em' }}>{pickName} · {pickProb}%</span>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', color: pred.confidence >= 0.7 ? '#4ade80' : pred.confidence >= 0.55 ? '#facc15' : 'rgba(255,255,255,0.5)', border: '1px solid currentColor' }}>{confLabel(pred.confidence)} confidence</span>
                        </div>

                        {/* Insights */}
                        {pred.insights?.length > 0 && (
                          <div className="flex flex-wrap gap-2" style={{ marginTop: '12px' }}>
                            {pred.insights.slice(0, 4).map((ins: string, k: number) => (
                              <span key={k} style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', backgroundColor: 'rgba(255,255,255,0.05)', borderLeft: '2px solid #D20A0A', padding: '5px 10px' }}>{ins}</span>
                            ))}
                          </div>
                        )}

                        {/* Full breakdown link */}
                        <Link href={`/events/${event.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '14px', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D20A0A', textDecoration: 'none' }}>
                          View full breakdown
                          <ChevronRight size={13} />
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Events Section ──────────────────────────────────────────────────────────
function EventsSection() {
  return (
    <section style={{ backgroundColor: '#111111', padding: '64px 0' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="ufc-section-title" style={{ fontSize: '1.5rem', marginBottom: '24px', color: '#FFFFFF' }}>Upcoming Events</h2>
            <div className="flex flex-col gap-4">
              {upcomingEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} isUpcoming={true} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="ufc-section-title" style={{ fontSize: '1.5rem', marginBottom: '24px', color: '#FFFFFF' }}>Recent Events</h2>
            <div className="flex flex-col gap-4">
              {recentEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} isUpcoming={false} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Tools Section ───────────────────────────────────────────────────────────
function ToolsSection() {
  const tools = [
    { href: '/parlay', title: 'Parlay Builder', desc: 'Build parlays with correlation analysis and edge calculation', icon: BarChart3, color: '#D20A0A' },
    { href: '/accuracy', title: 'Model Accuracy', desc: 'Calibration charts, Brier score, and performance tracking', icon: TrendingUp, color: '#C9A84C' },
  ];

  return (
    <section style={{ backgroundColor: '#0D0D0D', padding: '64px 0' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="ufc-section-title" style={{ fontSize: '1.5rem', marginBottom: '32px', color: '#FFFFFF' }}>Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.title} href={tool.href}>
                <div className="event-card" style={{ padding: '32px', display: 'flex', alignItems: 'flex-start', gap: '20px', cursor: 'pointer' }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: tool.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color="#FFFFFF" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.03em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: '6px' }}>{tool.title}</h3>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 400, fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{tool.desc}</p>
                  </div>
                  <ExternalLink size={16} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Model Factors Section ───────────────────────────────────────────────────
function ModelSection() {
  const [animated, setAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} style={{ position: 'relative', backgroundColor: '#111111', padding: '80px 0', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${STATS_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 2 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="ufc-section-title" style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#FFFFFF' }}>Prediction Model</h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '32px', paddingLeft: '1.25rem' }}>14+ weighted factors analyzed per fight</p>

            <div className="flex flex-col gap-5">
              {modelFactors.map((factor, i) => {
                const Icon = factor.icon;
                return (
                  <div key={factor.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: '#D20A0A' }} />
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF' }}>{factor.label}</span>
                      </div>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#D20A0A' }}>{factor.pct}%</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                      <div className="prob-bar-fill" style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: '#D20A0A', width: animated ? `${(factor.pct / 15) * 100}%` : '0%', transitionDelay: `${i * 60}ms` }} />
                    </div>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{factor.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="ufc-section-title" style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#FFFFFF' }}>Key Research Findings</h2>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '32px', paddingLeft: '1.25rem' }}>Derived from academic studies on MMA fight outcomes</p>

            <div className="flex flex-col gap-4 mb-10">
              {keyFindings.map((finding, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #D20A0A' }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#D20A0A', lineHeight: 1, marginTop: '2px' }}>{String(i + 1).padStart(2, '0')}</span>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{finding}</p>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: 'rgba(210,10,10,0.08)', border: '1px solid rgba(210,10,10,0.25)', padding: '24px' }}>
              <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: '8px' }}>About the Model</h4>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '12px' }}>
                Version 1.0.0 uses research-backed weights derived from academic studies on MMA fight outcomes. Built with Next.js, Prisma, and AI.
              </p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                Predictions are for informational purposes only. Past performance does not guarantee future results. Please gamble responsibly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ backgroundColor: '#0D0D0D', display: 'flex', flexDirection: 'column' }}>
      <HeroSection />
      <StatsBar />
      <FightCardSection />
      <EventsSection />
      <ToolsSection />
      <ModelSection />
    </div>
  );
}
