export type InsightCardTone = "mint" | "amber" | "blue";

export type InsightCard = {
  id: string;
  title: string;
  body: string;
  tone: InsightCardTone;
};

export type HeatmapRow = {
  time: string;
  values: number[];
};

export type InsightsDashboardData = {
  cards: InsightCard[];
  heatmapRows: HeatmapRow[];
  showHeatmap: boolean;
};
