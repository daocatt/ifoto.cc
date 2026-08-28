import { WordItem } from '../types/game'
import wordsDataZh from '../../words.json'
import wordsDataEn from '../../words_en.json'

// 纯 2 个字的标准主题分类名称
export const CATEGORY_LABELS: Record<string, string> = {
  ALL: '全部',
  ANIMALS: '动物',
  FOOD: '食物',
  OBJECTS: '用品',
  ACTIONS: '动作',
  K12_SCIENCE: '科学',
  K12_GEO: '地理',
  ENGLISH: '英文',
  MUSIC: '音乐',
  CARTOON: '动画',
  ART: '绘画',
  ENTERTAINMENT: '影视'
}

// 中文大题库（用于“你画我猜”房间）
export const WORD_DATABASE: WordItem[] = wordsDataZh as unknown as WordItem[]

// 英文专属题库（用于“英语猜猜看”房间）
export const WORD_DATABASE_EN: WordItem[] = wordsDataEn as unknown as WordItem[]
