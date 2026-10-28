import { LoaderCircle } from 'lucide-react';
export default function ProcessingLoader({ progress, name }) {
 return <div className="processing" role="status" aria-live="polite"><LoaderCircle className="spin" size={28}/><h3>{progress < 100 ? 'Uploading your image…' : 'Looking beneath the surface…'}</h3><p>{name}</p><div className="progress-track"><div className={progress >= 100 ? 'indeterminate' : ''} style={{ width: `${Math.max(progress, 5)}%` }}/></div><small>{progress < 100 ? `Upload ${progress}%` : 'PIXMambaNet is processing. Timing depends on your device.'}</small></div>;
}
