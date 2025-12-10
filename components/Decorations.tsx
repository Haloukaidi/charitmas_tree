import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';
import { BaseProps } from '../types';

export const ChristmasElements = ({ state }: BaseProps) => {
  const count = CONFIG.counts.elements;
  const groupRef = useRef<THREE.Group>(null);

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(0.8, 0.8, 0.8), []);
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);
  const caneGeometry = useMemo(() => new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const chaosPos = new THREE.Vector3((Math.random()-0.5)*60, (Math.random()-0.5)*60, (Math.random()-0.5)*60);
      const h = CONFIG.tree.height;
      const y = (Math.random() * h) - (h / 2);
      const rBase = CONFIG.tree.radius;
      const currentRadius = (rBase * (1 - (y + (h/2)) / h)) * 0.95;
      const theta = Math.random() * Math.PI * 2;

      const targetPos = new THREE.Vector3(currentRadius * Math.cos(theta), y, currentRadius * Math.sin(theta));

      const type = Math.floor(Math.random() * 3);
      let color; let scale = 1;
      if (type === 0) { color = CONFIG.colors.giftColors[Math.floor(Math.random() * CONFIG.colors.giftColors.length)]; scale = 0.8 + Math.random() * 0.4; }
      else if (type === 1) { color = CONFIG.colors.giftColors[Math.floor(Math.random() * CONFIG.colors.giftColors.length)]; scale = 0.6 + Math.random() * 0.4; }
      else { color = Math.random() > 0.5 ? CONFIG.colors.red : CONFIG.colors.white; scale = 0.7 + Math.random() * 0.3; }

      const rotationSpeed = { x: (Math.random()-0.5)*2.0, y: (Math.random()-0.5)*2.0, z: (Math.random()-0.5)*2.0 };
      return { type, chaosPos, targetPos, color, scale, currentPos: chaosPos.clone(), chaosRotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI), rotationSpeed };
    });
  }, [boxGeometry, sphereGeometry, caneGeometry]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === 'FORMED';
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;
      objData.currentPos.lerp(target, delta * 1.5);
      mesh.position.copy(objData.currentPos);
      mesh.rotation.x += delta * objData.rotationSpeed.x; mesh.rotation.y += delta * objData.rotationSpeed.y; mesh.rotation.z += delta * objData.rotationSpeed.z;
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => {
        let geometry; if (obj.type === 0) geometry = boxGeometry; else if (obj.type === 1) geometry = sphereGeometry; else geometry = caneGeometry;
        return ( <mesh key={i} scale={[obj.scale, obj.scale, obj.scale]} geometry={geometry} rotation={obj.chaosRotation}>
          <meshStandardMaterial color={obj.color} roughness={0.3} metalness={0.4} emissive={obj.color} emissiveIntensity={0.2} />
        </mesh> )})}
    </group>
  );
};

export const FairyLights = ({ state }: BaseProps) => {
  const count = CONFIG.counts.lights;
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.8, 8, 8), []);

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const chaosPos = new THREE.Vector3((Math.random()-0.5)*60, (Math.random()-0.5)*60, (Math.random()-0.5)*60);
      const h = CONFIG.tree.height; const y = (Math.random() * h) - (h / 2); const rBase = CONFIG.tree.radius;
      const currentRadius = (rBase * (1 - (y + (h/2)) / h)) + 0.3; const theta = Math.random() * Math.PI * 2;
      const targetPos = new THREE.Vector3(currentRadius * Math.cos(theta), y, currentRadius * Math.sin(theta));
      const color = CONFIG.colors.lights[Math.floor(Math.random() * CONFIG.colors.lights.length)];
      const speed = 2 + Math.random() * 3;
      return { chaosPos, targetPos, color, speed, currentPos: chaosPos.clone(), timeOffset: Math.random() * 100 };
    });
  }, [geometry]);

  useFrame((stateObj, delta) => {
    if (!groupRef.current) return;
    const isFormed = state === 'FORMED';
    const time = stateObj.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const objData = data[i];
      const target = isFormed ? objData.targetPos : objData.chaosPos;
      objData.currentPos.lerp(target, delta * 2.0);
      const mesh = child as THREE.Mesh;
      mesh.position.copy(objData.currentPos);
      const intensity = (Math.sin(time * objData.speed + objData.timeOffset) + 1) / 2;
      if (mesh.material) { 
        // Ensure lights are visible in CHAOS mode (base intensity 1.5)
        const baseIntensity = isFormed ? 3 : 1.5;
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = baseIntensity + intensity * (isFormed ? 4 : 2); 
      }
    });
  });

  return (
    <group ref={groupRef}>
      {data.map((obj, i) => ( <mesh key={i} scale={[0.15, 0.15, 0.15]} geometry={geometry}>
          <meshStandardMaterial color={obj.color} emissive={obj.color} emissiveIntensity={0} toneMapped={false} />
        </mesh> ))}
    </group>
  );
};

// --- New Ground Decorations (Gifts & Dolls) ---

const Snowman = () => (
    <group>
        {/* Body */}
        <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial color="white" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color="white" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="white" roughness={0.8} />
        </mesh>
        {/* Hat */}
        <mesh position={[0, 2.5, 0]}>
             <cylinderGeometry args={[0.2, 0.2, 0.5]} />
             <meshStandardMaterial color="#333" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 2.2, 0.25]} rotation={[Math.PI/2, 0, 0]}>
            <coneGeometry args={[0.05, 0.3]} />
            <meshStandardMaterial color="orange" />
        </mesh>
        {/* Scarf */}
        <mesh position={[0, 1.9, 0]} rotation={[0.1, 0, 0]}>
            <torusGeometry args={[0.35, 0.1, 8, 20]} />
            <meshStandardMaterial color="red" />
        </mesh>
    </group>
);

const Soldier = () => (
    <group>
        {/* Legs */}
        <mesh position={[-0.2, 0.5, 0]}>
             <boxGeometry args={[0.25, 1, 0.25]} />
             <meshStandardMaterial color="#1a1a1a" />
        </mesh>
         <mesh position={[0.2, 0.5, 0]}>
             <boxGeometry args={[0.25, 1, 0.25]} />
             <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.5, 0]}>
             <boxGeometry args={[0.7, 1, 0.4]} />
             <meshStandardMaterial color="#D32F2F" />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 1.05, 0]}>
             <boxGeometry args={[0.72, 0.15, 0.42]} />
             <meshStandardMaterial color="gold" metalness={0.8} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 2.3, 0]}>
             <boxGeometry args={[0.5, 0.6, 0.5]} />
             <meshStandardMaterial color="#f0d5a0" />
        </mesh>
        {/* Hat */}
         <mesh position={[0, 2.8, 0]}>
             <cylinderGeometry args={[0.35, 0.35, 0.7]} />
             <meshStandardMaterial color="black" />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.45, 1.6, 0]} rotation={[0,0,0.1]}>
             <boxGeometry args={[0.2, 0.8, 0.2]} />
             <meshStandardMaterial color="#D32F2F" />
        </mesh>
        <mesh position={[0.45, 1.6, 0]} rotation={[0,0,-0.1]}>
             <boxGeometry args={[0.2, 0.8, 0.2]} />
             <meshStandardMaterial color="#D32F2F" />
        </mesh>
    </group>
);

export const GroundDecorations = ({ state }: BaseProps) => {
    // 1. Gifts
    const giftCount = 12;
    const gifts = useMemo(() => {
        return new Array(giftCount).fill(0).map((_, i) => {
            const angle = (i / giftCount) * Math.PI * 2 + (Math.random() * 0.5);
            const radius = 6 + Math.random() * 4; // Near tree base
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const scale = 1 + Math.random() * 1.5;
            const color = CONFIG.colors.giftColors[Math.floor(Math.random() * CONFIG.colors.giftColors.length)];
            
            return {
                targetPos: new THREE.Vector3(x, scale/2 - CONFIG.tree.height/2, z), // Ground level (relative to group)
                chaosPos: new THREE.Vector3((Math.random()-0.5)*80, (Math.random()-0.5)*80, (Math.random()-0.5)*80),
                currentPos: new THREE.Vector3((Math.random()-0.5)*80, (Math.random()-0.5)*80, (Math.random()-0.5)*80),
                scale: new THREE.Vector3(scale, scale, scale),
                color,
                rotation: new THREE.Euler(0, Math.random() * Math.PI, 0)
            };
        });
    }, []);

    // 2. Dolls
    const dolls = useMemo(() => [
        { 
            type: 'snowman', 
            targetPos: new THREE.Vector3(5, -CONFIG.tree.height/2, 5), 
            chaosPos: new THREE.Vector3(30, 40, 30),
            currentPos: new THREE.Vector3(30, 40, 30),
            scale: 1.5,
            rotationY: -Math.PI / 4
        },
        { 
            type: 'soldier', 
            targetPos: new THREE.Vector3(-5, -CONFIG.tree.height/2, 5), 
            chaosPos: new THREE.Vector3(-30, 40, 30),
            currentPos: new THREE.Vector3(-30, 40, 30),
            scale: 1.5,
            rotationY: Math.PI / 4
        }
    ], []);

    const giftGroupRef = useRef<THREE.Group>(null);
    const dollGroupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        const isFormed = state === 'FORMED';

        // Animate Gifts
        if (giftGroupRef.current) {
            giftGroupRef.current.children.forEach((mesh, i) => {
                const item = gifts[i];
                const target = isFormed ? item.targetPos : item.chaosPos;
                item.currentPos.lerp(target, delta * 2);
                mesh.position.copy(item.currentPos);
                
                if (!isFormed) {
                    mesh.rotation.x += delta;
                    mesh.rotation.y += delta;
                } else {
                    // Reset to initial random rotation when formed
                    // Since we don't store ref to initial rotation in frame loop easily without mutation, 
                    // we just stop spinning.
                }
            });
        }

        // Animate Dolls
        if (dollGroupRef.current) {
            dollGroupRef.current.children.forEach((group, i) => {
                const doll = dolls[i];
                const target = isFormed ? doll.targetPos : doll.chaosPos;
                doll.currentPos.lerp(target, delta * 1.5);
                group.position.copy(doll.currentPos);
                
                if (!isFormed) {
                    group.rotation.y += delta;
                    group.rotation.z += delta * 0.5;
                } else {
                    // Smoothly rotate back to standing
                    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0, delta * 3);
                    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, doll.rotationY, delta * 3);
                    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, delta * 3);
                }
            });
        }
    });

    return (
        <group>
            <group ref={giftGroupRef}>
                {gifts.map((item, i) => (
                    <mesh key={`gift-${i}`} scale={item.scale} rotation={item.rotation}>
                        <boxGeometry />
                        <meshStandardMaterial color={item.color} roughness={0.3} />
                    </mesh>
                ))}
            </group>
            <group ref={dollGroupRef}>
                {dolls.map((doll, i) => (
                    <group key={`doll-${i}`} scale={[doll.scale, doll.scale, doll.scale]}>
                        {doll.type === 'snowman' ? <Snowman /> : <Soldier />}
                    </group>
                ))}
            </group>
        </group>
    );
};
