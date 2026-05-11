/**
 * 平台适配工具类
 * 用于检测当前运行环境及提供适配方法
 */

// 平台类型常量
export const PLATFORM = {
  ANDROID: 'android',
  IOS: 'ios',
  PC: 'pc',
  UNKNOWN: 'unknown'
};

// 系统信息缓存
let systemInfoCache = null;

/**
 * 获取系统信息
 * @returns {Object} 系统信息对象
 */
export const getSystemInfo = () => {
  if (!systemInfoCache) {
    try {
      systemInfoCache = uni.getSystemInfoSync();
    } catch (e) {
      console.error('获取系统信息失败:', e);
      return {};
    }
  }
  return systemInfoCache;
};

/**
 * 获取当前平台类型
 * @returns {String} 平台类型
 */
export const getPlatformType = () => {
  const systemInfo = getSystemInfo();
  const platform = systemInfo.platform;
  
  if (platform === 'android') {
    return PLATFORM.ANDROID;
  } else if (platform === 'ios') {
    return PLATFORM.IOS;
  } else if (platform === 'windows' || platform === 'mac' || platform === 'devtools') {
    return PLATFORM.PC;
  } else {
    return PLATFORM.UNKNOWN;
  }
};

/**
 * 判断是否为移动端
 * @returns {Boolean} 是否为移动端
 */
export const isMobileDevice = () => {
  const platformType = getPlatformType();
  return platformType === PLATFORM.ANDROID || platformType === PLATFORM.IOS;
};

/**
 * 判断是否为PC端
 * @returns {Boolean} 是否为PC端
 */
export const isPcDevice = () => {
  const platformType = getPlatformType();
  return platformType === PLATFORM.PC;
};

/**
 * 判断是否为Android系统
 * @returns {Boolean} 是否为Android系统
 */
export const isAndroid = () => {
  return getPlatformType() === PLATFORM.ANDROID;
};

/**
 * 判断是否为iOS系统
 * @returns {Boolean} 是否为iOS系统
 */
export const isIOS = () => {
  return getPlatformType() === PLATFORM.IOS;
};

/**
 * 根据平台返回相应的值
 * @param {Object} options - 不同平台的选项
 * @param {*} options.mobile - 移动端返回值
 * @param {*} options.pc - PC端返回值
 * @param {*} options.android - Android端返回值（优先级高于mobile）
 * @param {*} options.ios - iOS端返回值（优先级高于mobile）
 * @param {*} options.default - 默认返回值
 * @returns {*} 根据当前平台返回对应的值
 */
export const selectByPlatform = (options) => {
  const { mobile, pc, android, ios, default: defaultValue } = options;
  const platformType = getPlatformType();
  
  if (platformType === PLATFORM.ANDROID && android !== undefined) {
    return android;
  } else if (platformType === PLATFORM.IOS && ios !== undefined) {
    return ios;
  } else if (isMobileDevice() && mobile !== undefined) {
    return mobile;
  } else if (isPcDevice() && pc !== undefined) {
    return pc;
  } else {
    return defaultValue;
  }
};

/**
 * 获取适合当前设备的样式单位
 * 在PC端使用px，在移动端使用rpx
 * @param {Number} value - 样式值
 * @param {String} unit - 自定义单位，默认移动端用rpx，PC端用px
 * @returns {String} 组合后的样式值，如 '100rpx' 或 '50px'
 */
export const getResponsiveUnit = (value, unit) => {
  if (unit) {
    return `${value}${unit}`;
  }
  
  return isPcDevice() ? `${value}px` : `${value}rpx`;
};

/**
 * 获取设备屏幕方向
 * @returns {String} portrait - 竖屏 | landscape - 横屏
 */
export const getScreenOrientation = () => {
  const systemInfo = getSystemInfo();
  
  if (systemInfo.windowWidth > systemInfo.windowHeight) {
    return 'landscape';
  } else {
    return 'portrait';
  }
};

/**
 * 安全区域适配（尤其是针对刘海屏和底部Home Indicator）
 * @returns {Object} 安全区域信息
 */
export const getSafeArea = () => {
  const systemInfo = getSystemInfo();
  return systemInfo.safeArea || {};
};

export default {
  PLATFORM,
  getSystemInfo,
  getPlatformType,
  isMobileDevice,
  isPcDevice,
  isAndroid,
  isIOS,
  selectByPlatform,
  getResponsiveUnit,
  getScreenOrientation,
  getSafeArea
}; 