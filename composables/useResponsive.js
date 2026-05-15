// composables/useResponsive.js
import { ref, computed, onUnmounted } from 'vue'

export function getViewportInfo() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    
    return {
      width: systemInfo.windowWidth,
      height: systemInfo.windowHeight,
      safeAreaTop: systemInfo.statusBarHeight || 44,
      safeAreaBottom: systemInfo.safeAreaInsets?.bottom || 0,
      pixelRatio: systemInfo.pixelRatio || 2,
      orientation: systemInfo.windowWidth > systemInfo.windowHeight ? 'landscape' : 'portrait'
    }
  } catch (error) {
    console.error('获取视口信息失败:', error)
    return {
      width: 375,
      height: 667,
      safeAreaTop: 44,
      safeAreaBottom: 0,
      pixelRatio: 2,
      orientation: 'portrait'
    }
  }
}

export function calculateResponsiveConfig(viewport) {
  if (!viewport) {
    viewport = getViewportInfo()
  }
  
  const isLandscape = viewport.orientation === 'landscape'
  
  // 画布大小：竖屏占宽度90%，横屏占高度80%
  let canvasSize
  if (isLandscape) {
    const availableHeight = viewport.height - viewport.safeAreaTop - viewport.safeAreaBottom
    canvasSize = Math.min(availableHeight * 0.8, viewport.width * 0.6)
  } else {
    canvasSize = viewport.width * 0.9
  }
  
  // 居中显示
  const offsetX = (viewport.width - canvasSize) / 2
  const offsetY = (viewport.height - canvasSize) / 2
  
  return {
    canvasSize: Math.round(canvasSize),
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
    isLandscape: isLandscape,
    viewport: viewport
  }
}

export function calculateUIPositions(config) {
  const { viewport } = config
  const baseTop = viewport.safeAreaTop + 10
  
  return {
    bluetoothButton: {
      position: 'fixed',
      top: `${baseTop}px`,
      left: `15px`,
      zIndex: 999
    },
    scoreDisplay: {
      position: 'fixed',
      top: `${baseTop}px`,
      right: `15px`,
      zIndex: 999
    },
    gameInfo: {
      position: 'fixed',
      top: `${baseTop + 80}px`,
      right: `15px`,
      zIndex: 999
    }
  }
}

export function mapTouchToCanvas(screenX, screenY, config) {
  if (!config) {
    return { x: screenX, y: screenY, isInBounds: false }
  }
  
  const { offsetX, offsetY, canvasSize } = config
  
  // 转换为画布坐标系（左上角为原点）
  const canvasX = screenX - offsetX
  const canvasY = screenY - offsetY
  
  // 转换为画布中心坐标系
  const centerX = canvasX - canvasSize / 2
  const centerY = canvasY - canvasSize / 2
  
  const radius = canvasSize / 2
  const distance = Math.sqrt(centerX * centerX + centerY * centerY)
  
  return {
    x: centerX,
    y: centerY,
    canvasX: canvasX,
    canvasY: canvasY,
    distance: distance,
    isInBounds: distance <= radius,
    maxRadius: radius
  }
}

export function useResponsive() {
  const viewport = ref(getViewportInfo())
  const config = ref(calculateResponsiveConfig(viewport.value))
  const uiPositions = ref(calculateUIPositions(config.value))
  
  let resizeTimer = null
  
  const updateResponsiveConfig = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    
    resizeTimer = setTimeout(() => {
      viewport.value = getViewportInfo()
      config.value = calculateResponsiveConfig(viewport.value)
      uiPositions.value = calculateUIPositions(config.value)
    }, 100)
  }
  
  const canvasStyle = computed(() => {
    const cfg = config.value
    return {
      width: `${cfg.canvasSize}px`,
      height: `${cfg.canvasSize}px`,
      position: 'fixed',
      left: `${cfg.offsetX}px`,
      top: `${cfg.offsetY}px`,
      backgroundColor: '#1a1a2e',
      borderRadius: '50%'
    }
  })
  
  const mapTouch = (screenX, screenY) => {
    return mapTouchToCanvas(screenX, screenY, config.value)
  }
  
  onUnmounted(() => {
    if (resizeTimer) clearTimeout(resizeTimer)
  })
  
  return {
    viewport,
    config,
    uiPositions,
    canvasStyle,
    updateResponsiveConfig,
    mapTouch
  }
}