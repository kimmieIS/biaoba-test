// 开发环境配置
export let baseUrl;
export let version;
if (process.env.NODE_ENV === 'development') {
  baseUrl = process.env.SHOPRO_DEV_BASE_URL;
} else {
  baseUrl = process.env.SHOPRO_BASE_URL;
}
version = process.env.SHOPRO_VERSION;
console.log(`个人模版 [${version}]  http://doc.iocoder.cn`);

export const apiPath = process.env.SHOPRO_API_PATH;
export const staticUrl = process.env.SHOPRO_STATIC_URL;
export const tenantId = process.env.SHOPRO_TENANT_ID;
export const websocketPath = process.env.SHOPRO_WEBSOCKET_PATH;

export default {
  baseUrl,
  apiPath,
  staticUrl,
  tenantId,
  websocketPath,
};
