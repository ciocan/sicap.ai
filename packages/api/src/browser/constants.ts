// Browser-safe constants and utilities
export const ES_INDEX_PUBLIC = process.env.NEXT_PUBLIC_ES_INDEX_PUBLIC as string;
export const ES_INDEX_DIRECT = process.env.NEXT_PUBLIC_ES_INDEX_DIRECT as string;
export const ES_INDEX_OFFLINE = process.env.NEXT_PUBLIC_ES_INDEX_OFFLINE as string;

export const ES_INDICES = [ES_INDEX_PUBLIC, ES_INDEX_DIRECT, ES_INDEX_OFFLINE] as const;
export type ES_INDICES_TYPE = (typeof ES_INDICES)[number];

export const RESULTS_PER_PAGE = 20;