<script setup>
import {defineProps, defineEmits, ref, watch} from 'vue';
import PopBackground from "@/sheep/components/common/popBackground.vue";
import BackButton from "@/sheep/components/common/backButton.vue";

const props = defineProps({
  modalVisible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  cancel: {
    type: Boolean,
    default: false
  },
  confirm: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: '80%'
  },
  height: {
    type: String,
    default: '80%'
  },
  position: {
    type: String,
    default: 'inside'
  },
  showClose: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modalVisible', 'close', 'confirm']);

// 内部显示状态
const isShow = ref(false);
const isActive = ref(false);

// 监听 modalVisible 变化
watch(() => props.modalVisible, (newVal) => {
  if (newVal) {
    // 显示时，先显示元素
    isShow.value = true;
    // 等待一帧后添加动画类
    setTimeout(() => {
      isActive.value = true;
    }, 10);
  } else {
    // 关闭时，先移除动画类
    isActive.value = false;
    // 等待动画完成后隐藏元素
    setTimeout(() => {
      isShow.value = false;
    }, 300);
  }
}, {immediate: true});

// 关闭模态框
const closeModal = () => {
  emit('update:modalVisible', false);
  emit('close');
};

// 确认操作
const confirmSelection = () => {
  emit('confirm');
};

// 点击外部区域关闭
const handleOutsideClick = () => {
  closeModal();
};

// 阻止内容区域的点击事件冒泡
const handleContentClick = (event) => {
  event.stopPropagation();
};
</script>

<template>
  <view v-show="isShow"
        class="modal"
        :class="{ 'modal-show': isActive }"
        @tap="handleOutsideClick">
    <BackButton v-if="showClose" @onClick="closeModal"/>

    <view class="modal-content center"
          :class="{ 'content-show': isActive }"
          :style="{width,height,}"
          @tap.stop="handleContentClick">
      <text class="modal-title" v-if="title" @tap="closeModal">{{ title }}</text>

      <PopBackground>
        <view class="pop-back-ground">
          <!-- 右上角关闭按钮 -->
          <!--          <view v-if="showClose" class="close-btn" @tap="closeModal">×</view>-->
          <view class="uni-flex center uni-column uni-space-between">
            <slot></slot>
          </view>

          <view v-if="position === 'inside'&&(confirm||cancel)" class="footer-buttons">
            <button  v-clickSound   v-if="confirm"
                    class="confirm-btn pattern-active-button"
                    @tap="confirmSelection">
              {{ $t('buttons.confirm') }}
            </button>
            <button  v-clickSound   v-if="cancel"
                    class="confirm-btn pattern-active-button"
                    @tap="closeModal">
              {{ $t('buttons.close') }}
            </button>
          </view>
        </view>
      </PopBackground>
    </view>
  </view>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  opacity: 0;
  transition: all 0.3s ease;
}

.modal-show {
  background-color: rgba(0, 0, 0, 0.8);
  opacity: 1;
}

.modal-content {
  transform: scale(0.9) translateY(20rpx);
  opacity: 0;
  transition: all 0.3s ease;
  border-radius: 10rpx;
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.content-show {
  transform: scale(1) translateY(0);
  opacity: 1;
}

.pop-back-ground {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.uni-flex.center.uni-column.uni-space-between {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.modal-title {
  width: 100%;
  text-align: center;
  margin-bottom: 10rpx;
  font-size: 16rpx;
  font-weight: 400;
  color: #FFFFFF;
  line-height: 1;
  text-stroke: 1px #8856FF;
  -webkit-text-stroke: 1px #8856FF;
}

.close-btn {
  text-align: right;
  position: absolute;
  top: 0;
  right: 10rpx;
  font-size: 24rpx;
  color: #FFFFFF;
}

.footer-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.confirm-btn,
.cancel-btn {
  width: 100rpx;
  height: 35rpx;
  background-color: #f2f2f2;
  font-size: 12rpx;
  line-height: 30rpx;
  border-radius: 4rpx;
}

.confirm-btn {
  background-color: #00ccff;
  color: white;
}
</style>