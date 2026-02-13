export const ItemTypes = {
  MOVIE: "movie",
  TV: "tv",
};

export const DEFAULT_VIDEO_SOURCES = [
  {
    id: "1",
    name: "如意资源",
    key: "rycj",
    url: "https://cj.rycjapi.com/api.php/provide/vod",
    enabled: true,
    type: "video",
  },
  {
    id: "2",
    name: "旺旺短剧",
    key: "wwdj",
    url: "https://api.wwzy.tv/api.php/provide/vod",
    enabled: true,
    type: "video",
  },
];

export const DEFAULT_DANMAKU_SOURCES = [];
