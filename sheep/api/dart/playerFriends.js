import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

export const PlayerApi = `${MODULES.DART}${ENDPOINTS.PLAYERFRIENDS}`;

export default {
    PlayerApi : `${MODULES.DART}${ENDPOINTS.PLAYERFRIENDS}`,
    // 玩家相关接口
    Api: {
        // 申请添加玩家好友
        postCreate: (formData) =>
            request({
                url: `${PlayerApi}/create`,
                method: 'POST',
				headers: {
				    'Content-Type': 'multipart/form-data'
				},
				data: formData,
            }),
        // 获取好友列表
        getList: (data) =>
            request({
                url: `${PlayerApi}/list`,
                method: 'GET',
                data,
            }),
		agreeOrRefuse: (data) =>
		    request({
		        url: `${PlayerApi}/agreeOrRefuse`,
		        method: 'POST',
				headers: {
				    'Content-Type': 'multipart/form-data'
				},
		       data: data,
		    }),
		
		
		
    },
};
