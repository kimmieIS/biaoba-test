// 使用 IIFE 封装单例
const AudioContextSingleton = (() => {
  let instance = null;
  let isDestroyed = false;

  return {
    /**
     * 获取音频上下文实例
     * @returns {Object} uni.createInnerAudioContext 实例
     */
    getInstance() {
      if (!instance || isDestroyed) {
        instance = uni.createInnerAudioContext();
        instance.loop = false;   // 默认不循环
      }
      return instance;
    },

    /**
     * 销毁音频上下文实例
     */
    destroy() {
      if (instance) {
        instance.stop();
        isDestroyed = true;
        instance = null;
      }
    },

    /**
     * 播放音频（带重试机制）
     * @param {string} url - 音频文件路径
     */
    play(url) {
      return new Promise((resolve, reject) => {
        const audio = this.getInstance();
        audio.src = url;
        
        audio.play()
		// #ifdef APP-PLUS
          .then(() => {
            resolve();
          })
          .catch((error) => {
            console.error('播放失败，重试:', error);
            // iOS 需要用户交互后重新触发
            if (uni.getSystemInfoSync().platform === 'ios') {
              audio.on('ended', () => {
                audio.play().then(resolve);
              });
            }
            reject(error);
          });
		// #endif
      });
    },

    /**
     * 停止播放
     */
    stop() {
      if (instance) {
        instance.stop();
      }
    },

    /**
     * 切换音频源
     * @param {string} url - 新音频文件路径
     */
    switchSource(url) {
      instance.src = url;
    },
  };
})();

export default AudioContextSingleton;