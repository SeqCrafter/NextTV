# NextTV

<div align="center">
  <img src="./public/logo.png" alt="NextTV Logo" width="50" height="50" />

  <p><strong>现代化的视频流媒体播放平台</strong></p>

  <p>
    一个功能丰富的视频流媒体应用，支持多源搜索、智能播放、弹幕互动和历史记录管理
  </p>
</div>

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2.3-61dafb?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.18-38bdf8?logo=tailwindcss)
![ArtPlayer](https://img.shields.io/badge/ArtPlayer-5.3.0-ff6b6b)
![HLS.js](https://img.shields.io/badge/HLS.js-1.6.15-ec407a)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)

</div>

---

## 特性

- 🎬 **多源视频搜索** - 支持自定义多个视频源 API，聚合搜索电影和电视剧
- 🎬 **预测速** - 支持自定义多个视频源 API，聚合搜索电影和电视剧
- 🎥 **高级播放器** - 基于 Artplayer，支持 HLS/M3U8 流媒体播放
- 💬 **弹幕系统** - 实时弹幕显示，支持多个弹幕源配置
- 🚀 **去广告功能** - 自动过滤 M3U8 流中的广告片段
- ⏭️ **智能跳过** - 自动跳过片头片尾，可自定义跳过时间点
- 📝 **播放历史** - 自动保存观看进度，随时继续观看
- ⭐ **收藏管理** - 收藏喜爱的视频，方便快速访问
- 🎯 **豆瓣推荐** - 集成豆瓣 API，展示热门和高分影视内容
- 🎯 **红果短剧推荐** - 基于红果短剧数据，展示热门和高分短剧内容
- 🔗 **自定义豆瓣代理** - 自定义豆瓣 API 代理和图片代理，防止连接问题
- ⚙️ **灵活配置** - 可视化管理视频源和弹幕源，支持导入导出
- ⌨️ **快捷键支持** - 丰富的键盘快捷键，提升观看体验
- 🔔 **首页剧集更新提醒** - 首页继续观看区域展示剧集更新提醒

---

<details>
  <summary>点击查看项目截图</summary>
  <img src="https://tncache1-f1.v3mh.com/image/2026/01/16/3c7155e313df3bdae29b66815a42b3db.png" alt="主页截图" style="max-width:600px">
  <img src="https://tncache1-f1.v3mh.com/image/2026/01/16/778e5b27c569b953924f7c803d788e83.png" alt="搜索截图" style="max-width:600px">
  <img src="https://tncache1-f1.v3mh.com/image/2026/01/16/0d13d14d462d7c9d7cb250e072f1fdea.png" alt="播放截图" style="max-width:600px">
  <img src="https://tncache1-f1.v3mh.com/image/2026/01/16/fc1aaa5124285bf4d02fc8df8193821c.png" alt="设置截图" style="max-width:600px">
</details>

---

---

### 重要说明：

- **本项目为空壳播放器，自带唯一播放源不稳定，仅供学习使用，请自行更换播放源**
- **本项目不添加用户登录以及认证功能**
- **本项目完全由 Claude Code 生成，仅作为学习参考，请勿用于商业用途**

---

## 技术栈

### 核心框架

- **Next.js** 16.1.1 - React 服务端渲染框架
- **React** 19.2.3 - 用户界面构建库
- **Tailwind CSS** 4.1.18 - 现代化 CSS 框架

### 播放器相关

- **Artplayer** 5.3.0 - 功能丰富的 HTML5 视频播放器
- **HLS.js** 1.6.15 - HTTP Live Streaming 支持
- **artplayer-plugin-danmuku** 5.2.0 - 弹幕插件

### 状态管理

- **Zustand** 5.0.10 - 轻量级状态管理库

---

## 快速开始

### 前置要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/NextTV.git
cd NextTV

# 安装依赖
bun install

# 启动开发服务器
bun dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
# 构建项目
bun run build

# 启动生产服务器
bun start
```

---

## 主要功能

### 1. 视频搜索

- 支持多个视频源聚合搜索
- 分页浏览搜索结果
- 展示视频封面、标题和简介

### 2. 视频播放

- **HLS 流媒体支持**：原生 HLS 和 HLS.js 自动降级
- **自动去广告**：通过过滤 M3U8 中的 `#EXT-X-DISCONTINUITY` 标签去除广告
- **片头片尾跳过**：可配置自动跳过的起止时间
- **剧集切换**：上一集/下一集快速切换
- **进度保存**：自动保存播放进度（每 5 秒）
- **弹幕显示**：实时加载和显示弹幕评论

### 3. 如何设置弹幕播放源

请基于以上两个项目自行搭建弹幕源：

- [danmu_api](https://github.com/SeqCrafter/danmu_api)
- [fetch_danmu](https://github.com/SeqCrafter/fetch_danmu)

两个项目的请求参数完全一致，大概是这样：

```
https://<搭建地址>/api/douban?douban_id=36481469&episode_number=1
```

或者对于`danmu_api`来说

```
https://<搭建地址>/{token}/api/v2/douban?douban_id=36481469&episode_number=1
```

在 NextTV 的设置中，弹幕源应该为`?`之前的地址，例如：

```
https://<搭建地址>/api/douban
```

或者

```
https://<搭建地址>/{token}/api/v2/douban
```

### 4. 播放历史

- 自动记录观看历史（最多 20 条）
- 显示观看进度和剧集信息
- 快速跳转到历史记录
- 支持删除单条或清空全部历史

### 5. 收藏管理

- 收藏喜爱的影视作品
- 查看收藏列表
- 快速访问收藏内容

### 6. 豆瓣推荐

- 首页展示豆瓣热门和高分内容
- 支持按标签筛选（热门、最新、经典、豆瓣高分等）
- 自定义标签管理（添加、编辑、删除）
- 分页浏览推荐内容

### 7. 设置管理

- **视频源管理**：
  - 添加/编辑/删除视频源
  - 启用/禁用视频源
  - 调整源优先级
  - 导入/导出配置

- **弹幕源管理**：
  - 类似视频源的管理功能
  - 支持多个弹幕源配置

---

### 8. 导入导出功能

除了手动添加源外，如果你非要添加大量源，可以使用导入功能，格式如下：

```json
{
  "videoSources": [
    {
      "name": "xx资源",
      "key": "xxxx",
      "url": "https://xxxx/api.php/provide/vod",
      "description": ""
    }
  ],
  "danmakuSources": [
    {
      "name": "xxxx",
      "url": "https://xxxx/api/v2/douban"
    }
  ]
}
```

## 快捷键

播放器支持以下快捷键操作：

| 快捷键    | 功能       |
| --------- | ---------- |
| `空格`    | 播放/暂停  |
| `←`       | 快退 10 秒 |
| `→`       | 快进 10 秒 |
| `Alt + ←` | 上一集     |
| `Alt + →` | 下一集     |
| `↑`       | 增加音量   |
| `↓`       | 减少音量   |
| `F`       | 全屏切换   |

---

## 开发

### 启动开发服务器

```bash
bun dev
```

### 代码检查

```bash
bun run lint
```

### 构建项目

```bash
bun run build
```

---

## 部署方案

### 1. 使用 Vercel 部署

Fork 项目后，点击 Vercel 按钮即可部署。

### 2. 使用 EdgeOne 部署

Fork 项目后，进入 EdgeOne pages 即可部署。

### 3. 其他支持 Next.js 的云函数都可以尝试

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 致谢

- [Artplayer](https://github.com/zhw2590582/ArtPlayer) - 优秀的 HTML5 视频播放器
- [LunaTV](https://github.com/SzeMeng76/LunaTV) - 功能复杂的 Next.js 的播放器
- [LibreTV](https://github.com/LibreSpark/LibreTV) - 简易但不简单的播放器，本项目修改自 LibreTV
- [豆瓣](https://movie.douban.com/) - 提供影视推荐数据
- [CMLiussss](https://github.com/cmliu) - 感谢 CMLiussss 的 douban 代理
- [Next.js](https://nextjs.org/) - React 服务端渲染框架
- [Tailwind CSS](https://tailwindcss.com/) - 现代化 CSS 框架

---

<div align="center">
  <p>Made with ❤️ by Xiaoguang </p>
</div>
