import { ref, reactive } from 'vue';
import bluetooth from "@/sheep/stores/bluetooth";
import { showToast } from "@/sheep/util/toast";

import emitter from '@/sheep/util/eventBus'

// ------------------- 模块内部状态 -------------------
const state = reactive({
    deviceId: '', // 当前操作的设备ID
    serviceId: '0000FFE0-0000-1000-8000-00805F9B34FB',
    characteristicId: '0000FFE1-0000-1000-8000-00805F9B34FB',
    isSearching: false, // 是否正在搜索
});

// ------------------- 核心连接与发现逻辑 -------------------

// 【1】初始化蓝牙
const initBlue = () => {
    // #ifdef APP-PLUS
    uni.openBluetoothAdapter({
        success: () => {
            console.log('[BT] 蓝牙适配器初始化成功');
            discovery(); // 在成功回调中启动搜索
        },
        fail: (err) => {
            console.error('[BT] 蓝牙适配器初始化失败', err);
            errorHandle('蓝牙初始化失败');
        }
    });
    // #endif
}

// 【2】开始搜寻附近设备
const discovery = () => {
    // #ifdef APP-PLUS
    if (state.isSearching) return;
    state.isSearching = true;
    uni.startBluetoothDevicesDiscovery({
        success: () => {
            console.log('[BT] 开始搜索附近设备...');
            uni.onBluetoothDeviceFound(found);
        },
        fail: () => {
            errorHandle('蓝牙设备搜索失败');
            state.isSearching = false;
        }
    });
    // 10秒后自动停止搜索，防止过度耗电
    setTimeout(stopDiscovery, 10000);
    // #endif
}

// 【3】找到新设备
const found = (res) => {
    // #ifdef APP-PLUS
    // 如果已停止搜索，则忽略后续发现的设备，防止重复连接
    if (!state.isSearching) {
        return;
    }
    if (res.devices[0].name === 'EVM_GoDart' || res.devices[0].localName === 'EVM_GoDart') {
        console.log('[BT] 找到目标设备:', res.devices[0].deviceId);
        stopDiscovery();
        connect(res.devices[0].deviceId);
    }
    // #endif
}

// 【4】连接设备
const connect = (deviceId) => {
    // #ifdef APP-PLUS
    state.deviceId = deviceId;
    uni.createBLEConnection({
        deviceId: state.deviceId,
        success: () => {
            console.log(`[BT] 连接设备 ${state.deviceId} 成功`);
            // 替换旧的固定延时，改为启动服务轮询
            pollForServices();
        },
        fail: () => errorHandle('蓝牙连接失败')
    });
    // #endif
}

// 【5】停止搜索
const stopDiscovery = () => {
    // #ifdef APP-PLUS
    if (!state.isSearching) return;
    state.isSearching = false;
    uni.stopBluetoothDevicesDiscovery({
        success: () => console.log('[BT] 停止设备搜索'),
    });
    // 关键修复：移除设备发现的监听器，防止在页面跳转后触发"幽灵回调"
    // 同时增加一个判断，确保在不支持该API的旧版uni-app环境中不会报错
    if (uni.offBluetoothDeviceFound) {
        uni.offBluetoothDeviceFound(found);
    }
    // #endif
}

// 【6】服务轮询 (新函数，替代旧的 getServices)
const pollForServices = (maxAttempts = 10, attempt = 1) => {
    // #ifdef APP-PLUS
    if (attempt > maxAttempts) {
        console.error(`[BT] ${maxAttempts}次尝试后仍未发现服务，操作失败。`);
        errorHandle('查找蓝牙服务超时');
        return;
    }

    console.log(`[BT] 正在进行第 ${attempt} 次服务发现...`);

    uni.getBLEDeviceServices({
        deviceId: state.deviceId,
        success: (res) => {
            const serviceUUIDs = res.services.map(s => s.uuid.toUpperCase());
            if (serviceUUIDs.length > 0) {
                // 成功发现服务
                console.log('[BT] 成功发现服务列表:', serviceUUIDs.join(', '));
                const hasFfe0 = serviceUUIDs.some(uuid => uuid.includes('FFE0'));
                if (hasFfe0) {
                    // 找到了我们需要的服务，继续下一步
                    setTimeout(getCharacteristics, 200); // 稳定延时
                } else {
                    // 发现了服务，但没有我们需要的，这是个硬错误
                    errorHandle('未找到目标服务FFE0');
                }
            } else {
                // 服务列表为空，稍后重试
                setTimeout(() => pollForServices(maxAttempts, attempt + 1), 300);
            }
        },
        fail: (err) => {
            // getBLEDeviceServices API调用本身失败，也进行重试
            console.warn(`[BT] 第${attempt}次API调用失败，准备重试`, err);
            setTimeout(() => pollForServices(maxAttempts, attempt + 1), 300);
        }
    });
    // #endif
}

// 【7】获取特征值 (已修复函数调用错误和增加校验)
const getCharacteristics = () => {
    // #ifdef APP-PLUS
    uni.getBLEDeviceCharacteristics({
        deviceId: state.deviceId,
        serviceId: state.serviceId,
        success: (res) => {
            console.log('[BT] 获取特征值成功');
            const hasFfe1 = res.characteristics.some(c => c.uuid.toUpperCase().includes('FFE1'));
            if (hasFfe1) {
                notify();
            } else {
                errorHandle('未找到目标特征值FFE1');
            }
        },
        fail: () => errorHandle('获取蓝牙特征值失败')
    });
    // #endif
}

// 【8】开启消息监听
const notify = () => {
    // #ifdef APP-PLUS
    uni.notifyBLECharacteristicValueChange({
        deviceId: state.deviceId,
        serviceId: state.serviceId,
        characteristicId: state.characteristicId,
        success: () => {
            console.log('[BT] 开启消息监听成功');
            connected();
            listenValueChange();
        },
        fail: (err) => errorHandle('开启消息监听失败')
    });
    // #endif
}

// ArrayBuffer转16进度字符串示例
const ab2hex = (buffer) => {
    const hexArr = Array.prototype.map.call(new Uint8Array(buffer), (bit) => ('00' + bit.toString(16).toUpperCase()).slice(-2));
    return hexArr.join('');
};

// ------------------- 新增：持久化的回调函数 (最终修复版) -------------------

// 【回调1】监听消息变化的回调
const _onCharacteristicValueChange = (res) => {
	setTimeout(() => {
		let resHex = ab2hex(res.value);
		if (resHex && bluetooth().isGameStart) {
			console.log('接收到蓝牙数据:', resHex);

			// 🔧 所有蓝牙数据都传递给游戏页面，由游戏页面进行回合判断
			// 优先使用handleScore调用回调函数（支持连续相同数据）
			if (bluetooth().scoreCallback && typeof bluetooth().scoreCallback === 'function') {
				bluetooth().handleScore(resHex);
			} else {
				// 兼容旧的watch监听方式（其他游戏）
				bluetooth().setScoreCallback(resHex);
			}
		}
	}, 0);
}

// 【回调2】监听连接状态变化的回调
const _onConnectionStateChange = (res) => {
	setTimeout(() => {
		console.log(`[BT] 系统连接状态改变: deviceId=${res.deviceId}, connected=${res.connected}`);
		if (!res.connected) {
			// 检查是否是当前活动设备断开
			if (state.deviceId === res.deviceId || bluetooth().deviceId === res.deviceId) {
				console.warn('[BT] 检测到活动设备意外断开！');
				state.deviceId = '';
				// 更新store状态
				bluetooth().setConnectionState(false, null);
				// 显示断开提示
				setTimeout(() => {
					showToast({ message: '蓝牙连接意外断开', icon: 'none' });
				}, 200);
			}
		} else {
			// 设备重新连接
			if (state.deviceId === res.deviceId || bluetooth().deviceId === res.deviceId) {
				console.log('[BT] 设备重新连接');
				bluetooth().setConnectionState(true, res.deviceId);
			}
		}
	}, 100);
}


// ------------------- 重构后的监听函数 -------------------

// 【9】监听消息变化
const listenValueChange = () => {
    // #ifdef APP-PLUS
    uni.onBLECharacteristicValueChange(_onCharacteristicValueChange);
    // #endif
}

// 在模块加载时就注册永久的连接状态监听器
// #ifdef APP-PLUS
uni.onBLEConnectionStateChange(_onConnectionStateChange);
// #endif


// ------------------- 状态与错误处理 -------------------

// 通用错误处理
const errorHandle = (text = '蓝牙操作失败') => {
    // 清理本地状态
    state.deviceId = '';
    state.isSearching = false;

    // 更新store状态
    bluetooth().setConnectionState(false, null);

    setTimeout(() => {
        showToast({ message: text, icon: 'none', duration: 2000 });
    }, 100);
}

// 连接成功后的处理
const connected = () => {
    bluetooth().setConnected(state.deviceId);
    setTimeout(() => {
        showToast({ message: '蓝牙连接成功', icon: 'none' });
    }, 100);
}


// ------------------- 改造后的导出函数 -------------------

/**
 * 【核心改造】断开连接 (已修复逻辑)
 * 包含发送停止指令的健壮逻辑
 */
export const closeConnected = (zombieDeviceId = null) => {
    // #ifdef APP-PLUS
    const deviceId = zombieDeviceId || state.deviceId || bluetooth().deviceId;
    if (!deviceId) {
        console.log('[BT] 当前无连接，无需断开');
        return;
    }
    console.log(`[BT] 开始断开设备 ${deviceId}...`);

    const buffer = new ArrayBuffer(1);
    const dataView = new DataView(buffer);
    dataView.setUint8(0, 0x00);

    uni.writeBLECharacteristicValue({
        deviceId,
        serviceId: state.serviceId,
        characteristicId: state.characteristicId,
        value: buffer,
        fail: (err) => console.error('❌ [BT] 发送停止指令失败:', err),
        complete: () => {
            // 关键修复：在关闭连接前，先取消所有监听，做到有始有终
            // 修复安卓兼容性问题：检查API是否存在
            try {
                if (typeof uni.offBLECharacteristicValueChange === 'function') {
                    // 在某些平台上，可能需要不传参数来取消所有监听
                    uni.offBLECharacteristicValueChange();
                    console.log('[BT] 已取消BLE特征值变化监听');
                } else {
                    console.log('[BT] 当前平台不支持 offBLECharacteristicValueChange');
                }
            } catch (error) {
                console.warn('[BT] 取消BLE监听时出错:', error);
            }

            // 2. 无论指令是否成功，都关闭连接
            uni.closeBLEConnection({
                deviceId,
                complete: () => {
                    console.log(`[BT] 已关闭与 ${deviceId} 的连接`);
                    // 修复：同样使用本模块的state.deviceId进行判断
                    if (state.deviceId === deviceId) {
                        state.deviceId = '';
                        // 关键修复：将状态更新和UI操作延迟，避免在页面切换时崩溃
                        setTimeout(() => {
                            bluetooth().disconnect(); // 仅当断开的是当前活动设备时，才更新pinia状态
                            showToast({ message: '蓝牙已断开', icon: 'none' });
                        }, 100);
                    }
                }
            });
        }
    });
    // #endif
}

/**
 * 【核心改造】对外暴露的总入口
 * 点击连接按钮时调用此函数
 */
export const connectDevice = () => {
    // #ifdef APP-PLUS
    if (bluetooth().isConnected) {
        closeConnected();
    } else {
        // 每次都重新走一遍初始化和搜索流程，确保状态最新
        startConnectionProcess();
    }
    // #endif
};

/**
 * 启动连接总流程
 * 【新增】将initBlue和discovery包装起来，确保流程的原子性
 */
const startConnectionProcess = () => {
    // #ifdef APP-PLUS
    // 每次开始新的连接流程时，都重置内部状态
    state.deviceId = '';
    state.isSearching = false;

    // 【iOS 兼容性修复】硬重置蓝牙适配器，解决iOS重连失败问题
    uni.closeBluetoothAdapter({
        complete: () => {
            console.log('[BT] 适配器已关闭，准备重启...');
            // 在 close 的回调中继续后续流程，确保操作顺序
            // 关键修复：在开始新流程前，先检查并清理任何遗留的"僵尸连接"
            uni.getConnectedBluetoothDevices({
                success: (res) => {
                    if (res.devices.length > 0) {
                        console.log('[BT] 发现遗留连接，正在清理...');
                        res.devices.forEach(device => {
                            // 这里可以根据业务，比如通过 device.name 判断是否为我们的目标设备再断开
                            console.log(`[BT] 正在强制断开遗留设备 ${device.deviceId}`);
                            uni.closeBLEConnection({ deviceId: device.deviceId });
                        });
                        // 等待一会，让原生有时间处理断开操作
                        setTimeout(initBlue, 500);
                    } else {
                        // 没有遗留连接，直接开始初始化流程
                        initBlue();
                    }
                },
                fail: () => {
                    // 如果获取列表失败，也直接开始初始化流程，做一层兼容
                    initBlue();
                }
            });
        }
    });
    // #endif
}
