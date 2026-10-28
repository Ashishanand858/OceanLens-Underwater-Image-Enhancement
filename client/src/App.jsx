import { makeId } from './services/id.js';
import { useEffect, useRef, useState } from 'react';
import { ScanLine, X, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import ImageUpload from './components/ImageUpload.jsx';
import ImageComparison from './components/ImageComparison.jsx';
import ProcessingLoader from './components/ProcessingLoader.jsx';
import EnhancementHistory from './components/EnhancementHistory.jsx';
import Footer from './components/Footer.jsx';
import { enhanceImage, getHealth, getHistory } from './services/api.js';

export default function App() {
 const [items, setItems] = useState([]);
 const [current, setCurrent] = useState(null);
 const [pending, setPending] = useState(null);
 const [busy, setBusy] = useState(false);
 const [progress, setProgress] = useState(0);
 const [errors, setErrors] = useState([]);
 const [queue, setQueue] = useState('');
 const [ready, setReady] = useState('checking');
 const [stored, setStored] = useState([]);
 const [historyStatus, setHistoryStatus] = useState('Database history is optional.');
 const running = useRef(false);
 const controller = useRef(null);
 const urls = useRef(new Set());
 const alive = useRef(true);
 const retained = useRef([]);
 const makeUrl = blob => { const url = URL.createObjectURL(blob); urls.current.add(url); return url; };
 const release = url => { URL.revokeObjectURL(url); urls.current.delete(url); };
 const refreshHealth = () => getHealth().then(() => setReady('ready')).catch(() => setReady('offline'));
 const refreshHistory = () => getHistory().then(data => { if (!alive.current) return; setStored(data.items); setHistoryStatus(data.available ? 'MongoDB history connected · metadata retained for 7 days' : data.reason); }).catch(() => setHistoryStatus('Database history is unavailable.'));
 useEffect(() => {
   alive.current = true;
   refreshHealth(); refreshHistory();
   const interval = setInterval(() => { refreshHealth(); refreshHistory(); }, 30000);
   return () => { alive.current = false; clearInterval(interval); controller.current?.abort(); urls.current.forEach(URL.revokeObjectURL); urls.current.clear(); };
 }, []);
 async function uploadFiles(files) {
   if (running.current || !files.length) return;
   const messages = [];
   if (files.length > 10) messages.push('Only the first 10 images are included in this batch.');
   const valid = files.slice(0,10).filter(file => {
     const reason = !['image/jpeg','image/png'].includes(file.type) || !/\.(jpe?g|png)$/i.test(file.name) ? 'Choose a JPEG or PNG.' : file.size > 10*1024*1024 ? 'Maximum file size is 10 MB.' : !file.size ? 'File is empty.' : null;
     if (reason) messages.push(`${file.name}: ${reason}`);
     return !reason;
   });
   setErrors(messages);
   if (!valid.length) return;
   running.current = true; setBusy(true);
   for (let index=0; index<valid.length; index++) {
     if (!alive.current) break;
     const file = valid[index];
     const originalUrl = makeUrl(file);
     setPending({ name: file.name, originalUrl }); setProgress(0);
     setQueue(`Image ${index+1} of ${valid.length}`);
     controller.current = new AbortController();
     try {
       const data = await enhanceImage(file, controller.current.signal, setProgress);
       if (!alive.current) { release(originalUrl); break; }
       const result = { id: makeId(), name: file.name, date: new Date().toISOString(), originalUrl,
         outputUrl: makeUrl(data.blob), inferenceMs: data.inferenceMs, totalMs: data.totalMs,
         downloadName: `${file.name.replace(/\.[^.]+$/, '')}-enhanced.png` };
       retained.current = [result, ...retained.current];
       if (retained.current.length > 10) {
         const old = retained.current.pop(); release(old.originalUrl); release(old.outputUrl);
       }
       setItems([...retained.current]); setCurrent(result); setReady('ready');
     } catch (error) {
       release(originalUrl);
       if (alive.current) setErrors(old => [...old, `${file.name}: ${error.message}`]);
     }
   }
   if (alive.current) { setPending(null); setBusy(false); setQueue(''); refreshHistory(); refreshHealth(); }
   running.current = false;
 }
 function clearAll() {
   if (running.current) return;
   urls.current.forEach(URL.revokeObjectURL); urls.current.clear(); retained.current=[];
   setItems([]); setCurrent(null); setErrors([]);
 }
 return <><Navbar/><main><Hero/><section id="studio" className="studio"><div className="section-header"><div><div className="eyebrow">01 / THE ENHANCEMENT STUDIO</div><h2>From capture to clarity.</h2></div><button className={`service-status ${ready}`} onClick={refreshHealth}><span className="tiny-dot"/>{ready === 'ready' ? 'Model ready' : ready === 'checking' ? 'Checking model' : 'Service offline · retry'}</button></div>
 <div className="studio-grid"><div><ImageUpload onFiles={uploadFiles} disabled={busy}/><div className="privacy-note"><ShieldCheck size={16}/><span>Local processing. Images are never stored in MongoDB.</span></div><div className="workflow"><span>Upload</span><ArrowRight size={14}/><span>Auto-enhance</span><ArrowRight size={14}/><span>Download</span></div></div><div className="preview-panel">
 <div className="preview-heading"><span>YOUR PERSPECTIVE, REDEFINED</span>{items.length > 0 && <button className="text-button" onClick={clearAll} disabled={busy}><RefreshCw size={13}/> Clear</button>}</div>
 {busy && pending ? <div className="processing-preview"><img src={pending.originalUrl} alt="Original image being processed"/><ProcessingLoader progress={progress} name={pending.name}/><span className="queue-count">{queue}</span></div> : current ? <ImageComparison result={current}/> : <div className="preview-empty"><div className="scan-icon"><ScanLine size={37}/></div><h3>A clearer view awaits.</h3><p>Upload an image to reveal your result.<br/>Slide, compare, and explore the difference.</p><div className="empty-pills"><span>Original</span><span>Enhanced</span></div></div>}
 </div></div>
 {errors.length > 0 && <div className="error-box" role="alert"><div>{errors.map((error,i) => <p key={i}>{error}</p>)}</div><button aria-label="Dismiss errors" onClick={() => setErrors([])}><X size={18}/></button></div>}
 </section><EnhancementHistory items={items} currentId={current?.id} onSelect={item => { if (!busy) setCurrent(item); }} stored={stored} historyStatus={historyStatus}/><Footer/></main></>;
}
