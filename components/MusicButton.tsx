import { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';

// ⚠️ NOTE: Replace this URL with your local file path (e.g., "/music/Merry_Christmas_Mr_Lawrence.mp3")
// We use a reliable Google-hosted Jingle Bells OGG as a placeholder to prevent "no supported sources" errors.
const MUSIC_URL = "https://actions.google.com/sounds/v1/holidays/jingle_bells.ogg";

// --- Ice Material Reusable Instance ---
const iceMaterial = new THREE.MeshPhysicalMaterial({
  color: "#E0F7FA",       // Icy pale blue
  emissive: "#80DEEA",    // Cyan glow
  emissiveIntensity: 0.5,
  metalness: 0.1,
  roughness: 0.1,
  transmission: 0.9,      // Glass-like transparency
  thickness: 2.5,         // Refraction thickness
  ior: 1.5,               // Index of Refraction (Ice/Glass)
  side: THREE.DoubleSide,
});

const SnowflakeBranch = ({ rotation }: { rotation: [number, number, number] }) => {
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  
  return (
    <group rotation={rotation}>
      {/* Main Stem */}
      <mesh geometry={boxGeo} scale={[0.15, 4.5, 0.15]} position={[0, 2.25, 0]} material={iceMaterial} />
      
      {/* Lower V-Shape */}
      <group position={[0, 1.5, 0]}>
        <mesh geometry={boxGeo} scale={[0.1, 1.5, 0.1]} position={[0.5, 0.5, 0]} rotation={[0, 0, -0.8]} material={iceMaterial} />
        <mesh geometry={boxGeo} scale={[0.1, 1.5, 0.1]} position={[-0.5, 0.5, 0]} rotation={[0, 0, 0.8]} material={iceMaterial} />
      </group>

      {/* Upper V-Shape */}
      <group position={[0, 3.0, 0]}>
        <mesh geometry={boxGeo} scale={[0.1, 1.2, 0.1]} position={[0.4, 0.4, 0]} rotation={[0, 0, -0.8]} material={iceMaterial} />
        <mesh geometry={boxGeo} scale={[0.1, 1.2, 0.1]} position={[-0.4, 0.4, 0]} rotation={[0, 0, 0.8]} material={iceMaterial} />
      </group>
    </group>
  );
};

const IceSnowflake = ({ playing }: { playing: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create 6 branches
  const branches = useMemo(() => {
    return [0, 60, 120, 180, 240, 300].map((angle) => (
      <SnowflakeBranch key={angle} rotation={[0, 0, MathUtils.degToRad(angle)]} />
    ));
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // 1. Standing Rotation (Y-axis)
      // Spin faster when playing
      const rotSpeed = playing ? 2.0 : 0.5;
      groupRef.current.rotation.y += delta * rotSpeed;

      // 2. Breathing Light Effect
      // Sine wave based on time
      const time = state.clock.elapsedTime;
      const breatheSpeed = playing ? 4.0 : 1.5; // Fast breathe when playing
      const minIntensity = 0.5;
      const maxIntensity = 3.0;
      
      const intensity = minIntensity + (Math.sin(time * breatheSpeed) + 1) * 0.5 * (maxIntensity - minIntensity);
      
      // Update global material uniform-like property (careful, this affects all instances if we modified the shared mat directly)
      // Since we shared the material, modifying it here affects all parts of the snowflake perfectly
      iceMaterial.emissiveIntensity = intensity;

      // 3. Subtle Scale Pulse
      const scale = 1 + Math.sin(time * breatheSpeed) * 0.05;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Hexagon Hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={iceMaterial}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 6]} />
      </mesh>
      {/* Branches */}
      {branches}
      {/* Center Gem (Diamond shape) */}
      <mesh material={iceMaterial} rotation={[0, Math.PI/4, 0]} scale={[0.5, 0.5, 0.5]}>
         <octahedronGeometry />
      </mesh>
    </group>
  );
};

const MusicButton = () => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const buttonGroupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;
    
    // Handle loading errors just in case
    audioRef.current.onerror = () => {
        console.warn("Audio failed to load. Please check the URL or your network.");
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
          console.error("Audio playback failed:", err);
      });
    }
    setPlaying(!playing);
  };

  // --- Positioning Logic ---
  // We place this in the HUD (Camera Group).
  // We want it top-right.
  const dist = 10;
  // Calculate visible width/height at that distance for the camera
  // fov = 45 default
  const vHeight = 2 * Math.tan(MathUtils.degToRad(45) / 2) * dist;
  const vWidth = vHeight * viewport.aspect;

  // Position: Top Right with padding
  const x = vWidth / 2 - 1.2;
  const y = vHeight / 2 - 1.2;

  return (
    <group position={[x, y, -dist]}>
      {/* Point light to enhance the ice sparkle locally */}
      <pointLight 
        color="#E0FFFF" 
        intensity={playing ? 20 : 5} 
        distance={5} 
        decay={2} 
      />
      
      <group 
        ref={buttonGroupRef}
        onPointerDown={toggleMusic}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
        rotation={[Math.PI / 6, 0, 0]} 
        scale={0.4}
      >
        <IceSnowflake playing={playing} />
        
        {/* HIT SPHERE: Invisible large sphere to make clicking easier */}
        <mesh visible={false}>
            <sphereGeometry args={[3.0, 16, 16]} />
            <meshBasicMaterial />
        </mesh>
      </group>
    </group>
  );
};

export default MusicButton;