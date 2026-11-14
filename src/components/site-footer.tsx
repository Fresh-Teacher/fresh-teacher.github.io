import { memo } from 'react';
import { Link } from '@tanstack/react-router';
import styles from '@/styles/site-footer.css?raw';
import { useCurrentYear } from '@/hooks/use-current-year';

const icon = { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
const social = [
  { href: 'https://x.com/jesse_comedian', label: 'Follow us on X (Twitter)', cls: 'hx', svg: <svg {...icon}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg> },
  { href: 'https://facebook.com/share/18uh7arKyh', label: 'Follow us on Facebook', cls: 'hf', svg: <svg {...icon}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg> },
  { href: 'https://www.youtube.com/@freshteacher5692', label: 'Follow us on YouTube', cls: 'hy', svg: <svg {...icon}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg> },
  { href: 'https://instagram.com/mutumbajessepaul', label: 'Follow us on Instagram', cls: 'hi', svg: <svg {...icon}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg> },
  { href: 'https://github.com/Fresh-Teacher', label: 'Follow us on GitHub', cls: 'hg', svg: <svg {...icon}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg> },
];
const whatsapp = <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" /></svg>;
const phone = <svg {...icon}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const mail = <svg {...icon}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;

export const SiteFooter = memo(function SiteFooter() {
  return <footer className="site-footer">
    <style>{styles}</style>
    <div className="site-footer__inner">
      <div className="site-footer__grid">
        <div className="site-footer__brand"><h4>Follow Us</h4><div className="site-footer__social">
          {social.map(s => <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className={s.cls} aria-label={s.label} title={s.label}>{s.svg}</a>)}
        </div></div>
        <div className="site-footer__contact"><h4>Contact Us</h4><div className="site-footer__list">
          <a href="tel:+256750687790" className="hw">{whatsapp}+256750687790</a>
          <a href="tel:+256786812837" className="hw">{phone}+256786812837</a>
          <a href="mailto:freshteacheruganda256@gmail.com" className="hb">{mail}<span>freshteacheruganda256@gmail.com</span></a>
        </div></div>
        <div><h4>Quick Links</h4><div className="site-footer__list">
          <Link to="/about" className="ho">About Us</Link>
          <Link to="/disclaimer" className="ho">Disclaimer</Link>
        </div></div>
        <div><h4>Legal</h4><div className="site-footer__list">
          <Link to="/terms" className="ho">Terms of Service</Link>
          <Link to="/privacy" className="ho">Privacy Policy</Link>
        </div></div>
      </div>
      <div className="site-footer__bottom"><p>© <CopyrightYear /> Fresh Teacher's Technologies</p><p>Made with <span className="site-footer__heart">❤️</span> by Fresh Teacher</p></div>
    </div>
  </footer>;
});

function CopyrightYear() {
  const year = useCurrentYear();
  return <span>{year}</span>;
}
