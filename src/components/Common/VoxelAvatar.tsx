import React from 'react'
import { VOXEL_AVATARS } from '../../constants/voxelAvatars'

interface VoxelAvatarProps {
  avatarKey?: string | null
  size?: number | string
  className?: string
  alt?: string
}

export const VoxelAvatar: React.FC<VoxelAvatarProps> = ({
  avatarKey = 'voxel_01',
  size = 40,
  className = '',
  alt = 'avatar'
}) => {
  const avatarInfo = avatarKey && VOXEL_AVATARS[avatarKey] ? VOXEL_AVATARS[avatarKey] : VOXEL_AVATARS['voxel_01']

  // 如果传入的是历史旧版 Emoji，做优雅降级渲染
  if (avatarKey && !VOXEL_AVATARS[avatarKey] && avatarKey.length <= 4) {
    const sizeStyle = typeof size === 'number' ? { width: size, height: size, fontSize: size * 0.55 } : {}
    return (
      <div
        style={sizeStyle}
        className={`rounded-2xl bg-tint/80 flex items-center justify-center border border-edge shrink-0 select-none shadow-xs ${className}`}
        title={alt}
      >
        <span>{avatarKey}</span>
      </div>
    )
  }

  const dimStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {}

  return (
    <div
      style={dimStyle}
      className={`rounded-2xl overflow-hidden bg-card/80 border border-edge/60 flex items-center justify-center shrink-0 shadow-xs relative select-none ${className}`}
      title={avatarInfo ? `${avatarInfo.name} (${avatarInfo.desc})` : alt}
    >
      <div
        className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: avatarInfo.svg }}
      />
    </div>
  )
}
