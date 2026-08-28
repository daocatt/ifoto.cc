export interface Player {
  id: string
  name: string
  avatar: string
  score: number
  color?: string
}

export type Category = 
  | 'ANIMALS' 
  | 'FOOD' 
  | 'OBJECTS' 
  | 'ACTIONS' 
  | 'ENTERTAINMENT' 
  | 'K12_SCIENCE' 
  | 'K12_GEO' 
  | 'ENGLISH' 
  | 'MUSIC' 
  | 'CARTOON' 
  | 'ART'

export interface WordItem {
  id: string
  word: string
  category: Category
  hint?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface QuickChatMessage {
  playerId: string
  text: string
  timestamp: number
}

export const PRESET_QUICK_CHATS: string[] = [
  "迫不及待要猜了！🚀",
  "画得太像了！👏",
  "这画的是个啥呀 😂",
  "好像知道答案了！💡",
  "完全看不懂，给点提示呗~ 🤔",
  "画师加油，我看好你！💪",
  "时间快到了搞快点！⏱️",
  "灵魂画手实锤了 🎨",
  "我画得更棒好吗 😎",
  "哈哈哈太逗了 🤣",
  "答对啦！快给我加分 🎉",
  "再来一局！🔥"
]

export interface GameState {
  currentDrawerId: string | null
  currentWord: WordItem | null
  isWordRevealed: boolean
  roundNumber: number
  timeLeft: number
  totalTime: number
  isTimerRunning: boolean
  history: {
    round: number
    word: string
    winnerId: string | null
    timestamp: number
  }[]
}

export type RoomId = 'draw' | 'english' | 'puzzle' | 'music' | 'jump' | (string & {})

export interface RoomConfig {
  id: RoomId
  name: string
  emoji: string
  desc: string
  color: string
}

export const PRESET_ROOMS: RoomConfig[] = [
  {
    id: 'draw',
    name: '你画我猜',
    emoji: '🎨',
    desc: '经典绘画猜词 · 海量中文题库',
    color: '#007A66'
  },
  {
    id: 'english',
    name: '英语猜猜看',
    emoji: '🔤',
    desc: '快乐学英语 · 趣味看图识词',
    color: '#4F46E5'
  }
]

