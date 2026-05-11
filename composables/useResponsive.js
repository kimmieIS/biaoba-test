import { ref, reactive, computed } from 'vue'

/**
 * 响应式布局工具函数
 * 用于处理飞镖盘组件的响应式布局和触摸坐标映射
 */

// 布局策略配置
const layoutStrategies = {
  portrait: {
    canvasSizeRatio: 0.98,     // 画布尽可能占满屏幕宽度
    marginRatio: 0.02,         // 边距缩小
    uiSpacing: 20              // UI元素间距
  },
  landscape: {
    canvasSizeRatio: 0.95,     // 画布尽可能占满屏幕高度
    marginRatio: 0.05,         // 边距缩小
    uiSpacing: 15              // UI元素间距
  }
}

/**
 * 获取视口信息
 * @returns {Object} 视口信息对象
 */
export function getViewportInfo() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    
    const viewport = {
      width: systemInfo.windowWidth || systemInfo.screenWidth,
      height: systemInfo.windowHeight || systemInfo.screenHeight,
      safeAreaTop: systemInfo.safeAreaInsets?.top || systemInfo.statusBarHeight || 0,
      safeAreaBottom: systemInfo.safeAreaInsets?.bottom || 0,
      safeAreaLeft: systemInfo.safeAreaInsets?.left || 0,
      safeAreaRight: systemInfo.safeAreaInsets?.right || 0,
      pixelRatio: systemInfo.pixelRatio || 1,
      orientation: systemInfo.windowWidth > systemInfo.windowHeight ? 'landscape' : 'portrait'
    }
    
    console.log('视口信息:', viewport)
    return viewport
  } catch (error) {
    console.error('获取视口信息失败:', error)
    // 返回安全的默认值
    return {
      width: 375,
      height: 667,
      safeAreaTop: 44,
      safeAreaBottom: 34,
      safeAreaLeft: 0,
      safeAreaRight: 0,
      pixelRatio: 2,
      orientation: 'portrait'
    }
  }
}

/**
 * 计算响应式配置
 * @param {Object} viewport 视口信息
 * @returns {Object} 响应式配置对象
 */
export function calculateResponsiveConfig(viewport) {
  if (!viewport) {
    viewport = getViewportInfo()
  }
  
  const isLandscape = viewport.orientation === 'landscape'
  const strategy = isLandscape ? layoutStrategies.landscape : layoutStrategies.portrait
  
  let canvasSize, offsetX, offsetY, scale
  
  if (isLandscape) {
    // 横屏模式：基于高度计算，为UI元素预留空间
    const availableHeight = viewport.height - viewport.safeAreaTop - viewport.safeAreaBottom
    canvasSize = availableHeight * strategy.canvasSizeRatio
    
    // 水平居中
    offsetX = (viewport.width - canvasSize) / 2
    offsetY = viewport.safeAreaTop + (availableHeight - canvasSize) / 2
    
    scale = canvasSize / viewport.width // 相对于原始设计的缩放比例
  } else {
    // 竖屏模式：基于宽度计算
    canvasSize = viewport.width * strategy.canvasSizeRatio
    
    // 水平居中，垂直考虑安全区域
    offsetX = (viewport.width - canvasSize) / 2
    const availableHeight = viewport.height - viewport.safeAreaTop - viewport.safeAreaBottom
    offsetY = viewport.safeAreaTop + (availableHeight - canvasSize) / 2
    
    scale = 1 // 竖屏保持原始比例
  }
  
  const config = {
    canvasSize: Math.round(canvasSize),
    scale: scale,
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
    isLandscape: isLandscape,
    viewport: viewport,
    strategy: strategy
  }
  
  console.log('响应式配置:', config)
  return config
}

/**
 * 计算UI元素的响应式位置
 * @param {Object} config 响应式配置
 * @returns {Object} UI元素位置配置
 */
export function calculateUIPositions(config) {
  const { viewport, strategy, canvasSize, offsetX, offsetY, isLandscape } = config
  
  const positions = {
    bluetoothButton: {},
    scoreDisplay: {},
    gameInfo: {}
  }
  
  if (isLandscape) {
    // 横屏布局
    positions.bluetoothButton = {
      position: 'fixed',
      top: `${viewport.safeAreaTop + strategy.uiSpacing}px`,
      left: `${strategy.uiSpacing}px`,
      zIndex: 999
    }
    
    positions.scoreDisplay = {
      position: 'fixed',
      top: `${viewport.safeAreaTop + strategy.uiSpacing}px`,
      right: `${strategy.uiSpacing}px`,
      zIndex: 999
    }
    
    positions.gameInfo = {
      position: 'fixed',
      top: `${viewport.safeAreaTop + 80}px`,
      right: `${strategy.uiSpacing}px`,
      zIndex: 999
    }
  } else {
    // 竖屏布局
    positions.bluetoothButton = {
      position: 'fixed',
      top: `${viewport.safeAreaTop + strategy.uiSpacing}px`,
      left: `${strategy.uiSpacing}px`,
      zIndex: 999
    }
    
    positions.scoreDisplay = {
      position: 'fixed',
      top: `${viewport.safeAreaTop + strategy.uiSpacing}px`,
      right: `${strategy.uiSpacing}px`,
      zIndex: 999
    }
    
    positions.gameInfo = {
      position: 'fixed',
      top: `${viewport.safeAreaTop + 80}px`,
      right: `${strategy.uiSpacing}px`,
      zIndex: 999
    }
  }
  
  console.log('UI元素位置:', positions)
  return positions
}

/**
 * 将触摸坐标映射到画布坐标
 * 处理画布缩放、偏移对触摸坐标的影响，确保触摸坐标准确映射到飞镖盘的逻辑坐标系
 * @param {number} screenX 屏幕X坐标（逻辑像素）
 * @param {number} screenY 屏幕Y坐标（逻辑像素）
 * @param {Object} config 响应式配置对象
 * @returns {Object} 画布坐标对象 {x, y, distance, isInBounds, relativeX, relativeY}
 */
export function mapTouchToCanvas(screenX, screenY, config) {
  if (!config) {
    console.error('mapTouchToCanvas: 缺少响应式配置')
    return { x: screenX, y: screenY }
  }
  
  const { offsetX, offsetY, canvasSize, viewport, isLandscape } = config
  
  // 将屏幕坐标转换为相对于画布容器的坐标
  let relativeX = screenX - offsetX
  let relativeY = screenY - offsetY
  
  // 注意：设备像素比通常在Canvas绘制时处理，触摸坐标已经是逻辑像素
  
  // 计算画布的逻辑坐标系
  // 飞镖盘的逻辑坐标系通常以画布中心为原点，范围为 [-R, R]
  let canvasX, canvasY
  
  if (isLandscape) {
    // 横屏模式：画布被缩放以适应屏幕高度
    const originalCanvasSize = viewport.width // 原始设计基于屏幕宽度
    const scaleFactor = canvasSize / originalCanvasSize
    
    // 先转换到缩放前的坐标系
    canvasX = relativeX / scaleFactor
    canvasY = relativeY / scaleFactor
    
    // 转换为以画布中心为原点的坐标系
    canvasX = canvasX - originalCanvasSize / 2
    canvasY = canvasY - originalCanvasSize / 2
  } else {
    // 竖屏模式：保持原始比例
    // 转换为以画布中心为原点的坐标系
    canvasX = relativeX - canvasSize / 2
    canvasY = relativeY - canvasSize / 2
  }
  
  // 验证坐标是否在有效范围内
  const radius = canvasSize / 2
  const distance = Math.sqrt(canvasX * canvasX + canvasY * canvasY)
  
  if (distance > radius) {
    console.warn('触摸坐标超出画布范围:', { 
      screenX, screenY, 
      canvasX, canvasY, 
      distance, radius 
    })
  }
  
  const result = {
    x: Math.round(canvasX),
    y: Math.round(canvasY),
    // 额外信息用于调试
    distance: distance,
    isInBounds: distance <= radius,
    relativeX: Math.round(relativeX),
    relativeY: Math.round(relativeY)
  }
  
  console.log('触摸坐标映射:', {
    screen: { x: screenX, y: screenY },
    canvas: { x: result.x, y: result.y },
    config: { offsetX, offsetY, canvasSize, isLandscape }
  })
  
  return result
}

/**
 * 将画布坐标转换为飞镖盘逻辑坐标
 * @param {number} canvasX 画布X坐标（以中心为原点）
 * @param {number} canvasY 画布Y坐标（以中心为原点）
 * @param {Object} config 响应式配置
 * @returns {Object} 飞镖盘逻辑坐标 {x, y, r, angle}
 */
export function canvasToDartboardCoords(canvasX, canvasY, config) {
  // 计算极坐标
  const r = Math.sqrt(canvasX * canvasX + canvasY * canvasY)
  let angle = Math.atan2(canvasY, canvasX) * 180 / Math.PI
  
  // 将角度转换为飞镖盘标准角度（0度在顶部，顺时针）
  angle = (90 - angle + 360) % 360
  
  return {
    x: canvasX,
    y: canvasY,
    r: r,
    angle: angle,
    // 飞镖盘半径（基于画布尺寸）
    maxRadius: config.canvasSize / 2
  }
}

/**
 * 完整的触摸坐标映射：从屏幕坐标到飞镖盘逻辑坐标
 * @param {number} screenX 屏幕X坐标
 * @param {number} screenY 屏幕Y坐标
 * @param {Object} config 响应式配置
 * @returns {Object} 完整的坐标信息
 */
export function mapTouchToDartboard(screenX, screenY, config) {
  // 先映射到画布坐标
  const canvasCoords = mapTouchToCanvas(screenX, screenY, config)
  
  // 再转换为飞镖盘逻辑坐标
  const dartboardCoords = canvasToDartboardCoords(canvasCoords.x, canvasCoords.y, config)
  
  return {
    screen: { x: screenX, y: screenY },
    canvas: canvasCoords,
    dartboard: dartboardCoords,
    isValid: canvasCoords.isInBounds
  }
}

/**
 * 响应式布局 Composable
 * @returns {Object} 响应式布局相关的状态和方法
 */
export function useResponsive() {
  // 响应式状态
  const viewport = ref(getViewportInfo())
  const config = ref(calculateResponsiveConfig(viewport.value))
  const uiPositions = ref(calculateUIPositions(config.value))
  
  // 更新响应式配置
  const updateResponsiveConfig = () => {
    try {
      viewport.value = getViewportInfo()
      config.value = calculateResponsiveConfig(viewport.value)
      uiPositions.value = calculateUIPositions(config.value)
      console.log('响应式配置已更新')
    } catch (error) {
      console.error('更新响应式配置失败:', error)
    }
  }
  
  // 计算画布样式
  const canvasStyle = computed(() => {
    const cfg = config.value
    return {
      width: `${cfg.canvasSize}px`,
      height: `${cfg.canvasSize}px`,
      position: 'absolute',
      left: `${cfg.offsetX}px`,
      top: `${cfg.offsetY}px`
    }
  })
  
  // 触摸坐标映射函数
  const mapTouch = (screenX, screenY) => {
    const result = mapTouchToCanvas(screenX, screenY, config.value)
    
    // 如果坐标超出边界，可以选择性地进行处理
    if (!result.isInBounds) {
      console.warn('触摸点超出飞镖盘范围')
    }
    
    return result
  }
  
  // 完整的触摸映射函数（到飞镖盘逻辑坐标）
  const mapTouchToDartboardCoords = (screenX, screenY) => {
    return mapTouchToDartboard(screenX, screenY, config.value)
  }
  
  return {
    viewport,
    config,
    uiPositions,
    canvasStyle,
    updateResponsiveConfig,
    mapTouch,
    mapTouchToDartboardCoords,
    // 导出工具函数
    getViewportInfo,
    calculateResponsiveConfig,
    calculateUIPositions,
    mapTouchToCanvas,
    canvasToDartboardCoords,
    mapTouchToDartboard
  }
}

export default useResponsive