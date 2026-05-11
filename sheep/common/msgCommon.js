import {useI18n} from "vue-i18n";

export const getMessage = (key, values) => {
    const {t} = useI18n()

    // 获取国际化文本
    let message = t(key)
    // 遍历传入的 values 对象，替换占位符
    for (let [placeholder, replacement] of Object.entries(values)) {
        // 创建一个正则表达式来匹配占位符
        const regex = new RegExp(`\\$\\(${placeholder}\\)`, 'g')
        message = message.replace(regex, replacement)
    }

    return message
}