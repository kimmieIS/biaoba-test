import request from '@/sheep/request';
import {ENDPOINTS, MODULES} from '@/sheep/api/enum/Common';

const PlayerApi = `${MODULES.COMMON}${ENDPOINTS.EMAIL}`;
export default {
    // 发送邮箱验证码
    Api: {
        sendEmailCode: (email,type) =>
            request({
                url: `${PlayerApi}/send-email-code`,
                method: 'POST',
                data: {
                    email: email,
                    type: type,
                }
            }),
    },
};
