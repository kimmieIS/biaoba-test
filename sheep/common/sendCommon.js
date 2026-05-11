import {preventDuplicateClick} from '@/sheep/common/util';
import email from '@/sheep/api/dart/email';
import {getMessage} from '@/sheep/common/msgCommon';
import {showToast} from "@/sheep/util/toast";
import {validateEmail} from "@/sheep/util/emailUtil.js"

// 发送邮箱短信，后续考虑是否缓存
const sendCode = preventDuplicateClick(async (state, t) => {
    if (state.countdown > 0) {
        return;
    }

    // 使用传入的 t 函数进行翻译
    if (!state.email) {
        showToast({message: t('email_required'), icon: 'none'});
        return;
    }
	
	let flag=validateEmail(state.email);
	console.log("邮箱为："+state.email+"-------邮箱校验为："+flag) 
	if(!flag){
		showToast({message: t('mailbox_is_incorrectly_formatted'), icon: 'none'});
		return;
	}

    await email.Api.sendEmailCode(state.email,state.type);

    showToast({message: t('code_sent_successfully'), icon: 'success'});
    state.countdown = 60;

    state.timer = setInterval(() => {
        if (state.countdown > 0) {
            state.countdown -= 1;
        } else {
            clearInterval(state.timer);
        }
    }, 1000);
});

export default {
    sendCode,
};