import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';
import type { CrowdZone, Incident } from '../types';

const SERVICES = [
  { icon: '<path d="M3 3h18M4 3v11a2 2 0 002 2h12a2 2 0 002-2V3M9 21v-6h6v6"/>', tag: 'New', title: 'Food & drink pre-order', desc: 'Order ahead and skip the concession line entirely.' },
  { icon: '<path d="M4 12l8-8 8 8M6 10v10h12V10"/>', tag: '', title: 'Seat upgrade', desc: 'Bid on open premium seats that free up live.' },
  { icon: '<circle cx="12" cy="13" r="3.2"/><path d="M4 8l1.5-3h13L20 8M7 8h10v11H7z"/>', tag: 'New', title: 'AR wayfinder', desc: 'Point your camera, follow the arrow to your gate.' },
  { icon: '<path d="M4 6h16M4 12h16M4 18h10"/>', tag: '', title: 'Instant replays', desc: 'Rewatch the last goal from any camera angle.' },
  { icon: '<path d="M20 7h-3l-2-3H9L7 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"/><circle cx="12" cy="13" r="3"/>', tag: '', title: 'Merch store', desc: 'Order gear online, pick up near your gate.' },
  { icon: '<path d="M3 13l2-7h14l2 7M5 13v6h14v-6M5 13h14"/>', tag: '', title: 'Parking & rideshare', desc: 'Reserve a spot or book a ride home after the match.' },
  { icon: '<path d="M12 21s-7-5.2-7-11a7 7 0 0114 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/>', tag: '', title: 'Lost & found', desc: 'Report or search for lost items in real time.' },
  { icon: '<path d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-9-9 9 9 0 019 9z"/>', tag: '', title: 'Multilingual concierge', desc: 'Chat with Fanflow in your language, any time.' }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<CrowdZone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let crowdData: CrowdZone[] = [];
        let incData: Incident[] = [];

        try {
          const [crowdRes, incRes] = await Promise.all([
            fetch('/api/crowd'),
            fetch('/api/incidents')
          ]);
          
          if (crowdRes.ok) crowdData = await crowdRes.json();
          if (incRes.ok) incData = await incRes.json();
        } catch (fetchErr) {
          console.warn('API fetch failed, using fallback data.', fetchErr);
        }

        // Mock Fallback Data matching OpsWorkspace & Visualizer
        if (!crowdData || crowdData.length === 0) {
          crowdData = [
            { zoneId: 'z1', name: 'North Stand', density: 86, capacity: 10000, currentCount: 8600, status: 'HIGH', updatedAt: new Date().toISOString() },
            { zoneId: 'z2', name: 'East Stand', density: 70, capacity: 12000, currentCount: 8400, status: 'MEDIUM', updatedAt: new Date().toISOString() },
            { zoneId: 'z3', name: 'South Stand', density: 55, capacity: 10000, currentCount: 5500, status: 'LOW', updatedAt: new Date().toISOString() },
            { zoneId: 'z4', name: 'West Stand', density: 49, capacity: 12000, currentCount: 5880, status: 'LOW', updatedAt: new Date().toISOString() }
          ];
        }

        setZones(Array.isArray(crowdData) ? crowdData : []);
        setIncidents(Array.isArray(incData) ? incData : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const overallCapacity = useMemo(() => zones.length > 0 ? Math.round(zones.reduce((acc, z) => acc + z.density, 0) / zones.length) : 64, [zones]);
  const avgWaitTime = useMemo(() => zones.length > 0 ? Math.max(2, Math.round(overallCapacity / 10)) : 6, [zones, overallCapacity]);
  const criticalZones = useMemo(() => zones.filter(z => z.density >= 80).length, [zones]);
  const activeAlerts = useMemo(() => incidents.filter(i => i.status === 'active').length + criticalZones, [incidents, criticalZones]);

  useEffect(() => {
    // Magnetic spotlight on role cards
    document.querySelectorAll('.role-card').forEach((card: Element) => {
      const htmlCard = card as HTMLElement;
      const handleMouseMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const spot = card.querySelector('.role-spot') as HTMLElement;
        if (spot) {
          spot.style.left = (e.clientX - r.left - 110) + 'px';
          spot.style.top = (e.clientY - r.top - 110) + 'px';
        }
        const cx = (e.clientX - r.left) / r.width - 0.5;
        const cy = (e.clientY - r.top) / r.height - 0.5;
        htmlCard.style.transform = `perspective(600px) rotateY(${cx * 4}deg) rotateX(${-cy * 4}deg) translateY(-2px)`;
      };
      const handleMouseLeave = () => {
        htmlCard.style.transform = '';
      };

      htmlCard.addEventListener('mousemove', handleMouseMove as EventListener);
      htmlCard.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        htmlCard.removeEventListener('mousemove', handleMouseMove as EventListener);
        htmlCard.removeEventListener('mouseleave', handleMouseLeave);
      };
    });

    // Spotlight on service cards
    document.querySelectorAll('.service-card').forEach((card: Element) => {
      const handleMouseMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const spot = card.querySelector('.service-spot') as HTMLElement;
        if (spot) {
          spot.style.left = (e.clientX - r.left - 90) + 'px';
          spot.style.top = (e.clientY - r.top - 90) + 'px';
        }
      };
      card.addEventListener('mousemove', handleMouseMove as EventListener);
      return () => card.removeEventListener('mousemove', handleMouseMove as EventListener);
    });

    // Scroll reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          setTimeout(() => { entry.target.classList.add('in'); }, idx * 40);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Count-up numbers + bar fill on reveal
    const animateCount = (el: HTMLElement) => {
      const rawTarget = el.getAttribute('data-count');
      if (!rawTarget) return;
      const target = parseInt(rawTarget, 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const start = performance.now();
      const dur = 900;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const statIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.stat-num').forEach((el: Element) => {
            animateCount(el as HTMLElement);
          });
          entry.target.querySelectorAll('.bar-fill').forEach((b: Element) => {
            const htmlB = b as HTMLElement;
            setTimeout(() => { htmlB.style.width = htmlB.getAttribute('data-width') + '%'; }, 150);
          });
          statIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.stats').forEach(el => statIO.observe(el));

    return () => {
      io.disconnect();
      statIO.disconnect();
    };
  }, []);

  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 home-container">
      <style>{`
        .home-container {
          --bg:#0A0714;
          --bg-2:#0F0B1C;
          --surface:#161028;
          --surface-2:#1E1836;
          --border: rgba(255,255,255,0.08);
          --border-strong: rgba(255,255,255,0.16);
          --text-1:#F6F3FA;
          --text-2:#A79BC0;
          --text-3:#655B7E;
          --gold:#F5B942;
          --gold-dim:#2E230F;
          --violet:#9D7BFF;
          --violet-dim:#221A3E;
          --crimson:#FF5D6C;
          --crimson-dim:#331419;

          background: var(--bg);
          color: var(--text-1);
          font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow-x: hidden;
          min-height: 100vh;
        }

        .wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; position: relative; z-index: 2; }

        .stage { position: absolute; top: 0; left: 0; right: 0; height: 820px; overflow: hidden; z-index: 0; pointer-events: none; }
        .floodlight { position: absolute; width: 1400px; height: 1400px; top: -1100px; left: 50%; margin-left: -700px;
          background: conic-gradient(from 0deg, transparent 0deg, rgba(245,185,66,0.10) 8deg, transparent 20deg, transparent 180deg, rgba(157,123,255,0.09) 190deg, transparent 205deg, transparent 360deg);
          animation: sweep 18s linear infinite; }
        @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .grain { position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 3px 3px; opacity: 0.5; mix-blend-mode: overlay; }
        .crowd { position: absolute; left: 0; right: 0; bottom: 0; height: 220px; display: flex; align-items: flex-end; justify-content: space-between; padding: 0 4%; opacity: 0.5; }
        .crowd i { width: 2px; height: 10px; background: var(--gold); border-radius: 2px; animation: twinkle 2.4s ease-in-out infinite; display: block; }
        .crowd i:nth-child(3n) { background: var(--violet); animation-duration: 3.1s; }
        .crowd i:nth-child(5n) { background: var(--text-2); animation-duration: 2.8s; height: 6px; }
        @keyframes twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.9; } }
        .ball-track { position: absolute; top: 120px; left: 0; right: 0; height: 2px; }
        .ball { position: absolute; width: 9px; height: 9px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fff, var(--gold) 70%);
          box-shadow: 0 0 10px rgba(245,185,66,0.7);
          animation: roll 7s cubic-bezier(.45,0,.55,1) infinite; }
        @keyframes roll {
          0% { left: -2%; top: 0px; transform: rotate(0deg); }
          48% { top: -26px; }
          50% { left: 50%; top: -34px; transform: rotate(540deg); }
          52% { top: -26px; }
          100% { left: 104%; top: 0px; transform: rotate(1080deg); }
        }

        .reveal { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }

        .home-main { padding: 64px 0 0; position: relative; z-index: 2; }
        .eyebrow { display: flex; align-items: center; gap: 8px; color: var(--gold); font-size: 12px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 14px; }
        .eyebrow-line { width: 24px; height: 1px; background: var(--gold); }
        .hero-title { font-size: 44px; line-height: 1.08; letter-spacing: -0.5px; max-width: 640px; margin-bottom: 14px; }
        .hero-title em { font-style: normal; color: var(--gold); }
        .sub { color: var(--text-2); font-size: 16px; max-width: 520px; line-height: 1.55; margin-bottom: 40px; }

        .roles { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 56px; }
        .role-card { position: relative; overflow: hidden; background: rgba(22,16,40,0.75); backdrop-filter: blur(6px); border: 1px solid var(--border); border-radius: 14px; padding: 28px; cursor: pointer;
          transition: border-color .15s, transform .12s ease-out, box-shadow .2s; transform-style: preserve-3d; will-change: transform; }
        .role-card:hover { border-color: var(--border-strong); box-shadow: 0 16px 40px rgba(0,0,0,0.35); }
        .role-card.fan { border-top: 2px solid var(--violet); }
        .role-card.ops { border-top: 2px solid var(--gold); }
        .role-spot { position: absolute; width: 220px; height: 220px; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .25s; filter: blur(10px); }
        .role-card:hover .role-spot { opacity: 0.16; }
        .role-card.fan .role-spot { background: var(--violet); }
        .role-card.ops .role-spot { background: var(--gold); }
        .role-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; transition: transform .25s cubic-bezier(.34,1.56,.64,1); position: relative; }
        .role-card:hover .role-icon { transform: scale(1.12) rotate(-4deg); }
        .role-card.fan .role-icon { background: var(--violet-dim); color: var(--violet); }
        .role-card.ops .role-icon { background: var(--gold-dim); color: var(--gold); }
        .role-card h3 { font-size: 19px; margin-bottom: 8px; position: relative; }
        .role-card p { color: var(--text-2); font-size: 13.5px; line-height: 1.55; margin-bottom: 20px; max-width: 360px; position: relative; }
        .role-cta { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; position: relative; }
        .role-cta svg { transition: transform .2s; }
        .role-card:hover .role-cta svg { transform: translateX(4px); }
        .role-card.fan .role-cta { color: var(--violet); }
        .role-card.ops .role-cta { color: var(--gold); }

        .stats-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .stats-label h4 { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-3); font-weight: 700; }
        .stats-label a { font-size: 12px; color: var(--text-2); text-decoration: none; cursor: pointer; }
        .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 64px; }
        .stat-card { background: rgba(22,16,40,0.75); backdrop-filter: blur(6px); border: 1px solid var(--border); border-radius: 12px; padding: 18px; transition: transform .15s, border-color .15s; }
        .stat-card:hover { transform: translateY(-3px); border-color: var(--border-strong); }
        .stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .stat-name { font-size: 12px; color: var(--text-2); font-weight: 600; }
        .dot { width: 7px; height: 7px; border-radius: 50%; }
        .dot.gold { background: var(--gold); box-shadow: 0 0 0 0 rgba(245,185,66,.6); animation: dotpulse 2s infinite; }
        .dot.violet { background: var(--violet); }
        .dot.crimson { background: var(--crimson); box-shadow: 0 0 0 0 rgba(255,93,108,.6); animation: dotpulse 1.4s infinite; }
        @keyframes dotpulse { 0%,100% { box-shadow: 0 0 0 0 currentColor; opacity: 1;} 50% { box-shadow: 0 0 0 4px transparent; opacity: .7; } }
        .stat-num { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
        .bar-track { height: 4px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; width: 0%; transition: width 1.1s cubic-bezier(.22,1,.36,1); }

        .services { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 64px; }
        .service-card { position: relative; background: rgba(22,16,40,0.75); backdrop-filter: blur(6px); border: 1px solid var(--border); border-radius: 14px; padding: 20px; overflow: hidden;
          transition: transform .18s ease-out, border-color .18s; cursor: pointer; }
        .service-card:hover { border-color: var(--border-strong); transform: translateY(-4px); }
        .service-spot { position: absolute; width: 180px; height: 180px; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .25s; filter: blur(16px); background: var(--gold); }
        .service-card:hover .service-spot { opacity: 0.14; }
        .service-icon { width: 34px; height: 34px; border-radius: 9px; background: var(--surface-2); color: var(--gold); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; transition: transform .3s cubic-bezier(.34,1.56,.64,1); position: relative; }
        .service-card:hover .service-icon { transform: scale(1.15) rotate(6deg); }
        .service-card h4 { font-size: 14px; margin-bottom: 6px; position: relative; }
        .service-card p { font-size: 12px; color: var(--text-2); line-height: 1.5; position: relative; }
        .service-tag { position: absolute; top: 16px; right: 16px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--violet); background: var(--violet-dim); padding: 3px 7px; border-radius: 5px; }

        .teaser { display: grid; grid-template-columns: 1fr 1fr; gap: 0; background: rgba(22,16,40,0.75); backdrop-filter: blur(6px); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 64px; }
        .teaser-left { padding: 36px; display: flex; flex-direction: column; justify-content: center; }
        .teaser-left h3 { font-size: 22px; margin-bottom: 10px; }
        .teaser-left p { color: var(--text-2); font-size: 13.5px; line-height: 1.6; margin-bottom: 20px; max-width: 340px; }
        .teaser-btn { align-self: flex-start; background: var(--text-1); color: var(--bg); font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 8px; transition: transform .15s; }
        .teaser-btn:hover { transform: scale(1.04); }
        .teaser-right { background: var(--bg-2); display: flex; align-items: center; justify-content: center; padding: 32px; position: relative; }
        .ring { width: 220px; height: 220px; border-radius: 50%; border: 14px solid var(--surface-2); position: relative; display: flex; align-items: center; justify-content: center; animation: spin 26s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ring::before { content: ''; position: absolute; inset: -14px; border-radius: 50%; border: 14px solid transparent; border-top-color: var(--violet); border-right-color: var(--violet); }
        .ring::after { content: ''; position: absolute; inset: -14px; border-radius: 50%; border: 14px solid transparent; border-bottom-color: var(--gold); }
        .ring-center { text-align: center; animation: spin 26s linear infinite reverse; }
        .ring-center .n { font-size: 26px; font-weight: 700; }
        .ring-center .l { font-size: 10px; color: var(--text-2); letter-spacing: 0.6px; text-transform: uppercase; }

        .home-footer { border-top: 1px solid var(--border); background: var(--bg-2); margin-top: 20px; position: relative; z-index: 2; padding-top: 48px; }
        .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; padding-bottom: 32px; }
        .footer-col h5 { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-3); font-weight: 700; margin-bottom: 16px; }
        .footer-col p { color: var(--text-2); font-size: 13px; line-height: 1.6; max-width: 220px; }
        .footer-col ul { list-style: none; }
        .footer-col li { margin-bottom: 10px; }
        .footer-col a { color: var(--text-2); text-decoration: none; font-size: 13px; cursor: pointer; }
        .footer-col a:hover { color: var(--text-1); }
        .transit-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 13px; color: var(--text-2); }
        .transit-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .footer-bottom { border-top: 1px solid var(--border); padding: 18px 0; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-3); gap: 12px; flex-wrap: wrap; }
        .footer-bottom span em { color: var(--text-2); font-style: normal; }

        @media(max-width:900px) {
          .roles { grid-template-columns: 1fr; }
          .stats { grid-template-columns: 1fr 1fr; }
          .services { grid-template-columns: 1fr 1fr; }
          .teaser { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
          .hero-title { font-size: 32px; }
          .home-footer { padding-top: 36px; }
          .home-main { padding: 40px 0 0; }
        }
        @media(max-width:600px) {
          .wrap { padding: 0 16px; }
          .hero-title { font-size: 26px; letter-spacing: -0.3px; }
          .sub { font-size: 14px; margin-bottom: 28px; }
          .home-main { padding: 28px 0 0; }
          .role-card { padding: 20px; }
          .roles { margin-bottom: 36px; gap: 12px; }
          .stats { grid-template-columns: 1fr 1fr; gap: 10px; }
          .services { grid-template-columns: 1fr; gap: 10px; }
          .teaser-left { padding: 0; }
          .teaser-right { display: none; }
          .footer-grid { grid-template-columns: 1fr; gap: 28px; padding-bottom: 24px; }
          .footer-col p { max-width: 100%; }
          .footer-col:first-child { padding-bottom: 4px; border-bottom: 1px solid var(--border); }
          .home-footer { padding-top: 28px; }
          .footer-bottom { flex-direction: column; align-items: flex-start; gap: 10px; padding: 16px 0; }
          .footer-bottom > div { width: 100%; justify-content: flex-start; }
          .stats-label { flex-direction: column; align-items: flex-start; gap: 6px; }
        }
      `}</style>

      <div className="stage">
        <div className="floodlight"></div>
        <div className="grain"></div>
        <div className="ball-track"><div className="ball"></div></div>
        <div className="crowd">
          {Array.from({ length: 90 }).map((_, i) => (
            <i key={i} style={{ height: (6 + Math.random() * 14) + 'px', animationDelay: (Math.random() * 2.4) + 's' }}></i>
          ))}
        </div>
      </div>

      <main className="home-main">
        <div className="wrap">
          <div className="eyebrow reveal"><span className="eyebrow-line"></span>FIFA World Cup 2026 &middot; Smart Stadium Platform</div>
          <h1 className="hero-title reveal">Your matchday, <em>mapped and monitored.</em></h1>
          <p className="sub reveal">Fanflow gives fans an AI concierge for navigating the stadium in real time, and gives ops teams a live view of crowd density and incidents as they happen.</p>

          <div className="roles">
            <div className="role-card fan reveal" onClick={() => navigate('/fan')}>
              <div className="role-spot"></div>
              <div className="role-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></svg>
              </div>
              <h3>I'm attending</h3>
              <p>Ask Fanflow for the shortest food line, an accessible route to your seat, or how to get to Gate G2 before kickoff.</p>
              <div className="role-cta">Open Matchday Assistant <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
            </div>
            <div className="role-card ops reveal" onClick={() => navigate('/ops')}>
              <div className="role-spot"></div>
              <div className="role-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12l4-7h10l4 7-4 7H7l-4-7z" /><path d="M12 8v4l2.5 2.5" /></svg>
              </div>
              <h3>I'm working this match</h3>
              <p>Monitor live crowd density, triage incidents, and track gate flow across all four stands from one workspace.</p>
              <div className="role-cta">Open Stadium Command <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
            </div>
          </div>

          <div className="stats-label reveal">
            <h4>Live stadium status</h4>
            <a onClick={() => navigate('/visualizer')}>Full visualizer &rarr;</a>
          </div>
          <div className="stats reveal">
            <div className="stat-card">
              <div className="stat-top"><span className="stat-name">Overall capacity</span><span className="dot gold"></span></div>
              <div className="stat-num">{overallCapacity}%</div>
              <div className="bar-track"><div className="bar-fill transition-all duration-1000" data-width={overallCapacity} style={{ background: 'var(--gold)', width: `${overallCapacity}%` }}></div></div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-name">Avg. wait time</span><span className="dot violet"></span></div>
              <div className="stat-num"><span>{avgWaitTime}</span><span style={{ fontSize: '15px', color: 'var(--text-2)' }}>min</span></div>
              <div className="bar-track"><div className="bar-fill transition-all duration-1000" data-width={avgWaitTime * 5} style={{ background: 'var(--violet)', width: `${avgWaitTime * 5}%` }}></div></div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-name">Active alerts</span><span className={`dot ${activeAlerts > 0 ? 'crimson' : 'violet'}`}></span></div>
              <div className="stat-num">{activeAlerts}</div>
              <div className="bar-track"><div className="bar-fill transition-all duration-1000" data-width={Math.min(100, activeAlerts * 20)} style={{ background: activeAlerts > 0 ? 'var(--crimson)' : 'var(--violet)', width: `${Math.min(100, activeAlerts * 20)}%` }}></div></div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span className="stat-name">Gates open</span><span className="dot violet"></span></div>
              <div className="stat-num"><span>8</span><span style={{ fontSize: '15px', color: 'var(--text-2)' }}>/8</span></div>
              <div className="bar-track"><div className="bar-fill transition-all duration-1000" data-width="100" style={{ background: 'var(--violet)', width: '100%' }}></div></div>
            </div>
          </div>

          <div className="stats-label reveal">
            <h4>Fan services</h4>

          </div>
          <div className="services">
            {SERVICES.map((s, idx) => (
              <div key={idx} className="service-card reveal">
                <div className="service-spot"></div>
                {s.tag && <span className="service-tag">{s.tag}</span>}
                <div className="service-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" dangerouslySetInnerHTML={{ __html: s.icon }} />
                </div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="teaser reveal">
            <div className="teaser-left">
              <h3>Interactive stadium visualizer</h3>
              <p>Click any stand, gate, or transit link to see live occupancy, wait times, and the fastest route in — the same map both fans and ops staff read from.</p>
              <button className="teaser-btn" onClick={() => navigate('/visualizer')}>Open visualizer</button>
            </div>
            <div className="teaser-right">
              <div className="ring"><div className="ring-center"><div className="n">64%</div><div className="l">avg cap.</div></div></div>
            </div>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <div className="wrap footer-grid">
          <div className="footer-col">
            <h5>Fanflow</h5>
            <p>AI-powered matchday assistant and crowd intelligence for FIFA World Cup 2026 stadiums.</p>
          </div>
          <div className="footer-col">
            <h5>Platform</h5>
            <ul>
              <li><a onClick={() => navigate('/')}>Home</a></li>
              <li><a onClick={() => navigate('/fan')}>Matchday Assistant</a></li>
              <li><a onClick={() => navigate('/ops')}>Stadium Command</a></li>
              <li><a onClick={() => navigate('/visualizer')}>Match Hub</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Transit status</h5>
            <div className="transit-row"><span className="transit-dot" style={{ background: 'var(--violet)' }}></span>Metro — running normal</div>
            <div className="transit-row"><span className="transit-dot" style={{ background: 'var(--gold)' }}></span>Bus — minor delays</div>
            <div className="transit-row"><span className="transit-dot" style={{ background: 'var(--violet)' }}></span>Rideshare zone — open</div>
          </div>
          <div className="footer-col">
            <h5>Accessibility</h5>
            <p>Step-free routes, sensory-friendly zones, and assistive listening info for every stand.</p>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>Built for Hack2skill PromptWars &middot; <em>Challenge 4: Smart Stadiums &amp; Tournament Operations</em></span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/shoaibkhan-sde/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[var(--text-1)] transition-colors">
              <Github size={16} /> Shoaib Khan
            </a>
            <span>&copy; 2026 Fanflow</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
