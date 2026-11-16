export const ItemTypes = {
  MOVIE: "movie",
  TV: "tv",
};

export const DEFAULT_VIDEO_SOURCES = [
  {
    id: "1",
    name: "电影天堂",
    key: "dytt",
    url: "https://caiji.dyttzyapi.com/api.php/provide/vod",
    enabled: true,
    type: "video",
  },
  {
    id: "2",
    name: "天涯资源",
    key: "tyzy",
    url: "https://ty.tyyszy5.com/api.php/provide/vod/",
    enabled: true,
    type: "video",
  },
  {
    id: "3",
    name: "如意云",
    key: "ryzy",
    url: "https://cj.rycjapi.com/api.php/provide/vod",
    enabled: true,
    type: "video",
  },
  {
    name: "魔都短剧",
    key: "mmdj",
    url: "https://www.mdzyapi.com/api.php/provide/vod/",
    description: "",
    id: "1792033479647",
    enabled: true,
  },
];

export const DEFAULT_DANMAKU_SOURCES = [];
