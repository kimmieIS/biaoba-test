import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

const PlayerApi = `${MODULES.DART}${ENDPOINTS.NOTICE}`;
export default {
    // 获取消息列表
    Api: {
        getNoticeList: (email,type) =>
            request({
                url: `${PlayerApi}/list`,
                method: 'GET'
            }),
        view: (noticeId) =>
            request({
                url: `${PlayerApi}/view/`+noticeId,
                method: 'GET'
            }),
    },

};
