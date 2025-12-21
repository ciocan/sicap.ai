import { cacheLife, cacheTag } from "next/cache";
import {
  getTotal,
  searchContracts,
  getCompanyAchizitii,
  getCompanyLicitatii,
  getCompanyAchizitiiOffline,
  getContractAchizitii,
  getContractLicitatii,
  getContractAchizitiiOffline,
  getSitemapAchizitii,
  getSitemapAchizitiiAutoritati,
  getSitemapAchizitiiCpv,
  getSitemapAchizitiiFirme,
  getSitemapAchizitiiOffline,
  getSitemapLicitatii,
  getSitemapLicitatiiCpv,
  getEmbedAchizitii,
  getAuthorityByNationalId,
  getAuthorityTopSuppliers,
  getCompanyByNationalId,
  getCompanyTopAuthorities,
  getLocalityStats,
  getLocalityTopAuthorities,
  getLocalityTopCompanies,
  getLocalityTopCpv,
  getRelatedLocalities,
  type SearchProps,
  type Args,
} from "@sicap/api";

/**
 * Cached wrapper for getTotal - fetches total counts for all indices
 * Uses "totals" cache profile (24h revalidation)
 */
export async function getCachedTotal() {
  "use cache";
  cacheLife("totals");
  cacheTag("totals");
  return getTotal();
}

/**
 * Cached wrapper for searchContracts - full-text search across indices
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedSearchResults(props: SearchProps) {
  "use cache";
  cacheLife("search");
  cacheTag("search", `search-${props.query}-${props.page}`);
  return searchContracts(props);
}

/**
 * Cached wrapper for getCompanyAchizitii - get direct acquisitions by company/authority/cpv
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedCompanyAchizitii(args: Args) {
  "use cache";
  cacheLife("search");
  const key = args.supplierId || args.authorityId || args.cpvCode || "unknown";
  cacheTag("company-achizitii", `achizitii-${key}-${args.page || 1}`);
  return getCompanyAchizitii(args);
}

/**
 * Cached wrapper for getCompanyLicitatii - get public tenders by company/authority/cpv
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedCompanyLicitatii(args: Args) {
  "use cache";
  cacheLife("search");
  const key = args.supplierId || args.authorityId || args.cpvCode || "unknown";
  cacheTag("company-licitatii", `licitatii-${key}-${args.page || 1}`);
  return getCompanyLicitatii(args);
}

/**
 * Cached wrapper for getCompanyAchizitiiOffline - get offline acquisitions by company/authority/cpv
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedCompanyAchizitiiOffline(args: Args) {
  "use cache";
  cacheLife("search");
  const key = args.supplierId || args.authorityId || args.cpvCode || "unknown";
  cacheTag(
    "company-achizitii-offline",
    `achizitii-offline-${key}-${args.page || 1}`,
  );
  return getCompanyAchizitiiOffline(args);
}

/**
 * Cached wrapper for getContractAchizitii - get single direct acquisition contract
 * Uses "contracts" cache profile (48h revalidation)
 */
export async function getCachedContractAchizitii(id: string) {
  "use cache";
  cacheLife("contracts");
  cacheTag("contract-achizitii", `contract-achizitii-${id}`);
  return getContractAchizitii(id);
}

/**
 * Cached wrapper for getContractLicitatii - get single public tender contract
 * Uses "contracts" cache profile (48h revalidation)
 */
export async function getCachedContractLicitatii(id: string) {
  "use cache";
  cacheLife("contracts");
  cacheTag("contract-licitatii", `contract-licitatii-${id}`);
  return getContractLicitatii(id);
}

/**
 * Cached wrapper for getContractAchizitiiOffline - get single offline acquisition contract
 * Uses "contracts" cache profile (48h revalidation)
 */
export async function getCachedContractAchizitiiOffline(id: string) {
  "use cache";
  cacheLife("contracts");
  cacheTag("contract-achizitii-offline", `contract-achizitii-offline-${id}`);
  return getContractAchizitiiOffline(id);
}

// ============================================================================
// Sitemap cached functions
// ============================================================================

/**
 * Cached wrapper for getSitemapAchizitii
 * Uses "sitemaps" cache profile (24h revalidation)
 */
export async function getCachedSitemapAchizitii(size: number) {
  "use cache";
  cacheLife("sitemaps");
  cacheTag("sitemap-achizitii");
  return getSitemapAchizitii(size);
}

/**
 * Cached wrapper for getSitemapLicitatii
 * Uses "sitemaps" cache profile (24h revalidation)
 */
export async function getCachedSitemapLicitatii(size: number) {
  "use cache";
  cacheLife("sitemaps");
  cacheTag("sitemap-licitatii");
  return getSitemapLicitatii(size);
}

/**
 * Cached wrapper for getSitemapAchizitiiCpv
 * Uses "sitemaps" cache profile (24h revalidation)
 */
export async function getCachedSitemapAchizitiiCpv(size: number) {
  "use cache";
  cacheLife("sitemaps");
  cacheTag("sitemap-achizitii-cpv");
  return getSitemapAchizitiiCpv(size);
}

/**
 * Cached wrapper for getSitemapLicitatiiCpv
 * Uses "sitemaps" cache profile (24h revalidation)
 */
export async function getCachedSitemapLicitatiiCpv(size: number) {
  "use cache";
  cacheLife("sitemaps");
  cacheTag("sitemap-licitatii-cpv");
  return getSitemapLicitatiiCpv(size);
}

/**
 * Cached wrapper for getSitemapAchizitiiFirme
 * Uses "sitemaps" cache profile (24h revalidation)
 */
export async function getCachedSitemapAchizitiiFirme(size: number) {
  "use cache";
  cacheLife("sitemaps");
  cacheTag("sitemap-achizitii-firme");
  return getSitemapAchizitiiFirme(size);
}

/**
 * Cached wrapper for getSitemapAchizitiiAutoritati
 * Uses "sitemaps" cache profile (24h revalidation)
 */
export async function getCachedSitemapAchizitiiAutoritati(size: number) {
  "use cache";
  cacheLife("sitemaps");
  cacheTag("sitemap-achizitii-autoritati");
  return getSitemapAchizitiiAutoritati(size);
}

/**
 * Cached wrapper for getSitemapAchizitiiOffline
 * Uses "sitemaps" cache profile (24h revalidation)
 */
export async function getCachedSitemapAchizitiiOffline(size: number) {
  "use cache";
  cacheLife("sitemaps");
  cacheTag("sitemap-achizitii-offline");
  return getSitemapAchizitiiOffline(size);
}

// ============================================================================
// Embed cached functions
// ============================================================================

/**
 * Cached wrapper for getEmbedAchizitii - get latest acquisitions for embed widget
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedEmbedAchizitii(fiscalNumber: string) {
  "use cache";
  cacheLife("search");
  cacheTag("embed-achizitii", `embed-${fiscalNumber}`);
  return getEmbedAchizitii({ fiscalNumber });
}

// ============================================================================
// Authority cached functions
// ============================================================================

interface AuthorityByNationalIdArgs {
  nationalId: string;
  page?: number;
  perPage?: number;
}

/**
 * Cached wrapper for getAuthorityByNationalId - get all tender types by authority fiscal number
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedAuthorityByNationalId(args: AuthorityByNationalIdArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("authority-all", `authority-${args.nationalId}-${args.page || 1}`);
  return getAuthorityByNationalId(args);
}

// ============================================================================
// Company cached functions
// ============================================================================

interface CompanyByNationalIdArgs {
  nationalId: string;
  page?: number;
  perPage?: number;
}

/**
 * Cached wrapper for getCompanyByNationalId - get all tender types by company/supplier fiscal number
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedCompanyByNationalId(args: CompanyByNationalIdArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("company-all", `company-${args.nationalId}-${args.page || 1}`);
  return getCompanyByNationalId(args);
}

// ============================================================================
// Authority top suppliers cached functions
// ============================================================================

interface AuthorityTopSuppliersArgs {
  nationalId: string;
  limit?: number;
}

/**
 * Cached wrapper for getAuthorityTopSuppliers - get top 10 suppliers for an authority in the past 12 months
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedAuthorityTopSuppliers(args: AuthorityTopSuppliersArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("authority-top-suppliers", `authority-top-suppliers-${args.nationalId}`);
  return getAuthorityTopSuppliers(args);
}

// ============================================================================
// Company top authorities cached functions
// ============================================================================

interface CompanyTopAuthoritiesArgs {
  nationalId: string;
  limit?: number;
}

/**
 * Cached wrapper for getCompanyTopAuthorities - get top 10 authorities for a company in the past 12 months
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedCompanyTopAuthorities(args: CompanyTopAuthoritiesArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("company-top-authorities", `company-top-authorities-${args.nationalId}`);
  return getCompanyTopAuthorities(args);
}

// ============================================================================
// Locality cached functions
// ============================================================================

interface LocalityStatsArgs {
  city: string;
  county: string;
}

/**
 * Cached wrapper for getLocalityStats - get summary statistics and spending over time for a locality
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedLocalityStats(args: LocalityStatsArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("locality-stats", `locality-stats-${args.county}-${args.city}`);
  return getLocalityStats(args);
}

interface LocalityTopEntitiesArgs {
  city: string;
  county: string;
  limit?: number;
}

/**
 * Cached wrapper for getLocalityTopAuthorities - get top authorities in a locality
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedLocalityTopAuthorities(args: LocalityTopEntitiesArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("locality-top-authorities", `locality-top-authorities-${args.county}-${args.city}`);
  return getLocalityTopAuthorities(args);
}

/**
 * Cached wrapper for getLocalityTopCompanies - get top companies in a locality
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedLocalityTopCompanies(args: LocalityTopEntitiesArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("locality-top-companies", `locality-top-companies-${args.county}-${args.city}`);
  return getLocalityTopCompanies(args);
}

interface LocalityTopCpvArgs {
  city: string;
  county: string;
  limit?: number;
}

/**
 * Cached wrapper for getLocalityTopCpv - get top CPV categories in a locality
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedLocalityTopCpv(args: LocalityTopCpvArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("locality-top-cpv", `locality-top-cpv-${args.county}-${args.city}`);
  return getLocalityTopCpv(args);
}

interface RelatedLocalitiesArgs {
  county: string;
  currentCity: string;
  limit?: number;
}

/**
 * Cached wrapper for getRelatedLocalities - get other cities in the same county
 * Uses "search" cache profile (24h revalidation)
 */
export async function getCachedRelatedLocalities(args: RelatedLocalitiesArgs) {
  "use cache";
  cacheLife("search");
  cacheTag("related-localities", `related-localities-${args.county}`);
  return getRelatedLocalities(args);
}

