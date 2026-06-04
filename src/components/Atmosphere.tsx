/**
 * Full-page background layer. Renders two soft radial gradient glows
 * (top-left lime, bottom-right warm red) plus a faint SVG turbulence noise
 * texture to keep the dark base from looking flat and dead.
 *
 * Mount once near the root of <App />. Sits at z-index 0, screen content at 1.
 */
export default function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden>
      <svg className="atmosphere-noise" xmlns="http://www.w3.org/2000/svg">
        <filter id="bk-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bk-noise)" />
      </svg>
    </div>
  );
}
