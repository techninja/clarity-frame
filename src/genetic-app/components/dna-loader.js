import { LitElement, html, css } from 'lit';
import * as THREE from 'three';

export class DNALoader extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .loader-container {
      background: transparent;
      border: none;
      border-radius: 0.75rem;
      padding: 2rem;
      backdrop-filter: blur(2px);
      text-align: center;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .loader-canvas {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    @media (min-width: 768px) {
      .loader-container {
        height: 60vh;
        padding: 0;
      }
      
      .loader-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 0.75rem;
        margin: 0;
        z-index: 2;
      }
    }

    .loader-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .loader-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    @media (min-width: 768px) {
      .loader-text,
      .loader-subtitle {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        z-index: 3;
        color: var(--text-primary);
        margin: 0;
        text-align: center;
      }
      
      .loader-text {
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .loader-subtitle {
        top: calc(50% + 1rem);
      }
    }

    .loader-text {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .loader-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }
  `;

  static properties = {
    message: { type: String },
    subtitle: { type: String }
  };

  constructor() {
    super();
    this.message = 'Searching...';
    this.subtitle = 'Analyzing genetic data';
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.helixes = [];
    this.molecules = [];
    this.animationId = null;
  }

  firstUpdated() {
    this._initThreeJS();
    this._createDNAKaleidoscope();
    this._animate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  _initThreeJS() {
    const canvas = this.shadowRoot.querySelector('.loader-canvas');
    const rect = canvas.getBoundingClientRect();
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setClearColor(0x000000, 0);
    canvas.appendChild(this.renderer.domElement);

    this.camera.position.z = 8;
  }

  _createDNAKaleidoscope() {
    const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444, 0x8b5cf6, 0x06b6d4];
    const helixCount = window.innerWidth >= 768 ? 12 : 6;
    const radiusX = window.innerWidth >= 768 ? 12 : 3;
    const radiusY = window.innerWidth >= 768 ? 4 : 2;
    
    for (let i = 0; i < helixCount; i++) {
      const helix = this._createDNAHelix(colors[i % colors.length]);
      const angle = (i / helixCount) * Math.PI * 2;
      
      helix.position.set(
        Math.cos(angle) * radiusX,
        Math.sin(angle) * radiusY,
        (Math.random() - 0.5) * 2
      );
      helix.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      helix.userData = { angle, radiusX, radiusY };
      this.helixes.push(helix);
      this.scene.add(helix);
    }
    
    // Add floating molecules
    const moleculeCount = window.innerWidth >= 768 ? 20 : 10;
    for (let i = 0; i < moleculeCount; i++) {
      const molecule = this._createMolecule();
      const angle = Math.random() * Math.PI * 2;
      const radius = radiusX * (0.7 + Math.random() * 0.2);
      
      molecule.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * (radiusY * (0.3 + Math.random() * 0.7)),
        (Math.random() - 0.5) * 3
      );
      molecule.userData = { 
        angle, 
        radius: radius * (0.8 + Math.random() * 0.4),
        speed: 0.3 + Math.random() * 0.1,
        radiusY: radiusY * (0.3 + Math.random() * 0.7)
      };
      this.molecules.push(molecule);
      this.scene.add(molecule);
    }
  }

  _createDNAHelix(color) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color });
    
    // Create helix structure
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 4;
      const y = (i / 20) * 2 - 1;
      
      // Base pair spheres
      const sphere1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 6),
        material
      );
      sphere1.position.set(Math.cos(angle) * 0.3, y, Math.sin(angle) * 0.3);
      
      const sphere2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 6),
        material
      );
      sphere2.position.set(Math.cos(angle + Math.PI) * 0.3, y, Math.sin(angle + Math.PI) * 0.3);
      
      // Connecting line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        sphere1.position,
        sphere2.position
      ]);
      const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color }));
      
      group.add(sphere1, sphere2, line);
    }
    
    return group;
  }

  _createMolecule() {
    const group = new THREE.Group();
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3, 0x54a0ff, 0x5f27cd, 0xe17055, 0x00b894];
    const centralColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Variable central atom size
    const centralSize = 0.06 + Math.random() * 0.04;
    const centralAtom = new THREE.Mesh(
      new THREE.SphereGeometry(centralSize, 8, 6),
      new THREE.MeshBasicMaterial({ color: centralColor })
    );
    group.add(centralAtom);
    
    // 2-6 connected atoms with chains
    const atomCount = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < atomCount; i++) {
      const angle = (i / atomCount) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 0.12 + Math.random() * 0.15;
      const atomColor = colors[Math.floor(Math.random() * colors.length)];
      const atomSize = 0.03 + Math.random() * 0.03;
      
      const atom = new THREE.Mesh(
        new THREE.SphereGeometry(atomSize, 6, 4),
        new THREE.MeshBasicMaterial({ color: atomColor })
      );
      atom.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        (Math.random() - 0.5) * 0.15
      );
      
      // Bond line with variable thickness
      const bondGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        atom.position
      ]);
      const bondMaterial = new THREE.LineBasicMaterial({ 
        color: Math.random() > 0.5 ? centralColor : atomColor,
        linewidth: 1 + Math.random() * 2
      });
      const bond = new THREE.Line(bondGeometry, bondMaterial);
      
      group.add(atom, bond);
      
      // 30% chance of secondary atoms
      if (Math.random() > 0.7) {
        const secondaryAngle = angle + (Math.random() - 0.5) * Math.PI;
        const secondaryDistance = 0.08 + Math.random() * 0.08;
        const secondaryAtom = new THREE.Mesh(
          new THREE.SphereGeometry(0.025 + Math.random() * 0.02, 4, 3),
          new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
        );
        secondaryAtom.position.set(
          atom.position.x + Math.cos(secondaryAngle) * secondaryDistance,
          atom.position.y + Math.sin(secondaryAngle) * secondaryDistance,
          atom.position.z + (Math.random() - 0.5) * 0.1
        );
        
        const secondaryBond = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([atom.position, secondaryAtom.position]),
          new THREE.LineBasicMaterial({ color: atomColor })
        );
        
        group.add(secondaryAtom, secondaryBond);
      }
    }
    
    return group;
  }

  _animate() {
    this.animationId = requestAnimationFrame(() => this._animate());
    
    const time = Date.now() * 0.001;
    
    this.helixes.forEach((helix, index) => {
      helix.rotation.x += 0.01 + index * 0.002;
      helix.rotation.y += 0.015 + index * 0.001;
      
      const { radiusX, radiusY } = helix.userData;
      const currentAngle = helix.userData.angle + time * 0.2;
      helix.position.x = Math.cos(currentAngle) * radiusX;
      helix.position.y = Math.sin(currentAngle) * radiusY;
    });
    
    this.molecules.forEach((molecule, index) => {
      molecule.rotation.x += 0.005;
      molecule.rotation.y += 0.005;
      
      const { radius, radiusY } = molecule.userData;
      const currentAngle = molecule.userData.angle + time * 0.1;
      molecule.position.x = Math.cos(currentAngle) * radius;
      molecule.position.y = Math.sin(currentAngle) * radiusY;
    });
    
    // Camera movement stopped for debugging
    // const radius = window.innerWidth >= 768 ? 4 : 2;
    // this.camera.position.x = Math.sin(time * 0.3) * radius;
    // this.camera.position.y = Math.cos(time * 0.2) * radius;
    // this.camera.lookAt(0, 0, 0);
    
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return html`
      <div class="loader-container">
        <div class="loader-canvas"></div>
        <div class="loader-text">${this.message}</div>
        <div class="loader-subtitle">${this.subtitle}</div>
      </div>
    `;
  }
}

customElements.define('dna-loader', DNALoader);
