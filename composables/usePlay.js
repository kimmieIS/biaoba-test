// 临时空实现 - usePlay
import { ref, computed } from 'vue'

export function usePlay({ engine, appendActionInfo, appendCallbackInfo }) {
	const playStreamID = computed(() => {
		return 'temp_stream'
	})
	const playVideoElem = ref(null)
	
	function addPlayListeners() {
		console.log('usePlay addPlayListeners - 临时禁用')
	}
	
	function playError() {
		console.log('usePlay playError - 临时禁用')
	}
	
	return {
		playStreamID,
		playVideoElem,
		addPlayListeners,
		playError
	}
}