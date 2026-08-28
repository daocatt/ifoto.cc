const fs = require('fs');
const path = require('path');

// 24 个精心策划的体素/像素化人设 seed（男女老幼、发型、表情各异）
const AVATAR_PRESETS = [
  { id: 'voxel_01', name: '酷炫少年', gender: 'male', desc: '鸭舌帽 · 阳光笑意' },
  { id: 'voxel_02', name: '元气少女', gender: 'female', desc: '双马尾 · 灵动眨眼' },
  { id: 'voxel_03', name: '极客青年', gender: 'male', desc: '黑框眼镜 · 专注神情' },
  { id: 'voxel_04', name: '干练白领', gender: 'female', desc: '齐肩短发 · 优雅微笑' },
  { id: 'voxel_05', name: '滑板达人', gender: 'male', desc: '针织冷帽 · 酷帅表情' },
  { id: 'voxel_06', name: '甜心萝莉', gender: 'female', desc: '丸子头 · 甜美大笑' },
  { id: 'voxel_07', name: '智慧长者', gender: 'male', desc: '银白胡须 · 和蔼亲切' },
  { id: 'voxel_08', name: '慈祥奶奶', gender: 'female', desc: '卷发盘头 · 温暖笑颜' },
  { id: 'voxel_09', name: '热血拳手', gender: 'male', desc: '红发头带 · 自信坚定' },
  { id: 'voxel_10', name: '文艺画师', gender: 'female', desc: '贝雷帽 · 文艺沉静' },
  { id: 'voxel_11', name: '朋克乐手', gender: 'male', desc: '莫西干发 · 摇滚墨镜' },
  { id: 'voxel_12', name: '科技博士', gender: 'female', desc: '圆框眼镜 · 睿智眼神' },
  { id: 'voxel_13', name: '街舞小哥', gender: 'male', desc: '反戴棒球帽 · 调皮吐舌' },
  { id: 'voxel_14', name: '清新学妹', gender: 'female', desc: '空气刘海 · 纯真微笑' },
  { id: 'voxel_15', name: '商务精英', gender: 'male', desc: '背头造型 · 成熟稳重' },
  { id: 'voxel_16', name: '时尚博主', gender: 'female', desc: '波浪长发 · 潮流墨镜' },
  { id: 'voxel_17', name: '大厨师傅', gender: 'male', desc: '高耸厨师帽 · 憨厚开朗' },
  { id: 'voxel_18', name: '电竞少女', gender: 'female', desc: '猫耳耳机 · 俏皮眨眼' },
  { id: 'voxel_19', name: '宇航极客', gender: 'male', desc: '宇航护目 · 探索深空' },
  { id: 'voxel_20', name: '自然旅人', gender: 'female', desc: '草帽花饰 · 怡然自得' },
  { id: 'voxel_21', name: '功夫大师', gender: 'male', desc: '白眉长髯 · 仙风道骨' },
  { id: 'voxel_22', name: '魔法学徒', gender: 'female', desc: '紫发兜帽 · 灵气神秘' },
  { id: 'voxel_23', name: '运动健将', gender: 'male', desc: '运动发带 · 活力四射' },
  { id: 'voxel_24', name: '星际探索', gender: 'female', desc: '银白短发 · 科幻霓虹' }
];

async function generate() {
  const { createAvatar } = await import('@dicebear/core');
  // 采用 pixelArt 样式，生成原汁原味的体素像素网格矢量艺术
  const { pixelArt } = await import('@dicebear/collection');

  const avatarMap = {};
  
  for (const preset of AVATAR_PRESETS) {
    const avatar = createAvatar(pixelArt, {
      seed: preset.id + '_' + preset.name,
      size: 128
    });
    const svgStr = avatar.toString();
    avatarMap[preset.id] = {
      id: preset.id,
      name: preset.name,
      gender: preset.gender,
      desc: preset.desc,
      svg: svgStr
    };
  }

  const fileContent = `// 纯本地离线 24 款 DiceBear Voxel/Pixel Art 头像数据
export interface VoxelAvatarInfo {
  id: string
  name: string
  gender: 'male' | 'female'
  desc: string
  svg: string
}

export const VOXEL_AVATARS: Record<string, VoxelAvatarInfo> = ${JSON.stringify(avatarMap, null, 2)}

export const VOXEL_AVATAR_LIST: VoxelAvatarInfo[] = Object.values(VOXEL_AVATARS)
`;

  fs.writeFileSync(path.join(__dirname, 'src/constants/voxelAvatars.ts'), fileContent, 'utf-8');
  console.log(`✅ 24 款离线体素头像已成功生成并写入 src/constants/voxelAvatars.ts`);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
