import { useEffect, useRef, useState } from 'react';
const adminPhoto = { url: '/__l5e/assets-v1/18d77338-1444-46bb-b8ec-5e0f26aa9e7f/51de6e3f-admin-photo.webp' };
import { legacyGreeting } from '@/lib/legacy-pages';
import styles from '@/styles/whatsapp-chat.css?raw';

// One shared WhatsApp chat for the whole app: the captured homepage widget,
// mounted by LibraryShell so every page shows the same button and dialog.
export function WhatsAppChat() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [greeting, setGreeting] = useState('');
  const [phase, setPhase] = useState<'online' | 'typing' | 'greeting' | 'pause' | 'typing2' | 'done'>('done');
  const [showEncryptionInfo, setShowEncryptionInfo] = useState(false);
  const trigger = useRef<HTMLAnchorElement>(null);
  useEffect(() => { setGreeting(legacyGreeting(new Date().getHours())); }, []);
  // On open: "online" → "typing..." → greeting pops in → brief "online" →
  // "typing..." again → the follow-up question pops in and status stays "online".
  useEffect(() => {
    if (!open) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }
    setPhase('online');
    const timers = [
      setTimeout(() => setPhase('typing'), 1500),
      setTimeout(() => setPhase('greeting'), 3000),
      setTimeout(() => setPhase('pause'), 4500),
      setTimeout(() => setPhase('typing2'), 6000),
      setTimeout(() => setPhase('done'), 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [open]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !open) return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);
  const icon = greeting.includes('morning') ? ['sun', '#f59e0b'] : greeting.includes('afternoon') ? ['cloud-sun', '#fb923c'] : ['moon', '#818cf8'];
  return <div className="whatsapp-chat">
    <style>{styles}</style>
    <div id="africavotes-chat" className={open ? 'show' : 'hide'} role="dialog" aria-label="Chat with Fresh Teacher">
      <div className="header-chat">
        <div className="head-home">
          <div className="info-avatar">
            <img src={adminPhoto.url} alt="" />
          </div>
          <p>
            <span className="africavotes-name">Fresh Teacher</span>
            <br />
            <small>{phase === 'typing' || phase === 'typing2' ? 'typing...' : 'online'} </small>
          </p>
        </div>
        <div className="get-new hide">
          <div id="get-label" />
          <div id="get-nama" />
        </div>
      </div>
      <div className="home-chat" />
      <div className="start-chat">
        <div className="africavotes-chat-body">
          <div className="encryption-notice">
            <i className="fa-solid fa-lock" aria-hidden="true" />
            <span>Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. <button type="button" className="encryption-learn-more" onClick={() => setShowEncryptionInfo(true)}>Learn more</button></span>
          </div>
          <div className="dAbFpq">
            <div className="eJJEeC" style={{ display: phase === 'typing' ? 'flex' : 'none', opacity: phase === 'typing' ? 1 : 0 }}>
              <div className="hFENyl">
                <div className="ixsrax" />
                <div className="dRvxoz" />
                <div className="kXBtNt" />
              </div>
            </div>
            <div className="kAZgZq" style={{ opacity: phase === 'greeting' || phase === 'pause' || phase === 'typing2' || phase === 'done' ? '1' : '0' }}>
              <div className="iSpIQi" id="greeting">{greeting}{greeting && <> <i className={`fa-solid fa-${icon[0]}`} style={{ color: icon[1] }} aria-hidden="true" /></>}</div>
            </div>
            <div className="eJJEeC" style={{ display: phase === 'typing2' ? 'flex' : 'none', opacity: phase === 'typing2' ? 1 : 0 }}>
              <div className="hFENyl">
                <div className="ixsrax" />
                <div className="dRvxoz" />
                <div className="kXBtNt" />
              </div>
            </div>
            <div className="kAZgZq" style={{ opacity: phase === 'done' ? '1' : '0' }}>
              <div className="iSpIQi">How may I help you?</div>
            </div>
          </div>
        </div>
        <div className="blanter-msg">
          <textarea id="chat-input" maxLength={120} placeholder="Message" aria-label="Message" value={message} onChange={event => setMessage(event.target.value)} />
          <a id="send-it" href={message.trim() ? `https://web.whatsapp.com/send?phone=+256750687790&text=${encodeURIComponent(message)}` : '#'} target="_blank" rel="noopener noreferrer" role="button" aria-label="Send message on WhatsApp" onClick={event => { if (!message.trim()) event.preventDefault(); }}>
            <svg viewBox="0 0 448 448"><path d="M.213 32L0 181.333 320 224 0 266.667.213 416 448 224z" /></svg>
          </a>
        </div>
      </div>
      <div id="get-number" />
      <a className="close-chat" href="#" role="button" aria-label="Close chat" onClick={event => { event.preventDefault(); setOpen(false); trigger.current?.focus(); }}>×</a>
      {showEncryptionInfo && (
        <div className="encryption-modal" role="dialog" aria-modal="true" aria-label="About end-to-end encryption">
          <button type="button" className="encryption-modal-close" aria-label="Close" onClick={() => setShowEncryptionInfo(false)}>×</button>
          <div className="encryption-modal-scroll">
            <svg className="encryption-illustration" viewBox="0 0 200 150" aria-hidden="true">
              <rect x="20" y="25" width="110" height="95" rx="12" fill="#25d366" stroke="#075e54" strokeWidth="4" />
              <rect x="30" y="35" width="90" height="75" rx="8" fill="#1eb85a" />
              <circle cx="75" cy="72" r="26" fill="#0b3d2e" />
              <circle cx="75" cy="72" r="20" fill="#25d366" />
              <circle cx="75" cy="72" r="7" fill="#0b3d2e" />
              <g stroke="#0b3d2e" strokeWidth="3">
                <line x1="75" y1="54" x2="75" y2="62" />
                <line x1="75" y1="82" x2="75" y2="90" />
                <line x1="57" y1="72" x2="65" y2="72" />
                <line x1="85" y1="72" x2="93" y2="72" />
              </g>
              <rect x="14" y="40" width="8" height="14" rx="3" fill="#075e54" />
              <rect x="14" y="90" width="8" height="14" rx="3" fill="#075e54" />
              <rect x="34" y="120" width="12" height="10" rx="2" fill="#075e54" />
              <rect x="104" y="120" width="12" height="10" rx="2" fill="#075e54" />
              <path d="M140 60 a22 22 0 0 1 44 0 v12 h-10 v-12 a12 12 0 0 0 -24 0 v12 h-10 z" fill="#f7e9d0" stroke="#075e54" strokeWidth="3" />
              <rect x="132" y="70" width="60" height="52" rx="10" fill="#f7e9d0" stroke="#075e54" strokeWidth="3" />
              <circle cx="162" cy="90" r="8" fill="#075e54" />
              <rect x="159" y="94" width="6" height="14" rx="3" fill="#075e54" />
            </svg>
            <h3>Your chats and calls are private</h3>
            <p>End-to-end encryption keeps your personal messages and calls between you and the people you choose. No one outside of the chat, not even WhatsApp, can read, listen to, or share them. This includes your:</p>
            <ul>
              <li><i className="fa-solid fa-message" aria-hidden="true" /> Text and voice messages</li>
              <li><i className="fa-solid fa-phone" aria-hidden="true" /> Audio and video calls</li>
              <li><i className="fa-solid fa-paperclip" aria-hidden="true" /> Photos, videos and documents</li>
              <li><i className="fa-solid fa-location-dot" aria-hidden="true" /> Location sharing</li>
              <li><i className="fa-solid fa-arrows-rotate" aria-hidden="true" /> Status updates</li>
            </ul>
            <a className="encryption-modal-link" href="https://www.whatsapp.com/security" target="_blank" rel="noopener noreferrer">Learn more</a>
          </div>
        </div>
      )}
    </div>
    <a className="africaVotesChat" title="WhatsApp" href="#" role="button" aria-label="Show Chat" aria-expanded={open} ref={trigger} onClick={event => { event.preventDefault(); setOpen(value => !value); }}>
      <svg width="26" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#eceff1" d="M20.5 3.4A12.1 12.1 0 0012 0 12 12 0 001.7 17.8L0 24l6.3-1.7c2.8 1.5 5 1.4 5.8 1.5a12 12 0 008.4-20.3z" />
        <path fill="#4caf50" d="M12 21.8c-3.1 0-5.2-1.6-5.4-1.6l-3.7 1 1-3.7-.3-.4A9.9 9.9 0 012.1 12a10 10 0 0117-7 9.9 9.9 0 01-7 16.9z" />
        <path fill="#fafafa" d="M17.5 14.3c-.3 0-1.8-.8-2-.9-.7-.2-.5 0-1.7 1.3-.1.2-.3.2-.6.1s-1.3-.5-2.4-1.5a9 9 0 01-1.7-2c-.3-.6.4-.6 1-1.7l-.1-.5-1-2.2c-.2-.6-.4-.5-.6-.5-.6 0-1 0-1.4.3-1.6 1.8-1.2 3.6.2 5.6 2.7 3.5 4.2 4.2 6.8 5 .7.3 1.4.3 1.9.2.6 0 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
      </svg>
    </a>
  </div>;
}
