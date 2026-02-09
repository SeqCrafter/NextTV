"use client";

import { useState, useEffect, useRef } from "react";
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
  MaterialSymbolsCheckRounded,
  MaterialSymbolsExpandMoreRounded,
  MaterialSymbolsChevronRightRounded
} from "@/components/icons";

const SourceItem = ({
  source,
  type,
  index,
  totalCount,
  toggleSource,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const canMoveUp = index > 0;
  const canMoveDown = index < totalCount - 1;

  return (
    <div
      className={`group flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-white border rounded-2xl hover:shadow-card transition-all duration-200 gap-3 md:gap-4 ${source.enabled
        ? "border-blue-100 hover:border-blue-200"
        : "border-gray-100 hover:border-gray-200"
        }`}
    >
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0 overflow-hidden">
        <div className="relative inline-block w-12 shrink-0 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            name={`toggle-${source.id}`}
            id={`toggle-${source.id}`}
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-200 border-gray-300 top-0"
            style={{
              left: source.enabled ? "24px" : "0px",
              borderColor: source.enabled ? "#FAC638" : "#D1D5DB",
            }}
            checked={source.enabled}
            onChange={() => toggleSource(source.id, type)}
          />
          <label
            htmlFor={`toggle-${source.id}`}
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${source.enabled ? "bg-primary" : "bg-gray-300"
              }`}
          ></label>
        </div>
        <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
          <span className="font-bold text-gray-900 text-sm md:text-lg truncate">
            {source.name}
          </span>
          <span className="text-xs md:text-sm text-gray-500 truncate font-mono">
            {source.url}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-2 md:pl-4 justify-end md:justify-start shrink-0">
        <button
          onClick={() => onMoveUp(source.id)}
          disabled={!canMoveUp}
          className={`min-h-[44px] w-10 md:w-auto p-2 rounded-full transition-all duration-300 ${canMoveUp
            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            : "text-gray-200 cursor-not-allowed"
            }`}
          aria-label="向上移动"
        >
          <MaterialSymbolsArrowUpwardRounded className="text-[18px] md:text-[20px]" />
        </button>
        <button
          onClick={() => onMoveDown(source.id)}
          disabled={!canMoveDown}
          className={`min-h-[44px] w-10 md:w-auto p-2 rounded-full transition-all duration-300 ${canMoveDown
            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            : "text-gray-200 cursor-not-allowed"
            }`}
          aria-label="向下移动"
        >
          <MaterialSymbolsArrowDownwardRounded className="text-[18px] md:text-[20px]" />
        </button>
        <button
          onClick={() => onEdit(source)}
          className="min-h-[44px] w-10 md:w-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 cursor-pointer"
          aria-label="编辑"
        >
          <MaterialSymbolsEditSquareOutline className="text-[18px] md:text-[20px]" />
        </button>
        <button
          onClick={() => onDelete(source.id)}
          className="min-h-[44px] w-10 md:w-auto p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300 cursor-pointer"
          aria-label="删除"
        >
          <MaterialSymbolsDeleteOutlineRounded className="text-[18px] md:text-[20px]" />
        </button>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timers = [];

    if (isOpen) {
      // 使用 setTimeout 避免同步 setState
      timers.push(setTimeout(() => setShouldRender(true), 0));
      // 延迟一帧后开始动画
      timers.push(setTimeout(() => setIsAnimating(true), 20));
    } else {
      // 先开始退出动画
      timers.push(setTimeout(() => setIsAnimating(false), 0));
      // 等待动画完成后卸载
      timers.push(setTimeout(() => setShouldRender(false), 300));
    }

    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out ${isAnimating ? "opacity-100" : "opacity-0"
        }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out ${isAnimating
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 translate-y-4"
          }`}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MaterialSymbolsCloseRounded />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Custom Select Component
const CustomSelect = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${isOpen ? "ring-2 ring-primary/20 border-primary bg-white" : "hover:bg-gray-100 hover:border-gray-300"
          }`}
      >
        <span className="truncate mr-2 font-medium">{selectedOption.label}</span>
        <MaterialSymbolsExpandMoreRounded
          className={`text-gray-500 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180 text-primary" : ""
            }`}
        />
      </button>

      <div
        className={`absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-200 ease-out origin-top ${isOpen
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
      >
        <div className="max-h-60 overflow-y-auto py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${option.value === value
                ? "bg-primary/5 text-primary font-semibold"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <MaterialSymbolsCheckRounded className="text-[18px]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
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

  // Handle export
  const handleExport = () => {
    const data = exportSettings();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streambox-settings-${new Date().toISOString().split("T")[0]
      }.json`;
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
  const filteredVideoSources = videoSources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchVideo.toLowerCase()) ||
      source.url.toLowerCase().includes(searchVideo.toLowerCase())
  );

  const filteredDanmakuSources = danmakuSources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchDanmaku.toLowerCase()) ||
      source.url.toLowerCase().includes(searchDanmaku.toLowerCase())
  );

  const doubanProxyOptions = [
    { value: "https://movie.douban.com", label: "直连 (movie.douban.com)" },
    { value: "https://movie.douban.cmliussss.net", label: "腾讯云 CDN (cmliussss.net)" },
    { value: "https://movie.douban.cmliussss.com", label: "阿里云 CDN (cmliussss.com)" },
  ];

  const doubanImageProxyOptions = [
    { value: "server", label: "服务器转发 (推荐)" },
    { value: "img.doubanio.cmliussss.net", label: "腾讯云 CDN (cmliussss.net)" },
    { value: "img.doubanio.cmliussss.com", label: "阿里云 CDN (cmliussss.com)" },
  ];


  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Video Sources */}
      <section className="bg-white rounded-2xl shadow-soft p-4 md:p-8 mt-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">视频源管理</h2>
            <p className="text-gray-500 mt-1">
              管理视频来源，调整优先级和启用状态
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => resetToDefaults("video")}
              className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
            >
              恢复默认
            </button>
            <button
              onClick={() => openVideoModal()}
              className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MaterialSymbolsAdd className="text-sm font-bold" />
              添加源
            </button>
          </div>
        </div>
        <div className="relative mt-6 mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MaterialSymbolsSearchRounded className="text-gray-400" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-shadow"
            placeholder="搜索源..."
            type="text"
            value={searchVideo}
            onChange={(e) => setSearchVideo(e.target.value)}
          />
        </div>
        <div className="space-y-4">
          {filteredVideoSources.map((source, index) => (
            <SourceItem
              key={source.id}
              source={source}
              type="video"
              index={index}
              totalCount={filteredVideoSources.length}
              toggleSource={toggleSource}
              onEdit={openVideoModal}
              onDelete={(id) => handleDelete(id, "video")}
              onMoveUp={(id) => moveSource(id, "up", "video")}
              onMoveDown={(id) => moveSource(id, "down", "video")}
            />
          ))}
        </div>
      </section>

      {/* Douban Configuration */}
      <section className="bg-white rounded-2xl shadow-soft p-4 md:p-8 mt-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">豆瓣配置</h2>
            <p className="text-gray-500 mt-1">配置豆瓣 API 和图片代理以防止连接问题</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">豆瓣 API 代理</label>
            <CustomSelect
              value={doubanProxy}
              onChange={setDoubanProxy}
              options={doubanProxyOptions}
              label="豆瓣 API 代理"
            />
            <p className="text-xs text-gray-500">选择用于获取豆瓣数据的接口地址</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">豆瓣图片代理</label>
            <CustomSelect
              value={doubanImageProxy}
              onChange={setDoubanImageProxy}
              options={doubanImageProxyOptions}
              label="豆瓣图片代理"
            />
            <p className="text-xs text-gray-500">选择用于加载电影海报的图片代理</p>
          </div>
        </div>
      </section>

      {/* Danmaku Sources */}
      <section className="bg-white rounded-2xl shadow-soft p-4 md:p-8 mt-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">弹幕源管理</h2>
            <p className="text-gray-500 mt-1">配置弹幕接口，丰富观影体验（最多支持 1 个弹幕源）</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => resetToDefaults("danmaku")}
              className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
            >
              恢复默认
            </button>
            <button
              onClick={() => openDanmakuModal()}
              className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MaterialSymbolsAdd className="text-sm font-bold" />
              添加源
            </button>
          </div>
        </div>
        <div className="relative mt-6 mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MaterialSymbolsSearchRounded className="text-gray-400" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-shadow"
            placeholder="搜索弹幕源..."
            type="text"
            value={searchDanmaku}
            onChange={(e) => setSearchDanmaku(e.target.value)}
          />
        </div>
        <div className="space-y-4">
          {filteredDanmakuSources.map((source, index) => (
            <SourceItem
              key={source.id}
              source={source}
              type="danmaku"
              index={index}
              totalCount={filteredDanmakuSources.length}
              toggleSource={toggleSource}
              onEdit={openDanmakuModal}
              onDelete={(id) => handleDelete(id, "danmaku")}
              onMoveUp={(id) => moveSource(id, "up", "danmaku")}
              onMoveDown={(id) => moveSource(id, "down", "danmaku")}
            />
          ))}
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white rounded-2xl shadow-soft p-4 md:p-8 mt-8 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">数据管理</h2>
          <p className="text-gray-500 mt-1">
            导入或导出您的所有设置、源和播放历史
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={handleImport}
            className="group flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:border-primary hover:shadow-card hover:ring-1 hover:ring-primary/20 transition-all duration-300 text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <MaterialSymbolsUploadFileOutlineRounded className="text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">导入配置</h3>
                <p className="text-sm text-gray-500 mt-1">
                  从 JSON 文件恢复数据
                </p>
              </div>
            </div>
            <MaterialSymbolsChevronRightRounded className="text-gray-400 group-hover:text-primary transition-all duration-300" />
          </button>
          <button
            onClick={handleExport}
            className="group flex items-center justify-between p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:border-primary hover:shadow-card hover:ring-1 hover:ring-primary/20 transition-all duration-300 text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <MaterialSymbolsDownload2Outline className="text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">导出配置</h3>
                <p className="text-sm text-gray-500 mt-1">备份当前数据到本地</p>
              </div>
            </div>
            <MaterialSymbolsChevronRightRounded className="text-gray-400 group-hover:text-primary transition-all duration-300" />
          </button>
        </div>
      </section>

      {/* Video Source Modal */}
      <Modal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title={editingSource ? "编辑视频源" : "添加视频源"}
      >
        <form onSubmit={handleVideoSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="例如：资源站A"
              value={videoForm.name}
              onChange={(e) =>
                setVideoForm({ ...videoForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="例如：source_a"
              value={videoForm.key}
              onChange={(e) =>
                setVideoForm({ ...videoForm, key: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              type="url"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://api.example.com/vod"
              value={videoForm.url}
              onChange={(e) =>
                setVideoForm({ ...videoForm, url: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="可选的描述信息"
              rows="3"
              value={videoForm.description}
              onChange={(e) =>
                setVideoForm({ ...videoForm, description: e.target.value })
              }
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {editingSource ? "保存" : "添加"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Danmaku Source Modal */}
      <Modal
        isOpen={showDanmakuModal}
        onClose={() => setShowDanmakuModal(false)}
        title={editingSource ? "编辑弹幕源" : "添加弹幕源"}
      >
        <form onSubmit={handleDanmakuSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="例如：弹幕库A"
              value={danmakuForm.name}
              onChange={(e) =>
                setDanmakuForm({ ...danmakuForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              type="url"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://api.example.com/danmaku"
              value={danmakuForm.url}
              onChange={(e) =>
                setDanmakuForm({ ...danmakuForm, url: e.target.value })
              }
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowDanmakuModal(false)}
              className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {editingSource ? "保存" : "添加"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
