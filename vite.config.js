import { loadEnv, defineConfig } from 'vite';
import path from 'path';
import uni from '@dcloudio/vite-plugin-uni';
// 读取 .env 配置
import dotenv from 'dotenv';
dotenv.config();
export default (command, mode) => {
    const env = loadEnv(mode, __dirname, 'SHOPRO_');
    console.log(env);
    return {
        plugins: [uni({
            vueOptions: {
                template: {
                    compilerOptions: {
                        // 临时注释掉 ZegoExpress 自定义元素处理
                        // isCustomElement: tag => tag.startsWith("ZegoExpress-")
                    }
                }
            }
        })],
        resolve: {
            alias: {
                // 将 @ 指向项目根目录，兼容现有 '@/sheep/...' 等路径
                '@': path.resolve(__dirname)
            }
        },
        server: {
            port: env.SHOPRO_DEV_PORT || 3000, // 从 .env 文件中读取 VITE_PORT，默认是 3000
            open: false, // 启动时自动打开浏览器
        },
        host: true,
        hmr: {
            overlay: true,
        },
        define: {
            // 将环境变量注入到应用中
            'process.env': env,
        },
        // 优化构建配置以减少产物体积
        build: {
            // 减少内联资源的大小限制（避免把较大资源内联进 JS）
            assetsInlineLimit: 4096,
            // 使用 esbuild 丢弃调试代码，显著减小体积
            minify: 'esbuild',
            esbuild: {
                drop: ['console', 'debugger']
            },
            // 设置更大的 chunk 大小警告限制
            chunkSizeWarningLimit: 1000
        },
        // 优化依赖预构建
        optimizeDeps: {
            include: ['dayjs', 'lodash-es', 'luch-request'],
            // exclude: ['zego-zim-web']  // 临时注释掉
        }
    };
}
