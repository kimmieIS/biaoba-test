// 临时空实现 - usePublish
import { ref } from 'vue'

export function usePublish({ engine, appendActionInfo, appendCallbackInfo }) {
	const publishStreamID = ref('temp_stream')
	const publishBtnName = ref("Start Publishing")
	const isPublishingStream = ref(false)
	
	function onClickPublish() {
		console.log('usePublish onClickPublish - 临时禁用')
	}
	
	function addPublishListeners() {
		console.log('usePublish addPublishListeners - 临时禁用')
	}
	
	return {
		publishStreamID,
		publishBtnName,
		isPublishingStream,
		onClickPublish,
		addPublishListeners
	}
}