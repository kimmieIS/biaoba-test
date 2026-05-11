<template>
  <background />
  <view :style="iconStyle" class="overflow-hidden" @click="state.modalVisible = true" v-clickSound>
    <image class="uni-img uni-img-scale2 " v-if="connectedStatus" src="@/static/images/bluetooth.png" alt="" />
    <image class="uni-img uni-img-scale2 " v-if="!connectedStatus" src="@/static/images/notBluetooth.png" alt="" />
  </view>


  <!--  蓝牙连接弹出层-->
  <PopUpLayer v-model:modalVisible="state.modalVisible" :confirm="false" :cancel="false" width="80%" height="auto">
    <view class="option-group enlarged-popup">
      <view class="button-group">
        <button class="uni-button pattern-button uni-buttonAdapt" :class="{ 'pattern-active-button': connectedStatus }"
          :style="locale === 'zh' ? 'min-width: 100rpx;' : 'min-width: 130rpx;'">{{ t('connected') }}
        </button>
        <button class="uni-button pattern-button uni-buttonAdapt" :class="{ 'pattern-active-button': !connectedStatus }"
          :style="locale === 'zh' ? 'min-width: 140rpx;' : 'min-width: 130rpx;'" @click="disconnected">{{
            t('Disconnect') }}
        </button>
      </view>
      <text class="group-title" style="font-size: 16rpx;font-weight: 400;text-align: center">{{
        t('cannot_connect_target') }}</text>
      <view class="button-group">
        <button v-clickSound
          class="uni-button pattern-button pattern-active-button search_pattern-active-button uni-buttonAdapt"
          :style="locale === 'en' ? 'min-width: 160rpx;' : 'min-width: 120rpx;'" @click="connectDeviceFun">{{
            t('start_connecting') }}
        </button>
      </view>
      <text class="group-title">{{ t('search_bluetooth_device') }}</text>
    </view>
  </PopUpLayer>
</template>

<script setup>
import sheep from "@/sheep";
import { closeConnected, connectDevice } from "@/sheep/util/bluetoothUtil";
import { reactive, computed, watch } from "vue";
import PopUpLayer from "@/sheep/components/util/popUp/popUpLayer.vue";
import { preventDuplicateClick } from "@/sheep/common/util";
import Background from "@/sheep/components/common/background.vue";


import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

// const blue = bluetooth() 
// //监听对战内的投标
// watch(blue.isDisconnected, (New, Old) => {
// 	  console.log("----------------------------------监听消息,",New)
//     },
// )  
const props = defineProps({
  color: {
    type: String,
    default: '#67FE50', // 默认颜色
  },
  size: {
    type: [String, Number],
    default: 40,
  },
});

const iconStyle = computed(() => {
  const sizeValue = Number(props.size) || 40;
  return {
    width: `${sizeValue}rpx`,
    height: `${sizeValue}rpx`,
  };
});

const state = reactive({
  modalVisible: false,
})


// function onFoo(e) {
//     console.log('监听页面中：',e);
//     state.modalVisible=false;
// }

// emitter.on('on-button-click', onFoo);

// 获取蓝牙连接状态
const connectedStatus = computed(() => {
  return sheep.$stores("bluetooth").isConnected;
});

// 侦听连接状态的变化，以关闭弹窗
watch(connectedStatus, (newVal) => {
  if (newVal) {
    // 当连接状态变为 true 时，自动关闭弹窗
    state.modalVisible = false;
  }
});

const connectDeviceFun = preventDuplicateClick(() => {
  connectDevice();
})
const disconnected = function () {
  closeConnected();
}
</script>

<style scoped lang="scss">
.group-title {
  font-weight: 400;
  color: #8856FF;
}

.search_pattern-active-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(136, 87, 255, 0.14) !important;
  border: 1rpx solid #8857FF !important;
  width: 120rpx;
}

.option-group {
  margin: 10rpx 0;
}

.enlarged-popup {
  transform: scale(1.5);
  transform-origin: center;
  padding: 30rpx;
}


.button-group {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin: 10rpx 0;
  align-items: center;
}

@media (max-width: 412px) {
  .uni-buttonAdapt {
    width: 130rpx;
  }
}

.uni-buttonAdapt {
  min-width: 130rpx;
  width: auto;
  padding: 0 10rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>