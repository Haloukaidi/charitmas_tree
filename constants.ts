
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
    ornaments: 20,    // 设定总挂饰位置数量 (N)
    elements: 500,    // 圣诞元素数量
    lights: 400       // 彩灯数量
  },
  tree: { height: 22, radius: 9 }, // 树体尺寸
  
  // --- 音乐配置 ---
  music: {
    // 请在 public/music/ 文件夹下放入音乐文件，并在此处列出文件名
    // 如果数组为空 []，则不显示音乐按钮
    // 示例: tracks: ['/music/bgm1.mp3']
    tracks: [
       '/photos/1.jpg',
       '/photos/2.jpg',
       '/photos/3.jpg']
  },

  // --- 照片配置 ---
  photos: {
    // 请在 public/photos/ 文件夹下放入照片，并在此处列出文件名
    // 逻辑说明：
    // 1. 如果 files 数量 < counts.ornaments：有多少张显示多少张，其余显示空白相纸。
    // 2. 如果 files 数量 > counts.ornaments：仅显示前 N 张。
    files: [
       '/photos/1.jpg',
       '/photos/2.jpg',
       '/photos/3.jpg',
       '/photos/4.jpg',
       '/photos/5.jpg',
       '/photos/6.jpg',
       '/photos/7.jpg',
       '/photos/8.jpg',
       '/photos/9.jpg',
       '/photos/10.jpg',
       '/photos/11.jpg',
       '/photos/12.jpg',
       '/photos/13.jpg',
       '/photos/14.jpg',
       '/photos/15.jpg'
    ]
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
