// 引入 vue-i18n
import {createI18n} from 'vue-i18n'

// 引入语言文件
import zh from '@/lang/zh.json'
import en from '@/lang/en.json'
// 获取或设置默认语言
const getDefaultLocale = () => {
    let locale = uni.getStorageSync("locale");
    if (!locale) {
        // 如果没有设置过语言，默认设置为中文
        locale = 'zh';
        uni.setStorageSync("locale", locale);
    }
    return locale;
}

// 初始化 i18n
const i18n = createI18n({
    locale: getDefaultLocale(), // 默认语言
    fallbackLocale: 'zh', // 备用语言改为中文
    messages: {
        zh,
        en
    }
})
export const setI18n=(app)=>{
    app.use(i18n)
}