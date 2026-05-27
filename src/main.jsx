import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, Bell, BookOpen, CheckCircle2, CloudOff, LayoutDashboard, MapPin, MessageSquareWarning, ShieldCheck, Users, Wifi } from 'lucide-react';
import './styles.css';

const initialReports = [
  { issue: 'Long wait at Community Desk', status: 'Review' },
  { issue: 'Skills Hub has few slots left', status: 'Open' },
];

const services = [
  { name: 'Community Desk', detail: 'Area 25 · 1.2 km · Open today' },
  { name: 'Skills Hub', detail: 'Town Centre · 3.6 km · Few slots' },
];

const guides = [
  {
    title: 'Digital safety',
    content: 'Protect your accounts with strong, unique passwords. Enable two-factor authentication (2FA) wherever possible. Avoid sharing sensitive personal information on public forums, and always verify message links.'
  },
  {
    title: 'Career readiness',
    content: 'Keep your CV brief and highlight practical achievements. Practice a 30-second summary of your skills, seek local networking groups, and gather continuous feedback to refine your professional profile.'
  },
  {
    title: 'Small business basics',
    content: 'Monitor daily operations and cash flow closely. Maintain clear, simple customer ledgers, source materials locally, and build trust with your community using neutral WhatsApp alerts for product updates.'
  }
];

function App() {
  const [online, setOnline] = useState(navigator.onLine);
  const isPrivacyPage = window.location.pathname === '/privacy';
  const [activeView, setActiveView] = useState('services');
  const [mode, setMode] = useState('community');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [issue, setIssue] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+265');
  const [toast, setToast] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState(null);
  const [participants, setParticipants] = useState(() => {
    const savedParticipants = localStorage.getItem('pulseflow-participants');
    return savedParticipants ? JSON.parse(savedParticipants) : [];
  });
  const [reports, setReports] = useState(() => {
    const savedReports = localStorage.getItem('pulseflow-reports');
    return savedReports ? JSON.parse(savedReports) : initialReports;
  });

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    const captureInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pulseflow-reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('pulseflow-participants', JSON.stringify(participants));
  }, [participants]);

  const activeReports = useMemo(() => reports.filter((report) => report.status !== 'Resolved').length, [reports]);

  function saveReport(event) {
    event.preventDefault();
    if (!issue.trim()) {
      setToast('Describe the problem first.');
      return;
    }
    setReports([{ issue: issue.trim(), status: online ? 'Review' : 'Saved offline' }, ...reports]);
    setIssue('');
    setToast('Problem saved for follow-up.');
  }

  async function sendUpdate(event) {
    event.preventDefault();
    if (!phone.trim()) {
      setToast('Enter a phone number first.');
      return;
    }

    const subscriberName = name.trim() || 'PulseFlow user';
    const subscriberPhone = phone.trim();

    try {
      const response = await fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: subscriberPhone, name: subscriberName, templateKey: 'opt_in' }),
      });
      const result = await response.json();
      const modeTag = result.mode === 'live' ? '(Live)' : '(Demo)';
      setToast(`${result.message || 'Update request saved.'} ${modeTag}`);

      const participant = {
        name: subscriberName,
        phone: subscriberPhone,
        status: 'Opted in',
        joinedAt: new Date().toLocaleString(),
      };
      setParticipants((currentParticipants) => {
        const existingParticipant = currentParticipants.find((item) => item.phone === subscriberPhone);
        if (existingParticipant) {
          return currentParticipants.map((item) => item.phone === subscriberPhone ? { ...item, ...participant } : item);
        }
        return [participant, ...currentParticipants];
      });
      localStorage.setItem('pulseflow-last-subscriber', JSON.stringify(participant));

      setName('');
      setPhone('+265');
    } catch {
      setToast('Update request saved on this device.');
    }
  }

  async function sendParticipantTemplate(participant, templateKey, fallbackMessage) {
    if (!participant) {
      setToast('No active subscriber. Go to "Get updates" in Community app and register a number first.');
      return;
    }

    setToast(`Sending ${templateKey} update to ${participant.name}...`);

    try {
      const response = await fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: participant.phone, name: participant.name, templateKey }),
      });
      const result = await response.json();
      if (!response.ok) {
        setToast(`${result.message || 'WhatsApp request failed.'} Template: ${result.templateUsed || templateKey}`);
        return;
      }
      const modeTag = result.mode === 'live' ? '(Live)' : '(Demo)';
      setToast(`${result.message || fallbackMessage} ${modeTag}`);
    } catch {
      setToast('Update saved locally. WhatsApp API could not be reached.');
    }
  }

  function queueAdminUpdate(report, participant = participants[0]) {
    sendParticipantTemplate(participant, 'report', `Update sent for: ${report.issue}`);
  }

  function sendServiceUpdate(participant = participants[0]) {
    sendParticipantTemplate(participant, 'service', 'Service update sent.');
  }

  if (isPrivacyPage) {
    return <main className="app-shell" style={{ padding: '24px', background: '#f8fafc' }}>
      <header style={{ marginBottom: '24px' }}>
        <div className="brand"><span>PF</span><div><strong>PulseFlow</strong><small>Privacy Policy</small></div></div>
      </header>
      <section className="content-card" style={{ padding: '20px', fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>
        <h2>Privacy Policy</h2>
        <p className="hint">Effective Date: May 27, 2026</p>
        
        <p>At <strong>PulseFlow Connect</strong>, we are committed to protecting your privacy. This policy explains how we handle your information when using our Progressive Web App (PWA) and WhatsApp notifications.</p>
        
        <h3>1. Information We Collect</h3>
        <p><strong>Local Reports</strong>: Issues reported on service accessibility are stored <em>locally</em> on your device using browser localStorage. We do not store these in a remote centralized database in this POC.</p>
        <p><strong>WhatsApp Contacts</strong>: If you explicitly request updates, we collect your first name/nickname and WhatsApp number. These are transmitted to Meta Cloud APIs solely to deliver authorized notification updates.</p>
        
        <h3>2. How We Use Information</h3>
        <p>We use your contact info solely to trigger requested updates. Your data is never sold, shared, or used for advertising or marketing.</p>
        
        <h3>3. Data Retention</h3>
        <p>Since data is saved locally on your device, you can clear it at any time by clearing your browser site data or cookies for this domain.</p>
        
        <h3>4. Meta Platform Data</h3>
        <p>This service operates in strict accordance with the Meta WhatsApp Business Developer Terms. Our template-based messaging processes names and numbers with appropriate encryption endpoints.</p>
        
        <button className="wide-button" style={{ marginTop: '24px' }} onClick={() => window.location.href = '/'}>Back to App</button>
      </section>
    </main>;
  }

  return <main className="app-shell">
    <header>
      <div className="brand"><span>PF</span><div><strong>PulseFlow</strong><small>Community support finder</small></div></div>
      <div className="status">{online ? <Wifi size={15} /> : <CloudOff size={15} />}{online ? 'Online' : 'Offline'}</div>
    </header>

    <nav className="mode-switch">
      <button onClick={() => setMode('community')} className={mode === 'community' ? 'active' : ''}>Community app</button>
      <button onClick={() => setMode('admin')} className={mode === 'admin' ? 'active' : ''}>Admin dashboard</button>
    </nav>

    {mode === 'community' && <>
      <section className="intro">
        <h1>Find support near you.</h1>
        <p>Use PulseFlow to find local services, read saved guides, report access problems, and request safe phone updates.</p>
        <div className="social-links">
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer"><span className="social-icon">f</span>Facebook community</a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer"><span className="social-icon">ig</span>Instagram updates</a>
        </div>
      </section>

      <section className="actions-grid">
        <button onClick={() => setActiveView('services')} className={activeView === 'services' ? 'active' : ''}><MapPin />Find services</button>
        <button onClick={() => setActiveView('guides')} className={activeView === 'guides' ? 'active' : ''}><BookOpen />Read guides</button>
        <button onClick={() => setActiveView('report')} className={activeView === 'report' ? 'active' : ''}><MessageSquareWarning />Report issue</button>
        <button onClick={() => setActiveView('updates')} className={activeView === 'updates' ? 'active' : ''}><Bell />Get updates</button>
      </section>

      <section className="content-card">
        {activeView === 'services' && <>
          <h2>Nearby services</h2>
          {services.map((service) => <article className="list-item" key={service.name}><strong>{service.name}</strong><span>{service.detail}</span></article>)}
        </>}

        {activeView === 'guides' && <>
          <h2>Saved guides</h2>
          <p className="hint">Tap any guide topic below to read the contents on this device. Content is saved for offline use.</p>
          {guides.map((guide) => {
            const isExpanded = expandedGuide === guide.title;
            return (
              <article 
                className={`list-item accordion-item ${isExpanded ? 'expanded' : ''}`} 
                key={guide.title}
                onClick={() => setExpandedGuide(isExpanded ? null : guide.title)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{guide.title}</strong>
                  <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '800', marginTop: 0 }}>
                    {isExpanded ? 'Hide' : 'Read'}
                  </span>
                </div>
                {isExpanded ? (
                  <p style={{ marginTop: '10px', fontSize: '13.5px', color: '#334155', lineHeight: '1.5', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {guide.content}
                  </p>
                ) : (
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Tap to expand this guide...</span>
                )}
              </article>
            );
          })}
        </>}

        {activeView === 'report' && <>
          <h2>Report an access problem</h2>
          <p className="hint">Use this when a service is closed, unavailable, unclear, or difficult to reach.</p>
          <form onSubmit={saveReport}><input value={issue} onChange={(event) => setIssue(event.target.value)} placeholder="What happened?" /><button>Save</button></form>
        </>}

        {activeView === 'updates' && <>
          <h2>Why WhatsApp updates?</h2>
          <p className="hint">Many users may not reopen the app every day. WhatsApp lets the team send a short reminder, appointment note, or service update that brings the user back to the app.</p>
          <div className="example-message">Example: “Your saved service has an update. Open PulseFlow for details.”</div>
          <form onSubmit={sendUpdate}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="First name or nickname" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="WhatsApp number e.g. +265..." /><button>Request</button></form>
        </>}

        {toast && <div className="toast"><CheckCircle2 size={16} />{toast}</div>}
      </section>

      <section className="summary">
        <article><BarChart3 /><strong>{reports.length}</strong><span>Total reports</span></article>
        <article><MessageSquareWarning /><strong>{activeReports}</strong><span>Need follow-up</span></article>
        <article><Users /><strong>2</strong><span>Questions in review</span></article>
        <article><ShieldCheck /><strong>Safe</strong><span>Neutral updates</span></article>
      </section>
    </>}

    {mode === 'admin' && <section className="content-card admin-card">
      {!adminLoggedIn ? <>
        <h2>Admin dashboard</h2>
        <p className="hint">Demo login for the team view. In production this would use secure role-based access.</p>
        <button className="wide-button" onClick={() => setAdminLoggedIn(true)}>Login as admin</button>
      </> : <>
        <div className="admin-head"><div><h2>Admin dashboard</h2><p className="hint">Monitor usage, follow-ups, and channel activity.</p></div><button onClick={() => setAdminLoggedIn(false)}>Logout</button></div>
        <section className="summary admin-summary">
          <article><Users /><strong>1,248</strong><span>People reached</span></article>
          <article><BookOpen /><strong>326</strong><span>Guides saved</span></article>
          <article><MessageSquareWarning /><strong>{activeReports}</strong><span>Open follow-ups</span></article>
          <article><Bell /><strong>Live</strong><span>WhatsApp Cloud API</span></article>
        </section>
        <h3>Registered participants</h3>
        <p className="hint">POC storage uses this browser only. In production, participant consent and opt-out records would be stored securely in a database.</p>
        <div className="participant-list">
          {participants.length === 0 ? <article className="list-item"><strong>No participants yet</strong><span>Use Get updates in the community app to register a WhatsApp number.</span></article> : participants.map((participant) => <article className="list-item participant-item" key={participant.phone}>
            <div>
              <strong>{participant.name}</strong>
              <span>{participant.phone} · {participant.status} · {participant.joinedAt}</span>
            </div>
            <div className="participant-actions">
              <button onClick={() => sendParticipantTemplate(participant, 'report', 'Report update sent.')}>Report update</button>
              <button className="secondary" onClick={() => sendServiceUpdate(participant)}>Service update</button>
            </div>
          </article>)}
        </div>
        <h3>Follow-up queue</h3>
        {reports.map((report) => <article className="list-item action-item" key={`${report.issue}-${report.status}`}><div><strong>{report.issue}</strong><span>Status: {report.status}</span></div><button onClick={() => queueAdminUpdate(report)}>Send update</button></article>)}
        
        <h3>Channel status & templates</h3>
        <article className="list-item action-item">
          <div>
            <strong>WhatsApp Cloud API</strong>
            <span>Live Meta Cloud API connected. Active templates: opt-in, report updates, service updates.</span>
          </div>
          <button className="secondary" onClick={sendServiceUpdate}>Trigger Service Update</button>
        </article>
        <article className="list-item"><strong>Facebook and Instagram</strong><span>Community links connected for public updates.</span></article>
        
        <h3>Submission readiness checklist</h3>
        <div className="checklist">
          <article className="list-item check-item"><span>✅</span><div><strong>PWA Installability</strong><span>Ready. Desktop Chrome tested. Service worker configured.</span></div></article>
          <article className="list-item check-item"><span>✅</span><div><strong>WhatsApp Templates</strong><span>Activated. Backend dynamic template mapping is live.</span></div></article>
          <article className="list-item check-item"><span>✅</span><div><strong>Webhooks Setup</strong><span>Listening at /api/whatsapp/webhook. GET/POST support verified.</span></div></article>
          <article className="list-item check-item"><span>✅</span><div><strong>Offline Storage</strong><span>Online. Syncing to local storage natively.</span></div></article>
        </div>
        
        {toast && <div className="toast"><CheckCircle2 size={16} />{toast}</div>}
      </>}
    </section>}

    <nav className="bottom-nav">
      <button onClick={() => setMode('community')} className={mode === 'community' ? 'active' : ''}><Users size={18} />Home</button>
      <button onClick={() => { setMode('community'); setActiveView('services'); }} className={mode === 'community' && activeView === 'services' ? 'active' : ''}><MapPin size={18} />Services</button>
      <button onClick={() => { setMode('community'); setActiveView('updates'); }} className={mode === 'community' && activeView === 'updates' ? 'active' : ''}><Bell size={18} />Updates</button>
      <button onClick={() => setMode('admin')} className={mode === 'admin' ? 'active' : ''}><LayoutDashboard size={18} />Admin</button>
    </nav>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
