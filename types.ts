
export type SceneState = 'CHAOS' | 'FORMED';

export interface BaseProps {
  state: SceneState;
  setZoomed?: (zoomed: boolean) => void;
}

export interface GestureControllerProps {
  onGesture: (state: SceneState) => void;
  onMove: (speed: number) => void;
  onStatus: (status: string) => void;
  debugMode: boolean;
}
