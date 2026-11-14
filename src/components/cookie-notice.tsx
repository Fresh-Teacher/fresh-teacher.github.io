import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import cookieMascot from "@/assets/cookie-mascot.png.asset.json";
import { COOKIE_CLOSED_EVENT } from '@/lib/app-installation';

const CONSENT_KEY = "ft-cookie-consent";
const EXIT_MS = 420;

export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const close = (value: string) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* storage unavailable — just hide */
    }
    window.dispatchEvent(new Event('ft-cookie-consent-changed'));
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      window.dispatchEvent(new Event(COOKIE_CLOSED_EVENT));
    }, EXIT_MS);
  };

  if (!visible) return null;

  return (
    <div role="dialog" aria-label="Cookie notice" className="ftp-wrap">
      <div className={`ftp-card ftp-cookie ${leaving ? "popup-slide-down" : "popup-slide-up"}`}>
        <div className="ftp-band" aria-hidden />
        <img src={cookieMascot.url} alt="" width={816} height={816} className="ftp-mascot popup-bob" />
        <div className="ftp-body">
          <h2 className="ftp-title">Fresh Teacher&apos;s Platform Uses Cookies</h2>
          <p className="ftp-text">
            We use cookies to keep the library working smoothly and to remember your preferences.
            By continuing to browse, you agree to our use of cookies.
          </p>
          <div className="ftp-actions">
            <button type="button" onClick={() => close("accepted")} className="ftp-btn ftp-cookie-solid">
              Accept all
            </button>
            <button type="button" onClick={() => close("essential")} className="ftp-btn ftp-cookie-outline">
              Essential only
            </button>
          </div>
          <Link to="/cookies" className="ftp-link">
            Read full cookie policy
          </Link>
        </div>
      </div>
    </div>
  );
}
