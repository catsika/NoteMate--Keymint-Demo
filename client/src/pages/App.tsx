import { useState, useEffect } from 'react';
import { enterLicense, licenseState, callExportPDF, callDarkMode, clearLicense } from '../services/api';

interface Note { id: string; title: string; content: string; updatedAt: string; }

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licState, setLicState] = useState<any>(null);
  const [entering, setEntering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const isPremium = !!licState && licState.tier === 'PRO';
  // --- constants for localStorage keys ---
  const LS_NOTES = 'notemate_notes';
  const LS_DARK = 'notemate_darkMode';

  useEffect(() => { loadLicenseState(); }, []);

  // Initial load for persisted UI state (notes + dark mode)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_NOTES);
      if (raw) {
        const parsed: Note[] = JSON.parse(raw);
        setNotes(parsed);
        if (parsed.length) setEditing(parsed[0]);
      }
    } catch {/* ignore corrupt */}
    try {
      const dm = localStorage.getItem(LS_DARK);
      if (dm === '1') setDarkMode(true);
    } catch {/* ignore */}
  }, []);

  // Persist notes changes
  useEffect(() => {
    try { localStorage.setItem(LS_NOTES, JSON.stringify(notes)); } catch {/* ignore quota */}
  }, [notes]);

  // Persist dark mode preference
  useEffect(() => {
    try { localStorage.setItem(LS_DARK, darkMode ? '1' : '0'); } catch {/* ignore */}
  }, [darkMode]);

  // Auto clear transient toasts
  useEffect(() => {
    if (message || error) {
      const t = setTimeout(() => { setMessage(null); setError(null); }, 4000);
      return () => clearTimeout(t);
    }
  }, [message, error]);

  const loadLicenseState = async () => {
    try { const s = await licenseState(); setLicState(s); } catch {/* ignore */}
  };

  const newNote = () => {
    const n: Note = { id: crypto.randomUUID(), title: 'Untitled', content: '', updatedAt: new Date().toISOString() };
    setNotes(prev => [n, ...prev]);
    setEditing(n);
  };
  const updateNote = (patch: Partial<Note>) => {
    if (!editing) return;
    setEditing(e => e ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e);
    setNotes(list => list.map(n => n.id === editing.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
  };
  const deleteNote = (id: string) => {
    setNotes(list => list.filter(n => n.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const handleEnterLicense = async () => {
    setEntering(true); setMessage(null); setError(null);
    try {
      await enterLicense({ licenseKey: licenseKeyInput });
      await loadLicenseState();
      setLicenseKeyInput('');
      setMessage('License verified. Premium unlocked.');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Activation failed');
    } finally { setEntering(false); }
  };

  const handleExport = async () => {
    if (!editing) return;
    try {
      await callExportPDF();
      // simple client-side export via Blob (instead of real PDF lib to keep it lightweight)
      const blob = new Blob([`# ${editing.title}\n\n${editing.content}`], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${editing.title.replace(/[^a-z0-9]/gi,'_')}.md`; a.click();
      URL.revokeObjectURL(url);
      setMessage('Exported note (markdown placeholder for PDF).');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const handleDarkMode = async () => {
    try {
      await callDarkMode();
      setDarkMode(d => !d);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const handleClear = async () => {
    try {
      await clearLicense();
      await loadLicenseState();
      setMessage('License cleared. Back to FREE tier.');
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const gatedBtn = (enabled: boolean, onClick: () => void, label: string) => (
    <button
      onClick={enabled ? onClick : undefined}
      className={`px-3 py-1 rounded text-sm ${enabled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      title={enabled ? '' : 'Premium feature – enter a valid license key'}
    >{label}</button>
  );

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
        {/* Toasts */}
        {(message || error) && (
          <div className="fixed top-4 right-4 space-y-2 z-50">
            {message && <div className="toast toast-success">{message}</div>}
            {error && <div className="toast toast-error">{error}</div>}
          </div>
        )}
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">NoteMate <span className="text-sm font-normal text-gray-500 dark:text-gray-400"></span></h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input className="input" placeholder="License Key" value={licenseKeyInput} onChange={e=>setLicenseKeyInput(e.target.value)} />
              <button onClick={handleEnterLicense} disabled={entering || !licenseKeyInput} className="btn-primary">{entering ? 'Checking...' : 'Unlock Premium'}</button>
              {licState?.tier === 'PRO' && <button onClick={handleClear} className="btn-secondary">Clear</button>}
            </div>
          </header>
          <div className="flex flex-wrap gap-4 items-center text-xs">
            <div className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800">Tier: {licState?.tier || 'FREE'}</div>
            <div className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800">Features: {(licState?.features||[]).join(', ') || '—'}</div>
            {!isPremium && <div className="text-amber-600">Premium locked – enter license to enable export & dark mode</div>}
          </div>

          <section className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Notes</h2>
                <button onClick={newNote} className="btn-secondary">New</button>
              </div>
              <ul className="space-y-2">
                {notes.map(n => (
                  <li key={n.id} className={`p-2 rounded border cursor-pointer ${editing?.id===n.id ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-700'}`} onClick={()=>setEditing(n)}>
                    <div className="font-medium truncate">{n.title || 'Untitled'}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(n.updatedAt).toLocaleTimeString()}</div>
                  </li>
                ))}
                {notes.length===0 && <li className="text-xs text-gray-500">No notes yet. Click New.</li>}
              </ul>
            </div>
            <div className="md:col-span-2 space-y-4">
              {editing ? (
                <div className="space-y-3">
                  <input className="input" value={editing.title} onChange={e=>updateNote({ title: e.target.value })} />
                  <textarea className="input h-60" value={editing.content} onChange={e=>updateNote({ content: e.target.value })} />
                  <div className="flex gap-2 flex-wrap">
                    {gatedBtn(isPremium, handleExport, 'Export (PDF)')}
                    {gatedBtn(isPremium, handleDarkMode, darkMode ? 'Light Mode' : 'Dark Mode')}
                    <button onClick={()=>deleteNote(editing.id)} className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select or create a note to begin.</div>
              )}
            </div>
          </section>

          <footer className="text-xs text-gray-500 dark:text-gray-400 pt-8 border-t dark:border-gray-800">
            NoteMate demo. Notes + dark mode preference persist locally. Premium gates powered by Keymint activation.
          </footer>
        </div>
      </div>
    </div>
  );
}
