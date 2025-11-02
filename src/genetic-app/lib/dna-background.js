import * as THREE from 'three';

export class DNABackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.dnaSegments = [];
    this.floatingMolecules = [];
    this.isLoading = false;
    
    this.baseColor = new THREE.Color(0xaaaaaa);
    this.loadingColor = new THREE.Color(0x3b82f6);
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0xf3f4f6, 0.8);
    this.camera.position.z = 50;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);

    this._createDNASegments();
    this._createFloatingMolecules();
    this._animate();
    
    window.addEventListener('resize', () => this._onWindowResize());
  }

  setLoadingState(loading) {
    this.isLoading = loading;
  }

  _createDNASegments() {
    const numSegments = 6;
    for (let i = 0; i < numSegments; i++) {
      const segment = this._createDNASegment(400);
      segment.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100 - 60
      );
      segment.rotation.set(
        (Math.random() - 0.5) * 0.15,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 1.5
      );
      segment.userData.spinY = (Math.random() - 0.5) * 0.005;
      this.scene.add(segment);
      this.dnaSegments.push(segment);
    }
  }

  _createDNASegment(numPairs = 400, helixRadius = 2, baseDist = 1.5) {
    const group = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const strandMaterial1 = new THREE.MeshPhongMaterial({ color: 0x5555ff });
    const strandMaterial2 = new THREE.MeshPhongMaterial({ color: 0xff5555 });
    const baseStickMaterial = new THREE.MeshPhongMaterial({ color: this.baseColor });

    let prevPoint1 = null;
    let prevPoint2 = null;

    for (let i = 0; i < numPairs; i++) {
      const angle = i * 0.5;
      const y = i * baseDist - (numPairs * baseDist / 2);

      const point1 = new THREE.Vector3(
        Math.cos(angle) * helixRadius,
        y,
        Math.sin(angle) * helixRadius
      );
      const point2 = new THREE.Vector3(
        Math.cos(angle + Math.PI) * helixRadius,
        y,
        Math.sin(angle + Math.PI) * helixRadius
      );

      // Spheres
      const sphere1 = new THREE.Mesh(sphereGeometry, strandMaterial1);
      sphere1.position.copy(point1);
      group.add(sphere1);

      const sphere2 = new THREE.Mesh(sphereGeometry, strandMaterial2);
      sphere2.position.copy(point2);
      group.add(sphere2);

      // Base connecting stick
      const baseStick = this._createStick(point1, point2, baseStickMaterial);
      if (baseStick) {
        baseStick.userData.isBase = true;
        group.add(baseStick);
      }

      // Backbone sticks
      if (prevPoint1) {
        const stick1 = this._createStick(prevPoint1, point1, strandMaterial1);
        if (stick1) group.add(stick1);
        const stick2 = this._createStick(prevPoint2, point2, strandMaterial2);
        if (stick2) group.add(stick2);
      }

      prevPoint1 = point1;
      prevPoint2 = point2;
    }

    return group;
  }

  _createStick(point1, point2, material, radius = 0.05) {
    const direction = new THREE.Vector3().subVectors(point2, point1);
    const length = direction.length();
    if (length < 0.01) return null;

    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    const mesh = new THREE.Mesh(geometry, material);
    
    const orientation = new THREE.Matrix4();
    orientation.lookAt(point1, point2, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    
    mesh.applyMatrix4(orientation);
    mesh.position.copy(point1).add(direction.multiplyScalar(0.5));
    return mesh;
  }

  _createFloatingMolecules() {
    const numMolecules = 50;
    for (let i = 0; i < numMolecules; i++) {
      const molecule = this._createFloatingMolecule();
      molecule.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 100 - 80
      );
      molecule.userData.driftX = (Math.random() - 0.5) * 0.005;
      molecule.userData.driftY = (Math.random() - 0.5) * 0.005;
      molecule.userData.driftZ = (Math.random() - 0.5) * 0.001;
      molecule.userData.rotX = (Math.random() - 0.5) * 0.002;
      molecule.userData.rotY = (Math.random() - 0.5) * 0.002;
      molecule.userData.radius = 2.0;
      
      this.scene.add(molecule);
      this.floatingMolecules.push(molecule);
    }
  }

  _createFloatingMolecule() {
    const group = new THREE.Group();
    const numSpheres = Math.floor(Math.random() * 4) + 1;
    const sphereGeometry = new THREE.SphereGeometry(0.5, 12, 12);
    const randomColor = new THREE.Color(Math.random() * 0xffffff);
    const material = new THREE.MeshPhongMaterial({
      color: randomColor,
      transparent: true,
      opacity: 0.85
    });

    const spheres = [];
    for (let i = 0; i < numSpheres; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.set(
        (Math.random() - 0.5) * 3.75,
        (Math.random() - 0.5) * 3.75,
        (Math.random() - 0.5) * 3.75
      );
      sphere.userData.isFloaterPart = true;
      group.add(sphere);
      spheres.push(sphere);
    }

    // Add connecting sticks
    if (numSpheres > 1) {
      const numSticks = Math.floor(Math.random() * numSpheres);
      for (let i = 0; i < numSticks; i++) {
        const idx1 = Math.floor(Math.random() * numSpheres);
        let idx2 = Math.floor(Math.random() * numSpheres);
        while (idx2 === idx1) idx2 = Math.floor(Math.random() * numSpheres);
        
        const stick = this._createStick(spheres[idx1].position, spheres[idx2].position, material, 0.075);
        if (stick) {
          stick.userData.isFloaterPart = true;
          group.add(stick);
        }
      }
    }

    return group;
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const targetColor = this.isLoading ? this.loadingColor : this.baseColor;
    const rotationSpeedMultiplier = this.isLoading ? 15 : 1;
    


    // Animate DNA segments
    this.dnaSegments.forEach(segment => {
      segment.rotation.y += segment.userData.spinY * rotationSpeedMultiplier;
      segment.rotation.x = Math.max(-0.15, Math.min(0.15, segment.rotation.x));

      segment.children.forEach(child => {
        if (child.userData.isBase && child.material instanceof THREE.MeshPhongMaterial) {
          child.material.color.lerp(targetColor, 0.05);
        }
      });
    });

    // Animate floating molecules
    this.floatingMolecules.forEach((molecule, i) => {
      molecule.position.x += molecule.userData.driftX;
      molecule.position.y += molecule.userData.driftY;
      molecule.position.z += molecule.userData.driftZ;
      molecule.rotation.x += molecule.userData.rotX;
      molecule.rotation.y += molecule.userData.rotY;

      // Boundary wrapping
      if (molecule.position.x > 120 || molecule.position.x < -120) molecule.userData.driftX *= -1;
      if (molecule.position.y > 90 || molecule.position.y < -90) molecule.userData.driftY *= -1;
      if (molecule.position.z > 0 || molecule.position.z < -100) molecule.userData.driftZ *= -1;

      // Color animation
      molecule.children.forEach(child => {
        if (child.material instanceof THREE.MeshPhongMaterial && child.userData.isFloaterPart) {
          const moleculeTargetColor = this.isLoading ? this.loadingColor : this.baseColor;
          child.material.color.lerp(moleculeTargetColor, 0.05);
        }
      });

      // Simple collision detection
      for (let j = i + 1; j < this.floatingMolecules.length; j++) {
        const other = this.floatingMolecules[j];
        const distSq = molecule.position.distanceToSquared(other.position);
        const minDist = molecule.userData.radius + other.userData.radius;
        
        if (distSq < minDist * minDist) {
          // Swap drift directions
          [molecule.userData.driftX, other.userData.driftX] = [other.userData.driftX, molecule.userData.driftX];
          [molecule.userData.driftY, other.userData.driftY] = [other.userData.driftY, molecule.userData.driftY];
          [molecule.userData.driftZ, other.userData.driftZ] = [other.userData.driftZ, molecule.userData.driftZ];
        }
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  _onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}