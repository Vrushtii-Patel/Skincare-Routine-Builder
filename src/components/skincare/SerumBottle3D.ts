import * as THREE from 'three';

export function createSerumBottle(): THREE.Group {
  const bottleGroup = new THREE.Group();

  // 1. Create Luxury Label Texture via Canvas
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 1024;
  const ctx = labelCanvas.getContext('2d');
  if (ctx) {
    // Background
    ctx.fillStyle = '#FFF8F9';
    ctx.fillRect(0, 0, 1024, 1024);

    // Outer and inner border
    ctx.strokeStyle = '#E8B4C2';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 944, 944);

    ctx.strokeStyle = '#F2D3DC';
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, 912, 912);

    // Header badge
    ctx.fillStyle = '#886875';
    ctx.font = '600 32px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText('R I T U A L', 512, 160);

    // Number
    ctx.fillStyle = '#B96F87';
    ctx.font = '700 48px Poppins, sans-serif';
    ctx.fillText('N° 01', 512, 240);

    // Divider line
    ctx.strokeStyle = '#D88FA6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(380, 275);
    ctx.lineTo(644, 275);
    ctx.stroke();

    // Botanical twig icon sketch
    ctx.strokeStyle = '#886875';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(512, 380);
    ctx.quadraticCurveTo(500, 340, 512, 305);
    ctx.stroke();
    // leaves
    ctx.beginPath();
    ctx.ellipse(492, 335, 18, 9, -Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(532, 350, 18, 9, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#D88FA6';
    ctx.fill();

    // Title
    ctx.fillStyle = '#3D2630';
    ctx.font = '800 62px Poppins, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('HYDRA-GLOW', 512, 475);
    ctx.font = '700 40px Poppins, sans-serif';
    ctx.fillStyle = '#B96F87';
    ctx.fillText('ACTIVE SERUM', 512, 535);

    // Formula Actives
    ctx.font = '500 30px Poppins, sans-serif';
    ctx.fillStyle = '#4A333E';
    ctx.fillText('5% Niacinamide + Multi-Peptides', 512, 630);
    ctx.font = '400 26px Poppins, sans-serif';
    ctx.fillStyle = '#886875';
    ctx.fillText('Hyaluronic Acid & Centella Asiatica', 512, 680);

    // Claims
    ctx.font = '500 24px Poppins, sans-serif';
    ctx.fillStyle = '#B96F87';
    ctx.fillText('BARRIER DEFENSE • RESTORATIVE', 512, 770);

    // Bottom Volume
    ctx.font = '600 26px Poppins, sans-serif';
    ctx.fillStyle = '#5A3D49';
    ctx.fillText('30 ML / 1.0 FL. OZ.', 512, 880);
  }

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;

  // 2. Outer Glass Bottle (Thick Luxury Glass with Base Bevel & Lip)
  const glassPoints: THREE.Vector2[] = [
    new THREE.Vector2(0, -1.25),
    new THREE.Vector2(0.52, -1.25),
    new THREE.Vector2(0.63, -1.21),
    new THREE.Vector2(0.67, -1.13),
    new THREE.Vector2(0.68, -1.0),
    new THREE.Vector2(0.68, 0.52),
    new THREE.Vector2(0.66, 0.63),
    new THREE.Vector2(0.61, 0.72),
    new THREE.Vector2(0.50, 0.81),
    new THREE.Vector2(0.38, 0.88),
    new THREE.Vector2(0.34, 0.94),
    new THREE.Vector2(0.34, 1.15),
    new THREE.Vector2(0.36, 1.17),
    new THREE.Vector2(0.36, 1.20),
    new THREE.Vector2(0.30, 1.20),
    new THREE.Vector2(0.26, 1.16),
    new THREE.Vector2(0.26, 0.92),
    new THREE.Vector2(0.36, 0.84),
    new THREE.Vector2(0.50, 0.73),
    new THREE.Vector2(0.56, 0.58),
    new THREE.Vector2(0.56, -0.92),
    new THREE.Vector2(0.52, -1.04),
    new THREE.Vector2(0.35, -1.09),
    new THREE.Vector2(0, -1.09),
  ];

  const glassGeo = new THREE.LatheGeometry(glassPoints, 48);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.93,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.52,
    thickness: 0.45,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 0.92,
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  bottleGroup.add(glassMesh);

  // 3. Inner Liquid (Blush Pink Skincare Serum)
  const liquidPoints: THREE.Vector2[] = [
    new THREE.Vector2(0, -1.08),
    new THREE.Vector2(0.34, -1.08),
    new THREE.Vector2(0.51, -1.03),
    new THREE.Vector2(0.55, -0.91),
    new THREE.Vector2(0.55, 0.32),
    new THREE.Vector2(0.54, 0.35),
    new THREE.Vector2(0.48, 0.33),
    new THREE.Vector2(0.20, 0.31),
    new THREE.Vector2(0.08, 0.31),
    new THREE.Vector2(0, 0.31),
  ];

  const liquidGeo = new THREE.LatheGeometry(liquidPoints, 36);
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xF7B5C6,
    transmission: 0.52,
    opacity: 0.96,
    transparent: true,
    roughness: 0.1,
    ior: 1.35,
    attenuationColor: new THREE.Color(0xDF6989),
    attenuationDistance: 0.6,
    specularIntensity: 0.95,
  });
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  bottleGroup.add(liquidMesh);

  // 4. Internal Pipette (Glass Tube + Internal Droplet Column)
  const pipetteGeo = new THREE.CylinderGeometry(0.055, 0.055, 1.82, 24);
  const pipetteMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.92,
    opacity: 0.9,
    transparent: true,
    roughness: 0.06,
    ior: 1.5,
  });
  const pipetteMesh = new THREE.Mesh(pipetteGeo, pipetteMat);
  pipetteMesh.position.y = 0.08;
  bottleGroup.add(pipetteMesh);

  // Pipette tapered tip
  const tipGeo = new THREE.CylinderGeometry(0.055, 0.02, 0.14, 24);
  const tipMesh = new THREE.Mesh(tipGeo, pipetteMat);
  tipMesh.position.y = -0.90;
  bottleGroup.add(tipMesh);

  // Drawn serum column inside pipette
  const innerLiquidGeo = new THREE.CylinderGeometry(0.038, 0.038, 1.25, 16);
  const innerLiquidMesh = new THREE.Mesh(innerLiquidGeo, liquidMat);
  innerLiquidMesh.position.y = -0.22;
  bottleGroup.add(innerLiquidMesh);

  // 5. Dropper Metallic Collar (Rose Gold)
  const collarGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.44, 48);
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xE8B8C2,
    metalness: 0.88,
    roughness: 0.22,
    envMapIntensity: 1.2,
  });
  const collarMesh = new THREE.Mesh(collarGeo, collarMat);
  collarMesh.position.y = 1.06;
  bottleGroup.add(collarMesh);

  // Stepped ring collar details
  const collarRingGeo = new THREE.CylinderGeometry(0.405, 0.405, 0.07, 48);
  const collarRingMesh = new THREE.Mesh(collarRingGeo, collarMat);
  collarRingMesh.position.y = 0.88;
  bottleGroup.add(collarRingMesh);

  const collarTopGeo = new THREE.CylinderGeometry(0.37, 0.35, 0.06, 48);
  const collarTopMesh = new THREE.Mesh(collarTopGeo, collarMat);
  collarTopMesh.position.y = 1.30;
  bottleGroup.add(collarTopMesh);

  // 6. Silicone Dropper Bulb
  const bulbPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.32, 1.32),
    new THREE.Vector2(0.35, 1.48),
    new THREE.Vector2(0.34, 1.70),
    new THREE.Vector2(0.28, 1.90),
    new THREE.Vector2(0.18, 2.02),
    new THREE.Vector2(0, 2.06),
  ];
  const bulbGeo = new THREE.LatheGeometry(bulbPoints, 36);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xFFF5F7,
    roughness: 0.65,
    metalness: 0.04,
  });
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bottleGroup.add(bulbMesh);

  // 7. Minimalist Curved Wrap-around Label
  // Theta length ~ 150 degrees (wraps around front)
  const labelGeo = new THREE.CylinderGeometry(
    0.685,
    0.685,
    1.1,
    48,
    1,
    true,
    -Math.PI * 0.42,
    Math.PI * 0.84
  );
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    roughness: 0.32,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.y = -0.24;
  bottleGroup.add(labelMesh);

  // 8. Tiny Floating Micro-bubbles inside serum
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.95,
    roughness: 0.04,
    ior: 1.25,
    specularIntensity: 1.0,
  });

  const bubbleCoords = [
    { x: 0.18, y: -0.42, z: 0.14, r: 0.028 },
    { x: -0.22, y: -0.15, z: -0.12, r: 0.022 },
    { x: 0.14, y: 0.12, z: -0.18, r: 0.032 },
    { x: -0.16, y: -0.68, z: 0.11, r: 0.024 },
    { x: 0.05, y: -0.32, z: 0.22, r: 0.020 },
  ];

  bubbleCoords.forEach((b) => {
    const geo = new THREE.SphereGeometry(b.r, 16, 16);
    const m = new THREE.Mesh(geo, bubbleMat);
    m.position.set(b.x, b.y, b.z);
    bottleGroup.add(m);
  });

  // Center the bottle so the pivot is right at the label center
  bottleGroup.position.y = -0.38;

  // Orient so front (+Z of label) faces +X to match Melli's coordinate system
  // (In Melli: yaw 0 = facing right +X, yaw 90 = facing camera +Z)
  // Our label is centered around +Z, so rotating around Y by -PI/2 aligns +Z with +X:
  bottleGroup.rotation.y = -Math.PI / 2;

  const root = new THREE.Group();
  root.add(bottleGroup);
  return root;
}

