import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

const PlayerApi = `${MODULES.DART}${ENDPOINTS.MATCH}`;
export default {
   
    Api: {
		 // 加入匹配
        joinMatch: (data) =>
            request({
                url: `${PlayerApi}/joinMatch`,
                method: 'POST',
                data: data
            }),
		 // 查询用户是否匹配到人
		queryMatch: (data) =>
		    request({
		        url: `${PlayerApi}/queryMatch`,
		        method: 'POST',
				headers: {
				    'Content-Type': 'multipart/form-data'
				},
		        data: data
		    }),
		// 取消匹配
		cancelMatch: (data) =>
		    request({
		        url: `${PlayerApi}/cancelMatch`,
		        method: 'POST',
		        data: data
		    }),
    },
};
