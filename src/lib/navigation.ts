export type ProductNavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: "inbox" | "target" | "review" | "connector" | "settings";
};

export const productNavigation: ProductNavigationItem[] = [
  {
    href: "/resources",
    label: "资源收件箱",
    description: "收集、分析和激活所有入口资源",
    icon: "inbox"
  },
  {
    href: "/goals",
    label: "目标",
    description: "站内行动目标与任务闭环",
    icon: "target"
  },
  {
    href: "/reviews",
    label: "复盘",
    description: "记录资源是否真的产生价值",
    icon: "review"
  },
  {
    href: "/connectors",
    label: "连接器",
    description: "管理 GitHub、X、链接、上传和网盘入口",
    icon: "connector"
  },
  {
    href: "/settings",
    label: "设置",
    description: "权限边界、可见性和 Mock AI 状态",
    icon: "settings"
  }
];
