import { Waves, ArrowUpRight } from 'lucide-react';
export default function Footer() {
 return (
   <>
     <section className="about" id="about">
       <div>
         <div className="eyebrow">THE SCIENCE BELOW THE SURFACE</div>
         <h2>
           A familiar image.
           <br />
           <span>A different perspective.</span>
         </h2>
         <p>
           Powered by your trained PIXMambaNet: a convolutional encoder, two
           PixelMamba blocks, and a decoder that produces an enhanced RGB image.
         </p>
       </div>
       <div className="model-facts">
         <article>
           <span>01</span>
           <h3>True model inference</h3>
           <p>
             Every result runs through the supplied PyTorch weights. No preset
             filters or substituted outputs.
           </p>
         </article>
         <article>
           <span>02</span>
           <h3>Honest resolution</h3>
           <p>
             Images are processed and exported at 256 × 256. Fine detail depends
             on the trained model and input.
           </p>
         </article>
         <article>
           <span>03</span>
           <h3>Built to run locally</h3>
           <p>
             CPU compatible, with automatic CUDA support when available. No paid
             image API required.
           </p>
         </article>
       </div>
     </section>
     <footer>
       <a href="#" className="brand">
         <Waves size={22} /> OceanLens
       </a>
       <span>Underwater Image Enhancement Using PIXMambaNet</span>
       <a href="#studio">
         Back to studio <ArrowUpRight size={14} />
       </a>
     </footer>
   </>
 );
}
