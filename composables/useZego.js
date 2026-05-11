// 临时注释掉 Zego 相关导入 - 提供空实现以避免错误
// import ZegoExpressEngine, {
// 	ZegoOrientation,ZegoVideoMirrorMode
// } from "@/sheep/components/zego-ZegoExpressUniApp-JS/components/zego-ZegoExpressUniApp-JS/lib/ZegoExpressEngine";
// import { ZegoScenario } from "@/sheep/components/zego-ZegoExpressUniApp-JS/components/zego-ZegoExpressUniApp-JS/lib/ZegoExpressDefines";
import { ref, shallowRef } from 'vue'
// import keyCenter from "./KeyCenter.js";  // 临时注释掉

import {
	onShow,
	onBackPress,
	onUnload
} from "@dcloudio/uni-app";

// 临时的空实现，避免导入错误
export function useZego() {
	const info = ref('')
	const logHeight = ref(80)
	const engine = shallowRef(null)
	const userID = ref('temp_user')
	const userName = ref('temp_user')
	const isLogin = ref(false)
	const isRequest = ref(false)
	
	// 空实现函数
	async function createEngine() {
		console.log('Zego createEngine - 临时禁用')
	}
	
	function destroyEngine() {
		console.log('Zego destroyEngine - 临时禁用')
	}
	
	async function loginRoom(roomID, userID, userName) {
		console.log('Zego loginRoom - 临时禁用')
	}
	
	function logoutRoom(roomID) {
		console.log('Zego logoutRoom - 临时禁用')
	}
	
	function startPreview(channel) {
		console.log('Zego startPreview - 临时禁用')
	}
	
	function stopPreview() {
		console.log('Zego stopPreview - 临时禁用')
	}
	
	function changeLogViewSize() {
		logHeight.value = logHeight.value == 80 ? 800 : 80;
	}
	
	function appendActionInfo(value) {
		info.value += "🚀" + value + "\n";
	}
	
	function appendSuccessInfo(value) {
		info.value += "✅" + value + "\n";
	}
	
	function appendFailureInfo(value) {
		info.value += "❌" + value + "\n";
	}
	
	function appendCallbackInfo(value) {
		info.value += "📩" + value + "\n";
	}

	onShow(() => {
	    // userID.value = keyCenter.getUserID()  // 临时注释掉
	})

	return {
		info,
		logHeight,
		userID,
		userName,
		isLogin,
		isRequest,
		engine,
		createEngine,
		loginRoom,
		logoutRoom,
		startPreview,
		stopPreview,
		changeLogViewSize,
		appendActionInfo,
		appendSuccessInfo,
		appendFailureInfo,
		appendCallbackInfo
	}
}