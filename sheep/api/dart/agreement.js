import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';


export const PlayerApi = `${MODULES.DART}${ENDPOINTS.AGREEMENT}`;
export default {
    PlayerApi : `${MODULES.DART}${ENDPOINTS.AGREEMENT}`,
    // 玩家相关接口
    Api: {
        // 通过玩家id获取玩家生涯数据
        findById: (agreementId) =>
            request({
                url: `${PlayerApi}/get/`+agreementId,
                method: 'GET',
            })
    },
};
