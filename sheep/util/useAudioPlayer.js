import {
	ref,
	onUnmounted
} from 'vue';
import AudioContextSingleton from '@/sheep/util/audioContext.js';
import emitter from '@/sheep/util/eventBus'
export function useAudioPlayer() {
	const innerAudioContext = AudioContextSingleton.getInstance();
	const isPlaying = ref(false); // 是否正在播放
	const currentSrc = ref(''); // 当前音频地址
	const duration = ref(0); // 音频总时长（秒）
	const hasError = ref(false); // 是否发生错误
	const errorCount = ref(0); // 错误计数

	// 初始化音频配置
	const initializeAudioContext = () => {

		console.log("音频实例", innerAudioContext)
		innerAudioContext.autoplay = false;

		// // 监听播放事件
		// innerAudioContext.onPlay(() => {
		// 	console.log('音频开始播放');
		// 	isPlaying.value = true;
		// 	hasError.value = false; // 播放成功，清除错误标志
		// });

		// // 监听播放结束事件
		// innerAudioContext.onEnded(() => {
		// 	console.log('音频播放完毕，自动结束');
		// 	isPlaying.value = false;
		// 	AudioContextSingleton.stop(); // 停止播放
		// });

		// // 监听音频时长获取事件
		// innerAudioContext.onCanplay(() => {
		// 	duration.value = Math.ceil(innerAudioContext.duration); // 获取音频总时长（单位：秒）
		// 	console.log(`音频总时长：${duration.value} 秒`);
		// });

		// // 监听播放错误
		// innerAudioContext.onError((res) => {
		// 	console.error('音频播放出错：', res);
		// 	hasError.value = true;
		// 	isPlaying.value = false;
		// 	errorCount.value += 1; // 增加错误计数
		// 	// 销毁并重新初始化音频上下文
		// 	resetAudioContext();
		// });
	};

	// 初始化音频上下文
	initializeAudioContext();

	// 播放音频
	const playAudio = (src) => {
		if (!src) {
			console.warn('音频地址不能为空');
			return;
		}
		//      // 重置错误状态
		//      if (hasError.value) {
		//          console.log('尝试恢复播放');
		//          hasError.value = false;
		//      }
		//      // 如果正在播放，先停止之前的音频
		//      if (isPlaying.value) {
		//          AudioContextSingleton.stop();
		//      }
		//      // 避免重复加载相同的音频
		//      if (currentSrc.value !== src) {
		// console.log('音频地址----',src)
		//          currentSrc.value = src;
		//          innerAudioContext.src = src;
		//      }
		try {
			AudioContextSingleton.stop();
			AudioContextSingleton.play(src);
		} catch (error) {
			console.error('播放音频时发生异常：', error);
			hasError.value = true;
		}


	};



	// 停止播放
	const stopAudio = () => {
		try {
			AudioContextSingleton.stop();
			isPlaying.value = false;
		} catch (error) {
			console.error('停止音频时发生异常：', error);
		}
	};

	emitter.on('stopAudio',stopAudio)

	// 重置音频上下文
	const resetAudioContext = () => {
		try {
			// AudioContextSingleton.destroy();
		} catch (error) {
			console.error('清理音频上下文时发生异常3：', error);
		} finally {
			initializeAudioContext(); // 重新初始化音频上下文
		}
	};

	// 清理音频实例
	const clearAudioContext = () => {
		try {
			// AudioContextSingleton.destroy();
		} catch (error) {
			console.error('清理音频上下文时发生异常：', error);
		}
	};

	// 组件销毁时清理资源
	onUnmounted(() => {
		clearAudioContext();
	});

	return {
		playAudio,
		stopAudio,
		isPlaying,
		duration,
		currentSrc,
		hasError,
		errorCount,
	};
}