export function getAnimatedLogo(size = 40, loop = false) {
  const loopStyle = loop ? 'infinite' : '1';
  return `
    <div style="position: relative; width: ${size}px; height: ${size}px;" class="bm-logo-container">
      <svg viewBox="0 0 100 100" width="${size}" height="${size}" style="animation: logoEnter 0.4s ease-out;">
        <!-- The "B" Shape -->
        <path d="M 20 10 L 50 10 C 70 10 70 45 50 45 C 75 45 75 90 50 90 L 20 90 Z" 
              fill="none" stroke="var(--primary)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Bar Chart inside B -->
        <rect x="35" y="60" width="8" height="0" fill="var(--primary)" rx="2" class="logo-bar" style="animation: barGrow 0.6s ease-out forwards; animation-delay: 0ms; transform-origin: bottom;" />
        <rect x="50" y="30" width="8" height="0" fill="var(--primary)" rx="2" class="logo-bar" style="animation: barGrow 0.6s ease-out forwards; animation-delay: 150ms; transform-origin: bottom;" />
        <rect x="65" y="45" width="8" height="0" fill="var(--primary)" rx="2" class="logo-bar" style="animation: barGrow 0.6s ease-out forwards; animation-delay: 300ms; transform-origin: bottom;" />
      </svg>
      <!-- Orbiting Coin -->
      <div class="logo-coin-orbit" style="position: absolute; inset: -10%; animation: coinOrbit ${loop ? '3s linear infinite' : '0.8s ease-in-out forwards'};">
        <div style="position: absolute; bottom: 0; right: 0; width: ${size * 0.3}px; height: ${size * 0.3}px; background: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${size * 0.15}px; font-weight: bold; color: #78350f; box-shadow: 0 2px 5px rgba(0,0,0,0.3); opacity: 0; animation: fadeIn 0.4s forwards; animation-delay: 0.4s;">
          ₹
        </div>
      </div>
    </div>
  `;
}
