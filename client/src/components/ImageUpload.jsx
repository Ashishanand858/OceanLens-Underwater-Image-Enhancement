import { useRef, useState } from 'react';
import { UploadCloud, Images } from 'lucide-react';
export default function ImageUpload({ onFiles, disabled }) {
 const input = useRef(null);
 const [drag, setDrag] = useState(false);
 function drop(event) { event.preventDefault(); setDrag(false); if (!disabled) onFiles([...event.dataTransfer.files]); }
 return <div className={`upload-panel ${drag ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={drop}>
  <div className="upload-icon"><UploadCloud size={29}/></div><h3>Drop into clarity.</h3><p>Drag your underwater images here,<br/>or choose them from your device.</p>
  <button className="primary" disabled={disabled} onClick={() => input.current.click()}><Images size={17}/> Browse images</button>
  <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png" multiple aria-label="Upload underwater images" disabled={disabled} onChange={e => { onFiles([...e.target.files]); e.target.value = ''; }}/>
  <div className="file-spec">JPG or PNG · Up to 10 MB · 20 MP max</div><div className="upload-note"><span className="tiny-dot"/> Enhancement starts automatically</div>
 </div>;
}
