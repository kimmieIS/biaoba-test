import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';


export const PlayerApi = `${MODULES.DART}${ENDPOINTS.GRADE}`;
export default {
    PlayerApi : `${MODULES.DART}${ENDPOINTS.GRADE}`,
    // 玩家相关接口
    Api: {
        // 通过玩家id获取玩家生涯数据
        getAllGrade: (payerId) =>
            request({
                url: `${PlayerApi}/findAllGrade`,
                method: 'GET',
            })
    },
};
