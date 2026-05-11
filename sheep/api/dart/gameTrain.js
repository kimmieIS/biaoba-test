import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

export const PlayerApi = `${MODULES.DART}${ENDPOINTS.GAMETRAIN}`;

export default {
    PlayerApi : `${MODULES.DART}${ENDPOINTS.GAMETRAIN}`,
    // 玩家相关接口
    Api: {
        // 获取玩家训练模式数据
        getList: (payerId) =>
            request({
                url: `${PlayerApi}/list?playerId=`+payerId,
                method: 'GET',
            }),
        // 保存训练模式数据
        postCreate: (formData) => {
            return request({
                url: `${PlayerApi}/create`,
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                data: formData,
            })
        }
    },
};
