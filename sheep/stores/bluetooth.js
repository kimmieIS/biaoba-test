import {defineStore} from 'pinia';
import {connectDevice} from "@/sheep/util/bluetoothUtil";

const useBluetoothStore = defineStore('bluetooth', {
    state: () => ({
        // 是否次连接
        isDisconnected: true,
        // 跟踪蓝牙连接的示例状态
        isConnected: false,
        // 当前连接的设备ID
        deviceId: '',
        // 是否连接中
        isConnecting: false,
        // 游戏分值
        scoreCallback: null,
        // 是否监听中
        isListening: false,
        // 游戏是否开始
        isGameStart: false,
        // 最后一次状态检查时间
        lastStatusCheck: 0,
    }),

    actions: {
        connect() {
            // 如果是已经连接或连接中就跳过
            if (this.isConnected || this.isConnecting) return;
            this.isConnecting = true;
            connectDevice()
            this.isConnecting = false;
        },

        disconnect() {
            this.isConnected = false;
            this.isConnecting = false;
            this.deviceId = '';
            this.isDisconnected = true;
            console.log('[Store] 蓝牙状态已重置为断开');
        },

        // 设置连接成功
        setConnected(deviceId = '') {
            this.isConnected = true;
            this.isConnecting = false;
            this.isDisconnected = false;
            this.deviceId = deviceId;
            this.lastStatusCheck = Date.now();
            console.log(`[Store] 蓝牙连接状态已更新: deviceId=${deviceId}`);
        },

        // 设置连接状态（用于状态同步）
        setConnectionState(connected, deviceId = null) {
            this.isConnected = connected;
            this.isConnecting = false;
            this.isDisconnected = !connected;
            this.deviceId = deviceId || '';
            this.lastStatusCheck = Date.now();
            console.log(`[Store] 蓝牙连接状态同步: connected=${connected}, deviceId=${deviceId}`);
        },

        // 获取连接状态
        getConnectedStatus() {
            return this.isConnected;
        },

        // 检查实际蓝牙连接状态
        async checkRealConnectionStatus() {
            return new Promise((resolve) => {
                // #ifdef APP-PLUS
                uni.getConnectedBluetoothDevices({
                    success: (res) => {
                        const hasConnectedDevice = res.devices && res.devices.length > 0;
                        const currentDevice = hasConnectedDevice ? res.devices[0] : null;

                        // 如果UI状态与实际状态不符，进行同步
                        if (hasConnectedDevice && !this.isConnected) {
                            console.log('[Store] 发现实际已连接但UI显示未连接，正在同步...');
                            this.setConnectionState(true, currentDevice.deviceId);
                        } else if (!hasConnectedDevice && this.isConnected) {
                            console.log('[Store] 发现实际未连接但UI显示已连接，正在同步...');
                            this.setConnectionState(false, null);
                        }

                        resolve({
                            connected: hasConnectedDevice,
                            device: currentDevice
                        });
                    },
                    fail: (err) => {
                        console.error('[Store] 检查蓝牙连接状态失败:', err);
                        // 检查失败时，如果UI显示已连接，则重置为未连接
                        if (this.isConnected) {
                            this.setConnectionState(false, null);
                        }
                        resolve({
                            connected: false,
                            device: null
                        });
                    }
                });
                // #endif
                // #ifndef APP-PLUS
                resolve({
                    connected: this.isConnected,
                    device: null
                });
                // #endif
            });
        },

        setScoreCallback(callback) {
            this.scoreCallback = callback;
        },
        handleScore(data) {
            if (this.scoreCallback) {
                this.scoreCallback(data);
            }
        },
        startListen(flay) {
            this.isListening = flay;
        },
    },
});

export default useBluetoothStore;