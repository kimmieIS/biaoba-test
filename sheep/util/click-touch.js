import {useAudioPlayer} from "@/sheep/util/useAudioPlayer";
// 导出指令定义
export default {

  // 入口函数
  install(app) {
    app.directive('clickSound', {
      // 生命周期钩子
      mounted(el, binding, vnode) {
 
        // 事件处理函数
        const handleClick = (e) => {
			useAudioPlayer().playAudio('/static/mp3/anjianyin.mp3');
        };

        // 绑定事件（兼容多端）
        el.addEventListener('click', handleClick);
        el.addEventListener('touchstart', (e) => {
          handleClick(e);
        });

        // 存储引用（用于移除事件）
        el._clickHandler = {
          handleClick
        };
      },

      // 组件卸载时清理
      unmounted(el) {
        if (el._clickHandler) {
          const handler = el._clickHandler;
          el.removeEventListener('click', handler.handleClick);
          el.removeEventListener('touchstart', handler.handleClick);
          delete el._clickHandler;
        }
      },
    });
  },
};
