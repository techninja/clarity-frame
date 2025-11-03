import { LitElement, html, css } from 'lit';
import rough from 'https://unpkg.com/roughjs@4.5.2/bundled/rough.esm.js';

export class ChromosomeIcon extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    
    svg {
      stroke: var(--text-primary, #6b7280);
      stroke-width: 2.5;
      stroke-linecap: round;
      fill: none;
      transition: transform 0.8s ease-in-out;
      overflow: hidden;
    }
    
    .wiggle {
      animation: organicWiggle 4s ease-in-out infinite;
    }
    
    @keyframes organicWiggle {
      0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
      25% { transform: translate(0.5px, -0.3px) rotate(0.2deg) scale(1.002); }
      50% { transform: translate(-0.3px, 0.4px) rotate(-0.1deg) scale(0.999); }
      75% { transform: translate(0.2px, 0.2px) rotate(0.1deg) scale(1.001); }
    }
  `;

  static properties = {
    chromosome: { type: String },
    darkMode: { type: Boolean }
  };

  constructor() {
    super();
    this.chromosome = '1';
    this.darkMode = false;
  }

  _getChromosomePath(chrNum) {
    const scaleX = 1.25; // Scale X by 50% of original 2.5x (24 * 1.25 = 30)
    const scaleY = 2.5;   // Scale Y by 100% (24 * 2.5 = 60)
    
    const scalePath = (path) => {
      return path.replace(/([ML])\s*([0-9.]+)\s+([0-9.]+)/g, (match, command, x, y) => {
        const scaledX = (parseFloat(x) * scaleX).toFixed(1);
        const scaledY = (parseFloat(y) * scaleY).toFixed(1);
        return `${command} ${scaledX} ${scaledY}`;
      });
    };
    
    const basePaths = {
      '1': 'M 6.0 3.0 L 12 11.6 L 4.0 21.0 M 18.0 3.0 L 12 11.6 L 20.0 21.0',
      '2': 'M 6.1 3.1 L 12 9.9 L 4.1 20.9 M 17.9 3.1 L 12 9.9 L 19.9 20.9',
      '3': 'M 6.8 4.6 L 12 11.6 L 5.2 19.4 M 17.2 4.6 L 12 11.6 L 18.8 19.4',
      '4': 'M 7.0 4.9 L 12 10.7 L 5.4 19.1 M 17.0 4.9 L 12 10.7 L 18.6 19.1',
      '5': 'M 7.2 5.3 L 12 11.0 L 5.6 18.7 M 16.8 5.3 L 12 11.0 L 18.4 18.7',
      'X': 'M 7.7 6.1 L 12 11.5 L 6.1 17.9 M 16.3 6.1 L 12 11.5 L 17.9 17.9',
      'Y': 'M 10.1 10.2 L 10.1 12.1 L 10.1 13.8 M 13.9 10.2 L 13.9 12.1 L 13.9 13.8'
    };
    
    const basePath = basePaths[chrNum] || basePaths['1'];
    return scalePath(basePath);
  }

  firstUpdated() {
    this._renderPath();
  }

  updated(changedProperties) {
    if (changedProperties.has('darkMode')) {
      this._renderPath();
    }
  }

  _renderPath() {
    const svg = this.shadowRoot.querySelector('svg');
    svg.innerHTML = ''; // Clear existing paths
    
    const rc = rough.svg(svg);
    const path = this._getChromosomePath(this.chromosome);
    
    // Get computed stroke color from CSS
    const computedStyle = getComputedStyle(svg);
    const strokeColor = computedStyle.stroke;
    
    // Create single path with subtle roughness
    const roughPath = rc.path(path, {
      stroke: strokeColor,
      strokeWidth: 2.5,
      roughness: 0.6,
      bowing: 0.3,
      seed: Math.floor(Math.random() * 100)
    });
    
    svg.appendChild(roughPath);
    svg.classList.add('wiggle');
    
    // Add random delay to desync multiple icons
    svg.style.animationDelay = `${Math.random() * 4}s`;
  }

  render() {
    return html`
      <svg width="20" height="40" viewBox="0 0 30 60"></svg>
    `;
  }
}

customElements.define('chromosome-icon', ChromosomeIcon);