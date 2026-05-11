<script>
import $stores from "@/sheep/stores";
import sheep from "@/sheep";
export default {
	components: {
	},
	data() {
		return {
			modalVisible: false,
			isShowing: true,
		};
	},

	onLaunch() {
		// 确保默认语言为中文
		if (!uni.getStorageSync("locale")) {
			uni.setStorageSync("locale", "zh");
		}
	},
	onHide() {

	},
	onShow(options) {
		this.init(options);
	},
	onUnload() {
	},
	watch: {

	},
	methods: {
		init(options) {
			// 初始化用户数据
			// 精简初始化：仅保留必要的设备设置


			// 横屏设置
			// const systemInfo = uni.getSystemInfoSync()
			// // 判断是不是安卓跟ios(是不是手机)
			// if (systemInfo.platform === 'android' || systemInfo.platform === 'ios') {
			// 	// 隐藏顶部电池,时间等信息
			// 	plus.navigator.setFullscreen(true);
			// 	//隐藏虚拟按键
			// 	plus.navigator.hideSystemNavigation()
			// } else {
			// 	// 不是手机端的处理逻辑
			// }

			// 熄屏设置 - 仅在App环境下执行
			// #ifdef APP-PLUS
			if (typeof plus !== 'undefined') {
				plus.device.setWakelock(true);
			}
			// #endif

			// 已移除 zego 初始化以缩小体积
		}
	},
};
</script>

<template>
</template>

<style>
/*每个页面公共css */
@import '@/sheep/scss/index.scss';

@media (prefers-color-scheme: dark) {
	html {
		background: #170746;
	}
}

page {
	/* 精简体积：移除大背景图，保留纯色背景 */
	background-color: #170746;
}
</style>