
export type SceneState = 'CHAOS' | 'FORMED';

export interface BaseProps {
  state: SceneState;
  setZoomed?: (zoomed: boolean) => void;
  zoomRequest?: boolean; // 新增：是否请求放大
}

export interface GestureControllerProps {
  onGesture: (state: SceneState) => void;
  onMove: (speed: number) => void;
  onStatus: (status: string) => void;
  onZoomRequest: (request: boolean) => void; // 新增：手势缩放回调
  debugMode: boolean;
}
