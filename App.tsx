
import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from './constants';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import { SceneState } from './types';

// --- App Entry ---
export default function App() {
  const [sceneState, setSceneState] = useState<SceneState>('FORMED'); // Initial state FORMED as requested
  const [rotationSpeed, setRotationSpeed] = useState(0);
  const [aiStatus, setAiStatus] = useState("正在唤醒圣诞魔法... ✨");
  const [debugMode, setDebugMode] = useState(false);
  const [zoomed, setZoomed] = useState(false); // UI state (is currently zoomed?)
  const [gestureZoomRequest, setGestureZoomRequest] = useState(false); // Input state (user wants to zoom?)

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Canvas dpr={[1, 2]} gl={{ toneMapping: THREE.ReinhardToneMapping }} shadows>
          <Suspense fallback={null}>
            <Experience 
              state={sceneState} 
              rotationSpeed={rotationSpeed} 
              setZoomed={setZoomed}
              zoomRequest={gestureZoomRequest}
            />
          </Suspense>
        </Canvas>
        <Loader 
          dataInterpolation={(p) => `Loading ${p.toFixed(0)}%`} 
          containerStyles={{ background: '#111111' }} 
          innerStyles={{ width: '200px', height: '10px', background: '#333' }}
          barStyles={{ height: '10px', background: '#FFD700' }}
          dataStyles={{ color: '#FFD700', fontSize: '12px', fontFamily: 'monospace', marginTop: '10px' }}
        />
      </div>
      <GestureController 
        onGesture={setSceneState} 
        onMove={setRotationSpeed} 
        onStatus={setAiStatus} 
        onZoomRequest={setGestureZoomRequest}
        debugMode={debugMode} 
      />

      {/* UI - Stats */}
      <div className={`absolute bottom-8 left-10 text-gray-400 z-10 font-sans select-none transition-opacity duration-500 ${zoomed ? 'opacity-0' : 'opacity-100'}`}>
        <div className="mb-4">
          <p className="text-[10px] tracking-widest uppercase mb-1">美好回忆 📸</p>
          <p className="text-2xl text-yellow-400 font-bold m-0">
            {CONFIG.counts.ornaments.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">张拍立得 🖼️</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase mb-1">繁茂枝叶 🌲</p>
          <p className="text-2xl text-emerald-800 font-bold m-0">
            {(CONFIG.counts.foliage / 1000).toFixed(0)}K <span className="text-[10px] text-gray-500 font-normal">片翠绿松针 🍃</span>
          </p>
        </div>
      </div>

      {/* UI - Buttons */}
      <div className={`absolute bottom-8 right-10 z-10 flex gap-2.5 transition-opacity duration-500 ${zoomed ? 'opacity-0' : 'opacity-100'}`}>
        <button 
          onClick={() => setDebugMode(!debugMode)} 
          className={`px-4 py-3 border text-xs font-bold cursor-pointer backdrop-blur-sm transition-colors ${
            debugMode 
              ? 'bg-yellow-400 text-black border-yellow-400' 
              : 'bg-black/50 text-yellow-400 border-yellow-400'
          }`}
        >
           {debugMode ? '隐藏调试 🚫' : '🛠 调试模式'}
        </button>
        <button 
          onClick={() => setSceneState(s => s === 'CHAOS' ? 'FORMED' : 'CHAOS')} 
          className="px-8 py-3 bg-black/50 border border-yellow-400/50 text-yellow-400 font-serif text-sm font-bold tracking-widest uppercase cursor-pointer backdrop-blur-sm hover:bg-black/70 transition-colors"
        >
           {sceneState === 'CHAOS' ? '🎄 聚合成树' : '❄️ 飘散纷飞'}
        </button>
      </div>

      {/* UI - AI Status */}
      <div 
        className={`absolute top-5 left-1/2 -translate-x-1/2 text-[10px] tracking-widest z-10 bg-black/50 px-2 py-1 rounded ${
          aiStatus.includes('错误') || aiStatus.includes('ERROR') ? 'text-red-600' : 'text-yellow-400/40'
        }`}
      >
        {aiStatus}
      </div>
    </div>
  );
}
