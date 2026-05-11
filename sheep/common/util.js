import { ref, watch } from 'vue';

export const preventDuplicateClick = (func, delay = 1000) => {
    let isClicked = false;
    return (...args) => {
        if (isClicked) return; // 如果已点击，直接返回
        isClicked = true;

        // 调用传入的函数
        func.apply(this, args);

        // 恢复点击状态
        setTimeout(() => {
            isClicked = false;
        }, delay);
    };
}

/**
 * 通用的 Watch 带锁工具
 * @param {Function} getter - 需要监听的 getter
 * @param {Function} callback - 在值变化时需要执行的逻辑
 * @param {Object} options - Watch 选项，可选
 */
export function useWatchWithLock(getter, callback, options = {}) {
    const isProcessing = ref(false); // 锁定标志

    watch(
        getter,
        async (newVal, oldVal) => {
            if (isProcessing.value) {
                return; // 如果正在处理，则直接返回，忽略新的变化
            }

            if (newVal) {
                isProcessing.value = true; // 设置锁
                try {
                    await callback(newVal, oldVal); // 执行回调逻辑
                } catch (error) {
                    console.error('处理回调时发生错误:', error);
                } finally {
                    isProcessing.value = false; // 解锁
                }
            }
        },
        options
    );
}