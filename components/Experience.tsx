
import { useRef, Suspense, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  Stars,
  Sparkles
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
import { CONFIG } from '../constants';
import Foliage from './Foliage';
import PhotoOrnaments from './Ornaments';
import { ChristmasElements, FairyLights, GroundDecorations } from './Decorations';
import TopStar from './TopStar';
import MusicButton from './MusicButton';
import { BaseProps } from '../types';

interface ExperienceProps extends BaseProps {
  rotationSpeed: number;
}

// --- Main Scene Experience ---
const Experience = ({ state, rotationSpeed, setZoomed }: ExperienceProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  // Track local zoomed state to animate DepthOfField
  const [isZoomedLocal, setIsZoomedLocal] = useState(false);

  // Intercept the setZoomed from children to update local state for effects
  const handleSetZoomed = (z: boolean) => {
    setIsZoomedLocal(z);
    if (setZoomed) setZoomed(z);
  };

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + rotationSpeed);
      controlsRef.current.update();
      // Disable controls when zooming to prevent fighting
      controlsRef.current.enabled = !isZoomedLocal;
    }
  });

  return (
    <>
      {/* Camera Group acts as a container for HUD elements */}
      <PerspectiveCamera makeDefault position={[0, 8, 60]} fov={45}>
        <MusicButton />
      </PerspectiveCamera>
      
      <OrbitControls 
        ref={controlsRef} 
        enablePan={false} 
        enableZoom={!isZoomedLocal} 
        minDistance={30} 
        maxDistance={120} 
        autoRotate={rotationSpeed === 0 && state === 'FORMED'} 
        autoRotateSpeed={0.3} 
        maxPolarAngle={Math.PI / 1.7} 
      />

      <color attach="background" args={['#000300']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Environment preset="night" background={false} />

      <ambientLight intensity={0.4} color="#003311" />
      <pointLight position={[30, 30, 30]} intensity={100} color={CONFIG.colors.warmLight} />
      <pointLight position={[-30, 10, -30]} intensity={50} color={CONFIG.colors.gold} />
      <pointLight position={[0, -20, 10]} intensity={30} color="#ffffff" />

      <group position={[0, -6, 0]}>
        <Foliage state={state} />
        <Suspense fallback={null}>
           {/* Pass rotationSpeed to handle selection logic */}
           <PhotoOrnaments state={state} rotationSpeed={rotationSpeed} setZoomed={handleSetZoomed} />
           <ChristmasElements state={state} />
           <FairyLights state={state} />
           <TopStar state={state} />
           <GroundDecorations state={state} />
        </Suspense>
        <Sparkles count={600} scale={50} size={8} speed={0.4} opacity={0.4} color={CONFIG.colors.silver} />
      </group>

      <EffectComposer>
        <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.1} intensity={1.5} radius={0.5} mipmapBlur />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
        {/* DepthOfField acts as the Frosted Glass effect */}
        <DepthOfField 
            target={[0, 0, 10]} // Focus distance
            focalLength={isZoomedLocal ? 0.08 : 0.0} // High focal length = shallow depth of field (more blur)
            bokehScale={isZoomedLocal ? 10 : 0} // Blur intensity
            height={480} 
        />
      </EffectComposer>
    </>
  );
};

export default Experience;
