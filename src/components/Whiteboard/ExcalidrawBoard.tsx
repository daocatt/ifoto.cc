import React, { useEffect, useRef, useCallback } from 'react'
import { Excalidraw, Footer } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

interface ExcalidrawBoardProps {
  isDrawer?: boolean
  onApiReady?: (api: ExcalidrawImperativeAPI) => void
  onChange?: (elements: readonly any[], appState: any) => void
}

export const ExcalidrawBoard: React.FC<ExcalidrawBoardProps> = React.memo(
  ({ isDrawer = true, onApiReady, onChange }) => {
    const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
    const onChangeRef = useRef(onChange)
    const onApiReadyRef = useRef(onApiReady)
    useEffect(() => { onChangeRef.current = onChange }, [onChange])
    useEffect(() => { onApiReadyRef.current = onApiReady }, [onApiReady])

    // 当画师角色切换时，动态切换 Excalidraw 视口/编辑模式
    useEffect(() => {
      if (apiRef.current) {
        apiRef.current.updateScene({
          appState: {
            viewModeEnabled: !isDrawer,
            activeTool: isDrawer ? ({
              type: 'freedraw',
              customType: null,
              locked: true,
              lastActiveTool: null
            } as any) : undefined
          }
        })
      }
    }, [isDrawer])

    const stableOnChange = useCallback((elements: readonly any[], appState: any) => {
      onChangeRef.current?.(elements, appState)
    }, [])

    const stableOnApiReady = useCallback((api: ExcalidrawImperativeAPI) => {
      apiRef.current = api
      onApiReadyRef.current?.(api)
    }, [])

    return (
      <div className="w-full h-full relative overflow-hidden bg-paper excalidraw-custom-wrapper">
        <Excalidraw
          excalidrawAPI={stableOnApiReady}
          onChange={stableOnChange}
          viewModeEnabled={!isDrawer}
          zenModeEnabled={false}
          initialData={{
            appState: {
              viewBackgroundColor: '#fdf8f6',
              currentItemStrokeColor: '#1B1813',
              currentItemBackgroundColor: 'transparent',
              currentItemStrokeWidth: 2,
              // 默认激活自由画笔工具并锁定，进入即画无需手动点画笔
              activeTool: {
                type: 'freedraw',
                customType: null,
                locked: true,
                lastActiveTool: null
              } as any
            }
          }}
          UIOptions={{
            canvasActions: {
              toggleTheme: false,
              changeViewBackgroundColor: false,
              clearCanvas: false, // 由游戏 HUD 专属清画板控制
              loadScene: false,
              saveToActiveFile: false,
              export: false,
              saveAsImage: false
            },
            tools: {
              image: false
            }
          }}
        >
          {/* 自定义 Footer（替换自带的右下角帮助按钮） */}
          <Footer>
            <div />
          </Footer>
        </Excalidraw>

        {/* 隐藏外部素材库、手抓工具、帮助图标、图片上传、AI 生成等无关项 */}
        <style>{`
          /* 移动端优化：顶部工具栏紧凑排布，避免与左右浮岛重叠 */
          @media (max-width: 768px) {
            .excalidraw .App-toolbar-content {
              padding: 2px !important;
              gap: 2px !important;
            }
            .excalidraw .App-toolbar {
              top: 48px !important;
            }
          }
          .excalidraw-custom-wrapper .ToolIcon_type_diamond,
          .excalidraw-custom-wrapper .ToolIcon_type_image,
          .excalidraw-custom-wrapper .ToolIcon_type_frame,
          .excalidraw-custom-wrapper .ToolIcon_type_embeddable,
          .excalidraw-custom-wrapper .ToolIcon_type_library,
          .excalidraw-custom-wrapper .ToolIcon_type_hand,
          .excalidraw-custom-wrapper .ToolIcon_type_magic,
          .excalidraw-custom-wrapper .sidebar-trigger,
          .excalidraw-custom-wrapper .help-icon,
          .excalidraw-custom-wrapper [data-testid="help-icon"],
          .excalidraw-custom-wrapper [aria-label*="Help"],
          .excalidraw-custom-wrapper [aria-label*="帮助"],
          .excalidraw-custom-wrapper [aria-label*="Library"],
          .excalidraw-custom-wrapper [aria-label*="Hand"],
          .excalidraw-custom-wrapper [aria-label*="Image"],
          .excalidraw-custom-wrapper [aria-label*="图片"],
          .excalidraw-custom-wrapper [aria-label*="Generate"],
          .excalidraw-custom-wrapper [aria-label*="Text to diagram"],
          .excalidraw-custom-wrapper [aria-label*="Mermaid"],
          .excalidraw-custom-wrapper [data-testid*="toolbar-image"],
          .excalidraw-custom-wrapper [data-testid*="toolbar-magic"],
          .excalidraw-custom-wrapper [data-testid*="extra-tools"],
          .excalidraw-custom-wrapper [data-testid*="magic"],
          .excalidraw-custom-wrapper [data-testid*="library-button"] {
            display: none !important;
          }
          /* 下拉菜单中严格只展示暗黑模式与背景色选择 */
          .excalidraw .dropdown-menu .dropdown-menu-item:not([data-testid*="theme"]):not([data-testid*="background"]):not([data-testid*="canvas-background"]):not([aria-label*="theme"]):not([aria-label*="Theme"]):not([aria-label*="background"]):not([aria-label*="Background"]):not(.color-picker__container *):not(.color-picker *),
          .excalidraw .dropdown-menu-item[data-testid*="help"],
          .excalidraw .dropdown-menu-item[data-testid*="discord"],
          .excalidraw .dropdown-menu-item[data-testid*="github"],
          .excalidraw .dropdown-menu-item[data-testid*="export"],
          .excalidraw .dropdown-menu-item[data-testid*="load"],
          .excalidraw .dropdown-menu-item[data-testid*="save"],
          .excalidraw .dropdown-menu-item[data-testid*="clear"],
          .excalidraw .dropdown-menu-item[data-testid*="collab"] {
            display: none !important;
          }
          /* 隐藏左侧画板工具箱底部的 Actions 区域（复制、删除、链接） */
          .excalidraw .App-menu__left .actions,
          .excalidraw .App-menu__left .buttonList,
          .excalidraw .App-menu__left [aria-label*="Duplicate"],
          .excalidraw .App-menu__left [aria-label*="复制"],
          .excalidraw .App-menu__left [aria-label*="Delete"],
          .excalidraw .App-menu__left [aria-label*="删除"],
          .excalidraw .App-menu__left [aria-label*="Link"],
          .excalidraw .App-menu__left [aria-label*="链接"],
          .excalidraw .App-menu__left [data-testid="trash"],
          .excalidraw .App-menu__left [data-testid="duplicate-button"],
          .excalidraw .App-menu__left [data-testid="link-button"] {
            display: none !important;
          }
        `}</style>
      </div>
    )
  },
  // 只在 isDrawer 角色切换时重新渲染（画师 <-> 观众）
  (prev, next) => prev.isDrawer === next.isDrawer
)
