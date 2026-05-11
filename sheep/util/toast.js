import Toast from '@/sheep/components/util/toast/toast.vue';
import messageToastStore from "@/sheep/stores/message";

// 判断当前环境
const isH5 = process.env.UNI_PLATFORM === 'h5';

let toastInstance = null;
// 显示 toast
const showNativeToast = (options) => {
    messageToastStore().visible = true;
    const message = typeof options === 'string' ? options : undefined;
	console.log("message为："+message)
    if (message) {
        messageToastStore().message = message;
    }else{
        messageToastStore().title = options.title;
        messageToastStore().message = options.message;
        messageToastStore().isSticky = options.isSticky;
        messageToastStore().duration = options.duration;
    }

    // const message = typeof options === 'string' ? options : (options.message || options.title || '');
    // plus.nativeUI.toast(message, {
    //     verticalAlign: 'center',
    //     duration: options.duration || 'short'
    // });
};

// 统一的 showToast 方法
export const showToast = (options) => {
    // H5 环境使用自定义组件
    // if (isH5) {
    //   const toast = createH5Toast();
    //   toast.showToast(options);
    //   return;
    // }
    //
    // App 环境使用 plus.nativeUI.toast
    showNativeToast(options);
};

// 统一的 hideToast 方法
export const hideToast = () => {
    if (isH5 && toastInstance) {
        toastInstance.hideToast();
    }
};

export default {
    show: showToast,
    hide: hideToast
};
