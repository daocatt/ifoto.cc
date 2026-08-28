import confetti from 'canvas-confetti'

export function triggerCelebration(x = 0.5, y = 0.5) {
  // 高爆发、瞬时快速散开的轻量彩带
  confetti({
    particleCount: 50,
    spread: 60,
    startVelocity: 35, // 提高初始爆发速度，瞬间迸发
    decay: 0.92,       // 稍微加快减速，防止慢悠悠滞空
    gravity: 1.2,      // 增强重力，自然轻快落地
    ticks: 120,        // 缩短总渲染帧数，快速结束回收
    origin: { x, y },
    colors: ['#007A66', '#00967D', '#F2C343', '#FFD868', '#1B7A42', '#ECE9E4'],
    disableForReducedMotion: true,
    zIndex: 9999
  })
}

export function triggerBigWin() {
  const duration = 1.2 * 1000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 50,
      startVelocity: 40,
      gravity: 1.2,
      ticks: 100,
      origin: { x: 0 },
      colors: ['#007A66', '#F2C343', '#1B7A42'],
      zIndex: 9999
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 50,
      startVelocity: 40,
      gravity: 1.2,
      ticks: 100,
      origin: { x: 1 },
      colors: ['#007A66', '#F2C343', '#1B7A42'],
      zIndex: 9999
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()
}

