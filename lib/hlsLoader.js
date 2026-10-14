// 自定义 HLS 加载器单独成文件，避免 lib/util 的轻量工具函数把 hls.js 带进非播放页面的包里
import Hls from "hls.js";
import { filterAdsFromM3U8 } from "@/lib/util";

export class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
  constructor(config) {
    super(config);
    const load = this.load.bind(this);
    this.load = function (context, config, callbacks) {
      // 拦截manifest和level请求
      if (context.type === "manifest" || context.type === "level") {
        const onSuccess = callbacks.onSuccess;
        callbacks.onSuccess = function (response, stats, context) {
          // 如果是m3u8文件，处理内容以移除广告分段
          if (response.data && typeof response.data === "string") {
            // 过滤掉广告段 - 实现更精确的广告过滤逻辑
            response.data = filterAdsFromM3U8(response.data);
          }
          return onSuccess(response, stats, context, null);
        };
      }
      // 执行原始load方法
      load(context, config, callbacks);
    };
  }
}