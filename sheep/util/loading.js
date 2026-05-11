import { ref } from 'vue';

const loadingState = ref({
  show: false,
  text: '加载中...',
  mask: true
});

export const showLoading = (options = {}) => {
  if (typeof options === 'string') {
    loadingState.value = {
      show: true,
      text: options,
      mask: true
    };
  } else {
    loadingState.value = {
      show: true,
      text: options.text || '加载中...',
      mask: options.mask !== false
    };
  }
};

export const hideLoading = () => {
  loadingState.value.show = false;
};

export const getLoadingState = () => loadingState; 