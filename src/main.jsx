import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, Bell, BookOpen, CheckCircle2, CloudOff, MapPin, MessageSquareWarning, ShieldCheck, Users, Wifi } from 'lucide-react';
import './styles.css';

const initialReports = [
  { issue: 'Long wait at Community Desk', status: 'Review' },
  { issue: 'Skills Hub has few slots left', status: 'Open' },
];

const services = [
  { name: 'Community Desk', detail: 'Area 25 · 1.2 km · Open today' },
  { name: 'Skills Hub', detail: 'Town Centre · 3.6 km · Few slots' },
];

const guides = ['Digital safety', 'Career readiness', 'Small business basics'];

function App() {
  const [online, setOnline] = useState(navigator.onLine);
  const [activeView, setActiveView] = useState('services');
  const [mode, setMode] = useState('community');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [issue, setIssue] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+265');
  const [toast, setToast] = useState('');
  const [reports, setReports] = useState(() => {
    const savedReports = localStorage.getItem('pulseflow-reports');
    return savedReports ? JSON.parse(savedReports) : initialReports;
  });

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pulseflow-reports', JSON.stringify(reports));
  }, [reports]);

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

    try {
      const response = await fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name.trim() || 'PulseFlow user' }),
      });
      const result = await response.json();
      setToast(result.message || 'Update request saved.');
      setName('');
      setPhone('+265');
    } catch {
      setToast('Update request saved on this device.');
    }
  }

  function queueAdminUpdate(report) {
    setToast(`Demo WhatsApp update queued for: ${report.issue}`);
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
          {guides.map((guide) => <article className="list-item" key={guide}><strong>{guide}</strong><span>Available on this device after opening.</span></article>)}
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
          <article><Bell /><strong>Demo</strong><span>WhatsApp mode</span></article>
        </section>
        <h3>Follow-up queue</h3>
        {reports.map((report) => <article className="list-item action-item" key={`${report.issue}-${report.status}`}><div><strong>{report.issue}</strong><span>Status: {report.status}</span></div><button onClick={() => queueAdminUpdate(report)}>Send update</button></article>)}
        <h3>Channel status</h3>
        <article className="list-item"><strong>WhatsApp</strong><span>Ready for Meta Cloud API credentials.</span></article>
        <article className="list-item"><strong>Facebook and Instagram</strong><span>Community links connected for public updates.</span></article>
        {toast && <div className="toast"><CheckCircle2 size={16} />{toast}</div>}
      </>}
    </section>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
