// --- 视觉配置 ---
export const CONFIG = {
  colors: {
    emerald: '#004225', // 纯正祖母绿
    gold: '#FFD700',
    silver: '#ECEFF1',
    red: '#D32F2F',
    green: '#2E7D32',
    white: '#FFFFFF',   // 纯白色
    warmLight: '#FFD54F',
    lights: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'], // 彩灯
    // 拍立得边框颜色池 (复古柔和色系)
    borders: ['#FFFAF0', '#F0E68C', '#E6E6FA', '#FFB6C1', '#98FB98', '#87CEFA', '#FFDAB9'],
    // 圣诞元素颜色
    giftColors: ['#D32F2F', '#FFD700', '#1976D2', '#2E7D32'],
    candyColors: ['#FF0000', '#FFFFFF']
  },
  counts: {
    foliage: 15000,
    ornaments: 20,   // 拍立得照片数量 (Position points)
    elements: 500,    // 圣诞元素数量
    lights: 400       // 彩灯数量
  },
  tree: { height: 22, radius: 9 }, // 树体尺寸
  photos: {
    // 这里的数量决定了尝试加载多少张不同的图片
    // 请确保 public/photos/ 文件夹下有对应的 1.jpg 到 15.jpg
    body: Array.from({ length: 15 }, (_, i) => `/photos/${i + 1}.jpg`)
  }
};

// --- Helper: Tree Shape ---
export const getTreePosition = () => {
  const h = CONFIG.tree.height; 
  const rBase = CONFIG.tree.radius;
  const y = (Math.random() * h) - (h / 2); 
  const normalizedY = (y + (h/2)) / h;
  const currentRadius = rBase * (1 - normalizedY); 
  const theta = Math.random() * Math.PI * 2;
  const r = Math.random() * currentRadius;
  return [r * Math.cos(theta), y, r * Math.sin(theta)];
};