import { useEffect, useRef, useState } from 'react';
import { Columns2, SlidersHorizontal, Expand, X, Download, Clock3 } from 'lucide-react';
export default function ImageComparison({ result }) {
 const [position, setPosition] = useState(50);
 const [mode, setMode] = useState('slider');
 const dialog = useRef(null);
 useEffect(() => { setPosition(50); }, [result.id]);
 const pictures = fullscreen => <div className={`${mode === 'side' ? 'side-by-side' : 'comparison-canvas'} ${fullscreen ? 'expanded-canvas' : ''}`}>
  {mode === 'side' ? <><figure><img src={result.originalUrl} alt="Original underwater upload"/><figcaption>ORIGINAL · RESIZED FOR ALIGNMENT</figcaption></figure><figure><img src={result.outputUrl} alt="PIXMambaNet enhanced image"/><figcaption>ENHANCED · 256 × 256</figcaption></figure></> : <>
   <img className="compare-image" src={result.outputUrl} alt="Enhanced underwater image"/>
   <img className="compare-image original-layer" src={result.originalUrl} alt="Original underwater image" style={{ clipPath: `inset(0 ${100-position}% 0 0)` }}/>
   <div className="split-line" style={{ left: `${position}%` }}><span>‹ ›</span></div>
   <div className="image-label before-label">ORIGINAL</div><div className="image-label after-label">ENHANCED</div>
   <input type="range" min="0" max="100" value={position} onChange={e => setPosition(Number(e.target.value))} className="comparison-range" aria-label="Before and after comparison position"/>
  </>}
 </div>;
 return <div className="result"><div className="result-toolbar"><span className="result-ready"><span className="tiny-dot"/> Enhancement complete</span><div className="view-buttons"><button aria-label="Slider comparison" aria-pressed={mode === 'slider'} onClick={() => setMode('slider')}><SlidersHorizontal size={17}/></button><button aria-label="Side by side comparison" aria-pressed={mode === 'side'} onClick={() => setMode('side')}><Columns2 size={17}/></button><button aria-label="Fullscreen preview" onClick={() => dialog.current.showModal()}><Expand size={17}/></button></div></div>
 {pictures(false)}<div className="result-meta"><span><Clock3 size={14}/> {(result.totalMs/1000).toFixed(2)}s API · {(result.inferenceMs/1000).toFixed(2)}s model</span><span>PNG · 256 × 256</span></div>
 <p className="alignment-note">Original stretched to the model’s square input for aligned comparison.</p><a className="primary download" href={result.outputUrl} download={result.downloadName}><Download size={17}/> Download enhanced image</a>
 <dialog ref={dialog} className="fullscreen-dialog" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}><div className="dialog-heading"><span>{result.name}</span><button aria-label="Close fullscreen" onClick={() => dialog.current.close()}><X/></button></div>{pictures(true)}</dialog></div>;
}
