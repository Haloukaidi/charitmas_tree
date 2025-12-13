
import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { BaseProps } from '../types';

interface PhotoOrnamentsProps extends BaseProps {
  rotationSpeed?: number;
}

// Helper to generate a nice blank "paper" texture for empty frames
const createPlaceholderTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Off-white paper background
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, 64, 64);
    
    // Subtle noise/grain
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for(let i=0; i<100; i++) {
        ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const PhotoOrnaments = ({ state, rotationSpeed = 0, setZoomed, zoomRequest = false }: PhotoOrnamentsProps) => {
  const fileList = CONFIG.photos.files;
  const totalSlots = CONFIG.counts.ornaments;
  const groupRef = useRef<THREE.Group>(null);
  
  // --- TEXTURE LOADING LOGIC ---
  // 1. Initialize all slots with placeholder textures
  const [textures, setTextures] = useState<THREE.Texture[]>(() => {
    const placeholder = createPlaceholderTexture();
    return new Array(totalSlots).fill(placeholder);
  });

  // 2. Track which indices are REAL photos (loaded successfully)
  const loadedIndicesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    // Iterate only through the available files, up to the maximum slot count
    const limit = Math.min(fileList.length, totalSlots);
    
    for (let i = 0; i < limit; i++) {
        const path = fileList[i];
        // Add cache buster to force re-fetch if file changed
        const versionedPath = `${path}?v=${Date.now()}`;
        
        loader.load(
            versionedPath,
            (loadedTexture) => {
                // ON SUCCESS
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                
                setTextures((prev) => {
                    const newTextures = [...prev];
                    newTextures[i] = loadedTexture;
                    return newTextures;
                });
                
                loadedIndicesRef.current.add(i);
            },
            undefined, 
            () => {
                // ON ERROR: decorative placeholder remains (already set in initial state)
                console.warn(`Failed to load photo: ${path}`);
            }
        );
    }
  }, [fileList, totalSlots]);

  const selectedIndex = useRef(-1);

  const borderGeometry = useMemo(() => new THREE.PlaneGeometry(1.2, 1.5), []);
  const photoGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const data = useMemo(() => {
    return new Array(totalSlots).fill(0).map((_, i) => {
      const chaosPos = new THREE.Vector3((Math.random()-0.5)*70, (Math.random()-0.5)*70, (Math.random()-0.5)*70);
      const h = CONFIG.tree.height; const y = (Math.random() * h) - (h / 2);
      const rBase = CONFIG.tree.radius;
      const currentRadius = (rBase * (1 - (y + (h/2)) / h)) + 0.5;
      const theta = Math.random() * Math.PI * 2;
      const targetPos = new THREE.Vector3(currentRadius * Math.cos(theta), y, currentRadius * Math.sin(theta));

      const isBig = Math.random() < 0.2;
      const baseScale = isBig ? 2.2 : 0.8 + Math.random() * 0.6;
      const weight = 0.8 + Math.random() * 1.2;
      const borderColor = CONFIG.colors.borders[Math.floor(Math.random() * CONFIG.colors.borders.length)];

      const rotationSpeed = {
        x: (Math.random() - 0.5) * 1.0,
        y: (Math.random() - 0.5) * 1.0,
        z: (Math.random() - 0.5) * 1.0
      };
      const chaosRotation = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

      return {
        chaosPos, targetPos, scale: baseScale, weight,
        textureIndex: i, // Direct mapping: slot 0 uses texture 0
        borderColor,
        currentPos: chaosPos.clone(),
        chaosRotation,
        rotationSpeed,
        wobbleOffset: Math.random() * 10,
        wobbleSpeed: 0.5 + Math.random() * 0.5
      };
    });
  }, [totalSlots, textures.length]); // Re-calc only if counts change

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === 'FORMED';
    const time = stateObj.clock.elapsedTime;
    
    const isZooming = selectedIndex.current !== -1 && zoomRequest;

    if (!isFormed && !isZooming) {
      // Browsing mode: find the photo in the center of the screen
      let maxDot = -1;
      let bestIndex = -1;
      const camPos = stateObj.camera.position;
      const camDir = new THREE.Vector3();
      stateObj.camera.getWorldDirection(camDir);

      groupRef.current.children.forEach((group, i) => {
        const worldPos = new THREE.Vector3();
        group.getWorldPosition(worldPos);
        const dirToPhoto = worldPos.sub(camPos).normalize();
        const dot = dirToPhoto.dot(camDir);
        if (dot > maxDot && dot > 0.92) { 
          maxDot = dot;
          bestIndex = i;
        }
      });
      selectedIndex.current = bestIndex;
    } else if (isFormed) {
      selectedIndex.current = -1;
    }

    if (setZoomed) setZoomed(isZooming);

    // --- UPDATE POSITIONS & VISUALS ---
    groupRef.current.children.forEach((group, i) => {
      const objData = data[i];
      let target = isFormed ? objData.targetPos : objData.chaosPos;
      
      const isSelected = i === selectedIndex.current && !isFormed;
      let targetScale = objData.scale;

      // Handle Zooming Movement
      if (isSelected && isZooming) {
          const camPos = stateObj.camera.position.clone();
          const camDir = new THREE.Vector3();
          stateObj.camera.getWorldDirection(camDir);
          
          // Calculate World Position 15 units in front of camera
          const frontWorldPos = camPos.add(camDir.multiplyScalar(15));
          // Shift up slightly for better framing
          frontWorldPos.y += 0.0; // Centered

          if (groupRef.current) {
             target = groupRef.current.worldToLocal(frontWorldPos.clone());
          }

          targetScale = 5.0; 

          // FIX: Use quaternion copy instead of lookAt to ensure it is perfectly screen-aligned (upright)
          group.quaternion.copy(stateObj.camera.quaternion);

      } else {
          // Standard Movement (Non-zoomed)
          if (isFormed) {
             const targetLookPos = new THREE.Vector3(group.position.x * 2, group.position.y + 0.5, group.position.z * 2);
             group.lookAt(targetLookPos);
             
             // Wobble effect
             const wobbleX = Math.sin(time * objData.wobbleSpeed + objData.wobbleOffset) * 0.05;
             const wobbleZ = Math.cos(time * objData.wobbleSpeed * 0.8 + objData.wobbleOffset) * 0.05;
             group.rotation.x += wobbleX;
             group.rotation.z += wobbleZ;
          } else {
             group.rotation.x += delta * objData.rotationSpeed.x;
             group.rotation.y += delta * objData.rotationSpeed.y;
             group.rotation.z += delta * objData.rotationSpeed.z;
          }
      }

      // Position Lerp
      const lerpSpeed = isSelected && isZooming ? 10.0 : (isFormed ? 0.8 * objData.weight : 0.5);
      objData.currentPos.lerp(target, delta * lerpSpeed);
      group.position.copy(objData.currentPos);

      // Scale Lerp
      if (isSelected && !isZooming) {
          targetScale = objData.scale * 1.3;
      }
      const currentScale = group.scale.x; 
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 4);
      group.scale.set(newScale, newScale, newScale);

      // Border Color
      group.children.forEach((sideGroup) => {
        const borderMesh = sideGroup.children[1] as THREE.Mesh; 
        if (borderMesh && borderMesh.material) {
           const mat = borderMesh.material as THREE.MeshStandardMaterial;
           if (isSelected) {
              mat.color.set(objData.borderColor); 
              mat.emissive.set(objData.borderColor);
              mat.emissiveIntensity = isZooming ? 2.0 : 1.0;
           } else {
              mat.color.set(objData.borderColor);
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
           }
        }
      });
      
      if (isSelected && isZooming) {
        group.renderOrder = 999;
      } else {
        group.renderOrder = 0;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => {
         const tex = textures[obj.textureIndex];
         const isLoaded = loadedIndicesRef.current.has(obj.textureIndex);

         return (
          <group key={i} scale={[obj.scale, obj.scale, obj.scale]} rotation={state === 'CHAOS' ? obj.chaosRotation : new THREE.Euler(0,0,0)}>
            {/* Front */}
            <group position={[0, 0, 0.015]}>
              <mesh geometry={photoGeometry}>
                <meshStandardMaterial
                  map={tex}
                  roughness={0.5} metalness={0}
                  emissive={CONFIG.colors.white} 
                  emissiveMap={tex} 
                  emissiveIntensity={isLoaded ? 0.5 : 0.1}
                  side={THREE.DoubleSide} 
                  depthTest={true} 
                />
              </mesh>
              <mesh geometry={borderGeometry} position={[0, -0.15, -0.01]}>
                <meshStandardMaterial color={obj.borderColor} roughness={0.9} metalness={0} side={THREE.DoubleSide} depthTest={true} />
              </mesh>
            </group>
            {/* Back */}
            <group position={[0, 0, -0.015]} rotation={[0, Math.PI, 0]}>
              <mesh geometry={photoGeometry}>
                <meshStandardMaterial
                  map={tex}
                  roughness={0.5} metalness={0}
                  emissive={CONFIG.colors.white} 
                  emissiveMap={tex} 
                  emissiveIntensity={isLoaded ? 0.5 : 0.1}
                  side={THREE.DoubleSide}
                  depthTest={true}
                />
              </mesh>
              <mesh geometry={borderGeometry} position={[0, -0.15, -0.01]}>
                <meshStandardMaterial color={obj.borderColor} roughness={0.9} metalness={0} side={THREE.DoubleSide} depthTest={true} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};

export default PhotoOrnaments;
