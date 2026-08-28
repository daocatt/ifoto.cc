const fs = require('fs');

const raw = fs.readFileSync('/Users/mengdoo/codes/dodoo-daily/whiteboard/words.json', 'utf-8');

const header = `import { WordItem } from '../types/game'

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: '全部',
  ANIMALS: '动物',
  FOOD: '美食',
  OBJECTS: '用品',
  ACTIONS: '动作',
  K12_SCIENCE: '科学',
  K12_GEO: '地理',
  ENGLISH: '英文',
  MUSIC: '音乐',
  CARTOON: '动画',
  ART: '绘画',
  ENTERTAINMENT: '娱乐'
}

export const WORD_DATABASE: WordItem[] = (${raw}) as WordItem[]
`;

fs.writeFileSync('/Users/mengdoo/codes/dodoo-daily/whiteboard/src/constants/words.ts', header, 'utf-8');
console.log('✅ words.ts updated with type assertion');
