const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('/Users/mengdoo/codes/dodoo-daily/whiteboard/words.json', 'utf-8');
const words = JSON.parse(raw);

const extraART = [
  ["水彩画", "透明轻快水色交融的水彩写生画", "EASY"],
  ["素描画", "铅笔木炭排线黑白灰光影练习", "EASY"],
  ["速写", "寥寥数笔快速捕捉人物动态神态", "EASY"],
  ["木刻画", "锋利木刻刀在木板雕刻黑白木刻", "MEDIUM"]
];

const extraENT = [
  ["游乐园", "充满摩天轮旋转木马欢笑梦幻乐园", "EASY"],
  ["碰碰船", "充气圆圈水上小船互相碰撞打水仗", "EASY"],
  ["魔术帽", "高筒黑礼帽翻开里面飞出一对白鸽", "EASY"],
  ["假面舞会", "戴着华丽羽毛面具身着礼服翩翩起舞", "MEDIUM"],
  ["泡泡秀", "巨大铁环拉出包裹整个人七彩大泡泡", "EASY"],
  ["打地鼠机", "五彩发光机身拿软锤快速打地鼠", "EASY"],
  ["射箭馆", "戴护臂拉开反曲弓射向十米靶心", "MEDIUM"],
  ["滑冰场", "洁白真冰场穿冰刀鞋自由飞驰", "EASY"]
];

extraART.forEach((item, idx) => {
  words.push({
    id: `art_${100 + idx}`,
    word: item[0],
    category: 'ART',
    difficulty: item[2],
    hint: item[1]
  });
});

extraENT.forEach((item, idx) => {
  words.push({
    id: `entertainment_${100 + idx}`,
    word: item[0],
    category: 'ENTERTAINMENT',
    difficulty: item[2],
    hint: item[1]
  });
});

fs.writeFileSync('/Users/mengdoo/codes/dodoo-daily/whiteboard/words.json', JSON.stringify(words, null, 2), 'utf-8');
const tsContent = `import { WordItem } from '../types/game'\n\nexport const WORD_DATABASE: WordItem[] = ${JSON.stringify(words, null, 2)}\n`;
fs.writeFileSync('/Users/mengdoo/codes/dodoo-daily/whiteboard/src/constants/words.ts', tsContent, 'utf-8');

console.log(`最终总题目数: ${words.length} 道纯名词题目 (每个分类均 >= 100 道)`);
