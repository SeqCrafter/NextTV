import Link from "next/link";

export const metadata = {
  title: "帮助中心 - NextTV",
  description: "NextTV 帮助中心，了解如何使用 NextTV 的各项功能",
};

function Section({ id, number, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-sm font-bold shrink-0">{number}</span>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function HelpPage() {
  const navItems = [
    { id: "highlights", label: "网站亮点" },
    { id: "video-source", label: "添加视频源" },
    { id: "danmaku-source", label: "添加弹幕源" },
    { id: "import-export", label: "导入与导出" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto page-enter">
      {/* Header */}
      <div className="text-center mt-8 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">帮助中心</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">了解 NextTV 的核心功能与使用方法</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-wrap justify-center gap-2 mb-10">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Content */}
      <div className="space-y-12">
        {/* Section 1: Highlights */}
        <Section id="highlights" number="1" title="网站亮点">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "HLS 流媒体播放",
                desc: "基于 Artplayer 和 HLS.js 的专业播放器，流畅播放 M3U8 格式视频，支持倍速、画中画等功能。",
              },
              {
                title: "实时弹幕系统",
                desc: "集成logvar弹幕功能，支持自定义弹幕源，让你在观影时也能感受社区互动的乐趣。",
              },
              {
                title: "豆瓣红果推荐集成",
                desc: "首页展示豆瓣热门推荐，红果短剧热门推荐，帮助你发现热门好片，不再为找片发愁。",
              },
              {
                title: "豆瓣演员表集成",
                desc: "根据豆瓣ID自动从豆瓣匹配演员表，并在详情页展示演员头像。",
              },
              {
                title: "播放进度记忆",
                desc: "自动保存播放进度和历史记录，下次打开直接从上次的位置继续观看。",
              },
              {
                title: "视频更新提醒",
                desc: "网站首页会自动追踪观看记录中的视频是否有更新，并在最下方的记录卡片右上角展示更新标记。",
              },
            ].map((item) => (
              <div key={item.title} className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-card transition-shadow">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 2: Add Video Source */}
        <Section id="video-source" number="2" title="如何添加视频源">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
            <p className="text-gray-600 leading-relaxed">视频源是 NextTV 搜索和播放视频的数据来源。你可以添加兼容 CMS 接口的资源站来扩展可搜索的内容范围。</p>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">操作步骤</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-600">
                <li>
                  进入{" "}
                  <Link href="/settings" className="text-amber-600 hover:text-amber-700 underline underline-offset-2">
                    设置页面
                  </Link>
                  ，找到「视频源管理」区域。
                </li>
                <li>点击右上角的「添加源」按钮。</li>
                <li>
                  在弹出的表单中填写以下信息：
                  <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-sm text-gray-500">
                    <li>
                      <strong className="text-gray-700">名称</strong> — 自定义名称，方便识别(自定义)。
                    </li>
                    <li>
                      <strong className="text-gray-700">Key</strong> — 唯一标识符，建议使用英文字母和下划线(自定义)。
                    </li>
                    <li>
                      <strong className="text-gray-700">URL</strong> — 资源站的 API 地址，通常以 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/api.php/provide/vod</code>{" "}
                      结尾。
                    </li>
                  </ul>
                </li>
                <li>点击「添加」即可完成。</li>
                <li>
                  你可以通过此GitHub仓库寻找播放源：
                  <a
                    href="https://github.com/hafrey1/LunaTV-config"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 underline underline-offset-2 after:content-['_↗']"
                  >
                    hafrey1/LunaTV-config
                  </a>
                </li>
              </ol>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>提示：</strong>
                你可以通过拖拽箭头调整视频源的优先级顺序，搜索时排在前面的源会优先展示结果。通过开关可以临时禁用某个源而不删除它。
              </p>
            </div>
          </div>
        </Section>

        {/* Section 3: Add Danmaku Source */}
        <Section id="danmaku-source" number="3" title="如何添加弹幕源">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
            <p className="text-gray-600 leading-relaxed">弹幕源提供视频播放时的实时弹幕数据。目前 NextTV 支持配置一个弹幕源。本项目调取弹幕采用客户端直接流式获取，未经过服务器代理。</p>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">操作步骤</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-600">
                <li>
                  进入{" "}
                  <Link href="/settings" className="text-amber-600 hover:text-amber-700 underline underline-offset-2">
                    设置页面
                  </Link>
                  ，找到「弹幕源管理」区域。
                </li>
                <li>点击「添加源」按钮。</li>
                <li>填写弹幕源的名称和 API 地址。</li>
                <li>保存后，在播放视频时弹幕会自动加载。</li>
                <li>弹幕源需自建，参照下列步骤自行搭建：</li>
              </ol>
              <h3 className="font-bold text-gray-900">弹幕源搭建</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-600">
                <li>
                  项目采用LogVar弹幕系统，打开项目仓库：
                  <a
                    href="https://github.com/SeqCrafter/danmu_api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 underline underline-offset-2 after:content-['_↗']"
                  >
                    SeqCrafter/danmu_api
                  </a>
                </li>
                <li>Fork该项目，并打开Vercel或者Netlify进行部署。</li>
                <li>建议设置以下环境变量：</li>
                <ul className="list-disc list-inside ml-5 mt-2 space-y-1 text-sm text-gray-500">
                  <li>
                    <strong className="text-gray-700">CONVERT_COLOR</strong> — 可以随机为弹幕生成颜色
                  </li>
                  <li>
                    <strong className="text-gray-700">DANMU_LIMIT</strong> — 随机取样限制弹幕数量，弹幕数太多会爆炸
                  </li>
                  <li>
                    <strong className="text-gray-700">ENABLE_EPISODE_FILTER</strong> — 避免抓取到错误链接
                  </li>
                </ul>
                <li>
                  部署完成后，你需要填入的API地址的样子大概为
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                    https://{"{"}your project name{"}"}.netlify.app/{"{"}token{"}"}/api/v2/douban
                  </code>
                  ，其中your project name为你部署的项目的名字，token为你设置的环境变量中的LOGVAR_TOKEN。
                </li>
              </ol>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>注意：</strong>
                目前仅支持添加一个弹幕源。如需更换，请先删除现有弹幕源再添加新的。你也可以在播放页面直接开关弹幕显示。
              </p>
            </div>
          </div>
        </Section>

        {/* Section 4: Import & Export */}
        <Section id="import-export" number="4" title="如何导入与导出">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
            <p className="text-gray-600 leading-relaxed">NextTV 支持将所有配置（包括视频源、弹幕源、豆瓣代理设置等）导出为 JSON 文件，方便备份和迁移到其他设备。</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">导出配置</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>
                    进入{" "}
                    <Link href="/settings" className="text-amber-600 hover:text-amber-700 underline underline-offset-2">
                      设置页面
                    </Link>
                    。
                  </li>
                  <li>滚动到「数据管理」区域。</li>
                  <li>点击「导出配置」按钮。</li>
                  <li>浏览器会自动下载一个 JSON 文件，文件名包含当前日期。</li>
                </ol>
              </div>

              {/* Import */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">导入配置</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>
                    进入{" "}
                    <Link href="/settings" className="text-amber-600 hover:text-amber-700 underline underline-offset-2">
                      设置页面
                    </Link>
                    。
                  </li>
                  <li>滚动到「数据管理」区域。</li>
                  <li>点击「导入配置」按钮。</li>
                  <li>选择之前导出的 JSON 文件，配置会自动恢复。</li>
                </ol>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>提示：</strong>
                导入时支持批量添加视频源。你可以手动编辑 JSON 文件来批量配置多个视频源，然后一次性导入。导入操作会合并现有配置而非覆盖。导入格式请前往github仓库查看。
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-14 mb-8 p-8 bg-white border border-gray-100 rounded-2xl">
        <p className="text-gray-600 mb-4">还有其他问题？欢迎联系我们或提交 Issue。</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href="mailto:sdupan2015@gmail.com" className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            联系作者
          </a>
          <a
            href="https://github.com/SeqCrafter/NextTV/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            提交 Issue
          </a>
        </div>
      </div>
    </div>
  );
}
