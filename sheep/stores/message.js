import {defineStore} from 'pinia';

const messageToastStore = defineStore('messageToast', {
    state: () => ({
        visible: false,
        title: '',
        message: '',
        duration: 1500,
        isSticky: false,
    }),
    actions: {},
});

export default messageToastStore;