"use client";

import { useId, useState } from "react";
import { AnimatedDialog } from "@/components/AnimatedDialog";
import { Select } from "@/components/Select";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  MaterialSymbolsArrowUpwardRounded,
  MaterialSymbolsArrowDownwardRounded,
  MaterialSymbolsEditSquareOutline,
  MaterialSymbolsDeleteOutlineRounded,
  MaterialSymbolsAdd,
  MaterialSymbolsSearchRounded,
  MaterialSymbolsUploadFileOutlineRounded,
  MaterialSymbolsDownload2Outline,
  MaterialSymbolsCloseRounded,
} from "@/components/icons";

const fieldClassName = "min-h-11 w-full rounded-lg border border-line bg-background-light px-3 py-2 text-base text-ink placeholder:text-muted focus:bg-surface-light focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light";

const SourceItem = ({ source, type, index, totalCount, toggleSource, onEdit, onDelete, onMoveUp, onMoveDown }) => {
  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;
  const sourceType = type === "video" ? "视频源" : "弹幕源";
  const toggleId = `toggle-${type}-${source.id}`;

  return (
    <li className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:gap-4 sm:py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold text-ink sm:text-base" title={source.name}>{source.name}</span>
          <span className={`shrink-0 text-xs ${source.enabled ? "text-primary-dark" : "text-muted"}`}>
            {source.enabled ? "已启用" : "已停用"}
          </span>
        </div>
        <p className="truncate font-mono text-xs leading-5 text-muted" title={source.url}>{source.url}</p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 sm:gap-4">
        <label htmlFor={toggleId} className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            role="switch"
            name={toggleId}
            id={toggleId}
            aria-label={`${sourceType} ${source.name}的启用状态`}
            className="peer sr-only"
            checked={source.enabled}
            onChange={() => toggleSource(source.id, type)}
          />
          <span aria-hidden="true" className="relative h-6 w-10 rounded-full bg-line peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-light">
            <span className={`absolute left-1 top-1 size-4 rounded-full bg-surface-light ${source.enabled ? "translate-x-4" : "translate-x-0"}`} />
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMoveUp(source.id)}
            disabled={!canMoveUp}
            className="ui-button ui-icon-button border-0 bg-transparent text-muted enabled:hover:bg-background-light enabled:hover:text-ink"
            aria-label={`上移${sourceType} ${source.name}`}
          >
            <MaterialSymbolsArrowUpwardRounded aria-hidden="true" className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(source.id)}
            disabled={!canMoveDown}
            className="ui-button ui-icon-button border-0 bg-transparent text-muted enabled:hover:bg-background-light enabled:hover:text-ink"
            aria-label={`下移${sourceType} ${source.name}`}
          >
            <MaterialSymbolsArrowDownwardRounded aria-hidden="true" className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(source)}
            className="ui-button ui-icon-button border-0 bg-transparent text-muted hover:bg-background-light hover:text-ink"
            aria-label={`编辑${sourceType} ${source.name}`}
          >
            <MaterialSymbolsEditSquareOutline aria-hidden="true" className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(source.id)}
            className="ui-button ui-icon-button border-0 bg-transparent text-muted hover:bg-background-light hover:text-danger"
            aria-label={`删除${sourceType} ${source.name}`}
          >
            <MaterialSymbolsDeleteOutlineRounded aria-hidden="true" className="text-xl" />
          </button>
        </div>
      </div>
    </li>
  );
};

const Modal = ({ isOpen, onClose, title, initialFocusSelector, children }) => {
  const titleId = useId();

  return (
    <AnimatedDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      initialFocusSelector={initialFocusSelector}
      overlayClassName="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 px-2 pt-4 backdrop-blur-sm sm:items-center sm:p-4"
      className="flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface-light text-ink shadow-soft sm:max-h-[90dvh] sm:rounded-2xl"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
        <h2 id={titleId} className="font-display text-lg font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label={`关闭${title}`} className="ui-button ui-icon-button border-0 bg-transparent text-muted hover:text-ink">
          <MaterialSymbolsCloseRounded aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </AnimatedDialog>
  );
};

export default function Settings() {
  const {
    videoSources,
    danmakuSources,
    toggleSource,
    addSource,
    updateSource,
    removeSource,
    moveSource,
    resetToDefaults,
    exportSettings,
    importSettings,
    doubanProxy,
    doubanImageProxy,
    setDoubanProxy,
    setDoubanImageProxy,
  } = useSettingsStore();

  const [activeSection, setActiveSection] = useState("video");

  // State for modals and forms
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDanmakuModal, setShowDanmakuModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [searchVideo, setSearchVideo] = useState("");
  const [searchDanmaku, setSearchDanmaku] = useState("");

  // Form state for video sources
  const [videoForm, setVideoForm] = useState({
    name: "",
    key: "",
    url: "",
    description: "",
  });

  // Form state for danmaku sources
  const [danmakuForm, setDanmakuForm] = useState({
    name: "",
    url: "",
  });

  // Open add/edit modal
  const openVideoModal = (source = null) => {
    if (source) {
      setEditingSource(source);
      setVideoForm({
        name: source.name || "",
        key: source.key || "",
        url: source.url || "",
        description: source.description || "",
      });
    } else {
      setEditingSource(null);
      setVideoForm({ name: "", key: "", url: "", description: "" });
    }
    setShowVideoModal(true);
  };

  const openDanmakuModal = (source = null) => {
    // 如果是添加新弹幕源（非编辑模式），检查是否已有弹幕源
    if (!source && danmakuSources.length >= 1) {
      alert("目前仅支持添加一个弹幕源，如需更换请先删除现有弹幕源");
      return;
    }
    if (source) {
      setEditingSource(source);
      setDanmakuForm({
        name: source.name || "",
        url: source.url || "",
      });
    } else {
      setEditingSource(null);
      setDanmakuForm({ name: "", url: "" });
    }
    setShowDanmakuModal(true);
  };

  // Handle form submission
  const handleVideoSubmit = (e) => {
    e.preventDefault();
    if (editingSource) {
      updateSource(editingSource.id, videoForm, "video");
    } else {
      addSource(videoForm, "video");
    }
    setShowVideoModal(false);
    setVideoForm({ name: "", key: "", url: "", description: "" });
    setEditingSource(null);
  };

  const handleDanmakuSubmit = (e) => {
    e.preventDefault();
    if (editingSource) {
      updateSource(editingSource.id, danmakuForm, "danmaku");
    } else {
      addSource(danmakuForm, "danmaku");
    }
    setShowDanmakuModal(false);
    setDanmakuForm({ name: "", url: "" });
    setEditingSource(null);
  };

  // Handle delete with confirmation
  const handleDelete = (id, type) => {
    if (window.confirm("确定要删除这个源吗？")) {
      removeSource(id, type);
    }
  };

  const handleReset = (type) => {
    const sourceType = type === "video" ? "视频源" : "弹幕源";
    if (window.confirm(`恢复默认${sourceType}会替换当前${sourceType}列表，确定继续吗？`)) {
      resetToDefaults(type);
    }
  };

  // Handle export
  const handleExport = () => {
    const data = exportSettings();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NextTV-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            importSettings(data);
            alert("配置导入成功！");
          } catch (error) {
            alert("导入失败，请检查文件格式");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Filter sources based on search
  const filteredVideoSources = videoSources.filter((source) => source.name.toLowerCase().includes(searchVideo.toLowerCase()) || source.url.toLowerCase().includes(searchVideo.toLowerCase()));

  const filteredDanmakuSources = danmakuSources.filter((source) => source.name.toLowerCase().includes(searchDanmaku.toLowerCase()) || source.url.toLowerCase().includes(searchDanmaku.toLowerCase()));

  const enabledVideoCount = videoSources.filter((source) => source.enabled).length;
  const enabledDanmakuCount = danmakuSources.filter((source) => source.enabled).length;

  const doubanProxyOptions = [
    { value: "https://movie.douban.com", label: "直连", description: "movie.douban.com" },
    { value: "https://movie.douban.cmliussss.net", label: "腾讯云 CDN", description: "cmliussss.net" },
    { value: "https://movie.douban.cmliussss.com", label: "阿里云 CDN", description: "cmliussss.com" },
  ];

  const doubanImageProxyOptions = [
    { value: "server", label: "服务器转发", description: "推荐，通过本站转发图片" },
    { value: "img.doubanio.cmliussss.net", label: "腾讯云 CDN", description: "cmliussss.net" },
    { value: "img.doubanio.cmliussss.com", label: "阿里云 CDN", description: "cmliussss.com" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl py-4 text-ink sm:py-6">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-2xl font-semibold leading-tight">设置</h1>
        <p className="text-xs leading-5 text-muted" aria-live="polite" aria-atomic="true">
          已启用：视频 {enabledVideoCount} · 弹幕 {enabledDanmakuCount}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[168px_minmax(0,1fr)] md:gap-8">
        <aside className="md:sticky md:top-24 md:self-start">
          <nav aria-label="设置分区" className="grid grid-cols-4 gap-1 md:flex md:flex-col md:gap-2">
            {[
              { id: "video", label: "视频源", shortLabel: "视频源" },
              { id: "douban", label: "豆瓣配置", shortLabel: "豆瓣" },
              { id: "danmaku", label: "弹幕源", shortLabel: "弹幕源" },
              { id: "data", label: "数据管理", shortLabel: "数据" },
            ].map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-label={section.label}
                aria-pressed={activeSection === section.id}
                aria-controls={`settings-${section.id}`}
                className="filter-chip min-w-0 justify-center px-1.5 md:justify-start md:px-3"
              >
                <span className="md:hidden">{section.shortLabel}</span>
                <span className="hidden md:inline">{section.label}</span>
              </button>
            ))}
          </nav>
          <p className="mt-4 hidden text-xs leading-5 text-muted md:block">配置保存在当前浏览器。</p>
        </aside>

        <div className="min-w-0">
          <section id="settings-video" hidden={activeSection !== "video"} aria-labelledby="settings-video-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="settings-video-heading" className="text-lg font-semibold">视频源</h2>
                <p className="mt-1 hidden text-xs text-muted sm:block">调整来源顺序与启用状态。</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => handleReset("video")} className="ui-button" aria-label="恢复默认视频源">
                  恢复默认
                </button>
                <button type="button" onClick={() => openVideoModal()} className="ui-button ui-button-primary" aria-label="添加视频源">
                  <MaterialSymbolsAdd aria-hidden="true" className="text-lg" />
                  添加源
                </button>
              </div>
            </div>
            <div className="relative mb-2 mt-3">
              <label htmlFor="settings-video-search" className="sr-only">按名称或 URL 搜索视频源</label>
              <MaterialSymbolsSearchRounded aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="settings-video-search"
                name="video-source-search"
                className={`${fieldClassName} pl-10`}
                placeholder="搜索名称或 URL"
                type="search"
                value={searchVideo}
                onChange={(e) => setSearchVideo(e.target.value)}
              />
            </div>
            {filteredVideoSources.length > 0 ? (
              <ul className="rounded-xl bg-surface-light" aria-label="视频源列表">
                {filteredVideoSources.map((source) => (
                  <SourceItem
                    key={source.id}
                    source={source}
                    type="video"
                    index={videoSources.indexOf(source)}
                    totalCount={videoSources.length}
                    toggleSource={toggleSource}
                    onEdit={openVideoModal}
                    onDelete={(id) => handleDelete(id, "video")}
                    onMoveUp={(id) => moveSource(id, "up", "video")}
                    onMoveDown={(id) => moveSource(id, "down", "video")}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-xl bg-surface-light px-4 py-8 text-center">
                <p className="text-sm font-medium" role="status">{searchVideo ? "没有匹配的视频源" : "还没有视频源"}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{searchVideo ? "试试其他名称或 URL，或清除搜索。" : "添加视频源，或恢复默认来源。"}</p>
                {searchVideo ? (
                  <button type="button" className="ui-button mt-4" onClick={() => {
                    setSearchVideo("");
                    document.getElementById("settings-video-search")?.focus();
                  }}>清除搜索</button>
                ) : (
                  <button type="button" className="ui-button mt-4" onClick={() => openVideoModal()}>添加视频源</button>
                )}
              </div>
            )}
          </section>

          <section id="settings-douban" hidden={activeSection !== "douban"} aria-labelledby="settings-douban-heading">
            <h2 id="settings-douban-heading" className="text-lg font-semibold">豆瓣配置</h2>
            <p className="mt-1 text-sm text-muted">选择豆瓣内容与海报的访问方式。</p>
            <div className="mt-4 space-y-6 rounded-xl bg-surface-light p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
                <div>
                  <label htmlFor="settings-douban-proxy" className="text-sm font-medium">豆瓣 API 代理</label>
                  <p id="settings-douban-proxy-help" className="mt-1 text-xs leading-5 text-muted">用于获取豆瓣推荐和影片资料。</p>
                </div>
                <Select
                  id="settings-douban-proxy"
                  name="douban-proxy"
                  aria-describedby="settings-douban-proxy-help"
                  value={doubanProxy}
                  options={doubanProxyOptions}
                  onChange={setDoubanProxy}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
                <div>
                  <label htmlFor="settings-douban-image-proxy" className="text-sm font-medium">豆瓣图片代理</label>
                  <p id="settings-douban-image-proxy-help" className="mt-1 text-xs leading-5 text-muted">用于加载豆瓣海报与图片。</p>
                </div>
                <Select
                  id="settings-douban-image-proxy"
                  name="douban-image-proxy"
                  aria-describedby="settings-douban-image-proxy-help"
                  value={doubanImageProxy}
                  options={doubanImageProxyOptions}
                  onChange={setDoubanImageProxy}
                />
              </div>
            </div>
          </section>

          <section id="settings-danmaku" hidden={activeSection !== "danmaku"} aria-labelledby="settings-danmaku-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="settings-danmaku-heading" className="text-lg font-semibold">弹幕源</h2>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => handleReset("danmaku")} className="ui-button" aria-label="恢复默认弹幕源">
                  恢复默认
                </button>
                <button
                  type="button"
                  onClick={() => openDanmakuModal()}
                  disabled={danmakuSources.length >= 1}
                  aria-label="添加弹幕源"
                  aria-describedby="settings-danmaku-limit"
                  className="ui-button ui-button-primary"
                >
                  <MaterialSymbolsAdd aria-hidden="true" className="text-lg" />
                  添加源
                </button>
              </div>
            </div>
            <p id="settings-danmaku-limit" className="mt-2 text-xs leading-5 text-muted">最多 1 个弹幕源，更换前请先删除已有源。</p>
            <div className="relative mb-2 mt-3">
              <label htmlFor="settings-danmaku-search" className="sr-only">按名称或 URL 搜索弹幕源</label>
              <MaterialSymbolsSearchRounded aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="settings-danmaku-search"
                name="danmaku-source-search"
                className={`${fieldClassName} pl-10`}
                placeholder="搜索名称或 URL"
                type="search"
                value={searchDanmaku}
                onChange={(e) => setSearchDanmaku(e.target.value)}
              />
            </div>
            {filteredDanmakuSources.length > 0 ? (
              <ul className="rounded-xl bg-surface-light" aria-label="弹幕源列表">
                {filteredDanmakuSources.map((source) => (
                  <SourceItem
                    key={source.id}
                    source={source}
                    type="danmaku"
                    index={danmakuSources.indexOf(source)}
                    totalCount={danmakuSources.length}
                    toggleSource={toggleSource}
                    onEdit={openDanmakuModal}
                    onDelete={(id) => handleDelete(id, "danmaku")}
                    onMoveUp={(id) => moveSource(id, "up", "danmaku")}
                    onMoveDown={(id) => moveSource(id, "down", "danmaku")}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-xl bg-surface-light px-4 py-8 text-center">
                <p className="text-sm font-medium" role="status">{searchDanmaku ? "没有匹配的弹幕源" : "还没有弹幕源"}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{searchDanmaku ? "试试其他名称或 URL，或清除搜索。" : "可添加一个弹幕接口。"}</p>
                {searchDanmaku ? (
                  <button type="button" className="ui-button mt-4" onClick={() => {
                    setSearchDanmaku("");
                    document.getElementById("settings-danmaku-search")?.focus();
                  }}>清除搜索</button>
                ) : (
                  <button type="button" className="ui-button mt-4" onClick={() => openDanmakuModal()}>添加弹幕源</button>
                )}
              </div>
            )}
          </section>

          <section id="settings-data" hidden={activeSection !== "data"} aria-labelledby="settings-data-heading">
            <h2 id="settings-data-heading" className="text-lg font-semibold">数据管理</h2>
            <p className="mt-1 text-sm text-muted">在浏览器之间迁移视频源与弹幕源。</p>
            <div className="mt-4 space-y-6 rounded-xl bg-surface-light p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">导出源配置</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">下载视频源、弹幕源和导出日期，保存为 JSON 文件。</p>
                </div>
                <button type="button" onClick={handleExport} className="ui-button shrink-0">
                  <MaterialSymbolsDownload2Outline aria-hidden="true" className="text-xl" />
                  导出 JSON
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">导入源配置</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">用 JSON 文件替换当前两类源列表，不会合并。</p>
                  <p className="mt-1 text-xs leading-5 text-muted">导入后会重新启用源，弹幕源仅保留第一个。</p>
                </div>
                <button type="button" onClick={handleImport} className="ui-button shrink-0">
                  <MaterialSymbolsUploadFileOutlineRounded aria-hidden="true" className="text-xl" />
                  导入 JSON
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">仅迁移源列表，不包含豆瓣代理、播放器设置、收藏或播放历史。</p>
          </section>
        </div>
      </div>

      {/* Video Source Modal */}
      <Modal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title={editingSource ? "编辑视频源" : "添加视频源"}
        initialFocusSelector="#settings-video-name"
      >
        <form onSubmit={handleVideoSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div>
              <label htmlFor="settings-video-name" className="mb-1 block text-sm font-medium">名称 *</label>
              <input
                id="settings-video-name"
                name="video-source-name"
                type="text"
                required
                className={fieldClassName}
                placeholder="例如：资源站 A"
                value={videoForm.name}
                onChange={(e) => setVideoForm({ ...videoForm, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="settings-video-key" className="mb-1 block text-sm font-medium">标识 Key *</label>
              <input
                id="settings-video-key"
                name="video-source-key"
                type="text"
                required
                autoCapitalize="none"
                spellCheck={false}
                className={fieldClassName}
                placeholder="例如：source_a"
                value={videoForm.key}
                onChange={(e) => setVideoForm({ ...videoForm, key: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="settings-video-url" className="mb-1 block text-sm font-medium">接口 URL *</label>
              <input
                id="settings-video-url"
                name="video-source-url"
                type="url"
                required
                autoCapitalize="none"
                spellCheck={false}
                className={fieldClassName}
                placeholder="https://api.example.com/vod"
                value={videoForm.url}
                onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="settings-video-description" className="mb-1 block text-sm font-medium">描述</label>
              <textarea
                id="settings-video-description"
                name="video-source-description"
                className={`${fieldClassName} resize-none`}
                placeholder="可选的描述信息"
                rows={3}
                value={videoForm.description}
                onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-3 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            <button type="button" onClick={() => setShowVideoModal(false)} className="ui-button flex-1">取消</button>
            <button type="submit" className="ui-button ui-button-primary flex-1">{editingSource ? "保存" : "添加"}</button>
          </div>
        </form>
      </Modal>

      {/* Danmaku Source Modal */}
      <Modal
        isOpen={showDanmakuModal}
        onClose={() => setShowDanmakuModal(false)}
        title={editingSource ? "编辑弹幕源" : "添加弹幕源"}
        initialFocusSelector="#settings-danmaku-name"
      >
        <form onSubmit={handleDanmakuSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div>
              <label htmlFor="settings-danmaku-name" className="mb-1 block text-sm font-medium">名称 *</label>
              <input
                id="settings-danmaku-name"
                name="danmaku-source-name"
                type="text"
                required
                className={fieldClassName}
                placeholder="例如：弹幕库 A"
                value={danmakuForm.name}
                onChange={(e) => setDanmakuForm({ ...danmakuForm, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="settings-danmaku-url" className="mb-1 block text-sm font-medium">接口 URL *</label>
              <input
                id="settings-danmaku-url"
                name="danmaku-source-url"
                type="url"
                required
                autoCapitalize="none"
                spellCheck={false}
                className={fieldClassName}
                placeholder="https://api.example.com/danmaku"
                value={danmakuForm.url}
                onChange={(e) => setDanmakuForm({ ...danmakuForm, url: e.target.value })}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-3 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            <button type="button" onClick={() => setShowDanmakuModal(false)} className="ui-button flex-1">取消</button>
            <button type="submit" className="ui-button ui-button-primary flex-1">{editingSource ? "保存" : "添加"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
