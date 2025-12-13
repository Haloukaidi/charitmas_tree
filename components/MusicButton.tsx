
import { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG } from '../constants';

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
      <SnowflakeBranch key={angle} rotation={[0, 0, MathUtils.degToRad(angle)] as [number, number, number]} />
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
  
  const tracks = CONFIG.music.tracks;

  // 如果没有音乐文件，直接不渲染组件
  if (!tracks || tracks.length === 0) {
      return null;
  }

  // 随机选择下一首歌的索引
  const pickRandomTrackIndex = () => {
    return Math.floor(Math.random() * tracks.length);
  };

  useEffect(() => {
    // 初始化 Audio 对象
    const audio = new Audio();
    audio.volume = 0.6;
    audioRef.current = audio;

    const playNext = () => {
        const nextIndex = pickRandomTrackIndex();
        audio.src = tracks[nextIndex];
        const promise = audio.play();
        if (promise !== undefined) {
             promise.catch(e => {
                 console.warn("Auto-play next track failed:", e);
                 setPlaying(false);
             });
        }
    };

    const handleError = (e: Event) => {
        console.warn("Audio source error:", audio.src);
        setPlaying(false);
    };

    // 监听播放结束事件，实现随机循环
    audio.addEventListener('ended', playNext);
    audio.addEventListener('error', handleError);
    
    // 初始化第一首（但不自动播放，等待用户点击）
    try {
        audio.src = tracks[pickRandomTrackIndex()];
    } catch (e) {
        console.warn("Failed to set audio src", e);
    }

    return () => {
      audio.pause();
      audio.removeEventListener('ended', playNext);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [tracks]);

  const toggleMusic = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // 如果当前没有源或者刚刚初始化，可能需要确保 src 存在
      if (!audioRef.current.src) {
         audioRef.current.src = tracks[pickRandomTrackIndex()];
      }
      
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise.then(() => {
            setPlaying(true);
        }).catch(err => {
            console.warn("Audio playback failed (likely missing file):", err);
            setPlaying(false);
            // 这里不抛出错误，而是静默失败，避免控制台红字报错干扰体验
        });
      }
    }
  };

  // --- Positioning Logic ---
  const dist = 10;
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
