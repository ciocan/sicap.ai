// NOTE: Caching temporarily disabled to reduce Vercel ISR write costs
// To re-enable, add back: import { cacheLife, cacheTag } from "next/cache";
// and restore "use cache" directives with cacheLife/cacheTag calls

import {
  getTotal,
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
  getCompanyRegistry,
  getCompanyFinancials,
  getLocalityStats,
  getLocalityTopAuthorities,
  getLocalityTopCompanies,
  getLocalityTopCpv,
  getRelatedLocalities,
  type Args,
} from "@sicap/api";

/**
 * Wrapper for getTotal - fetches total counts for all indices
 * Caching temporarily disabled
 */
export async function getCachedTotal() {
  return getTotal();
}

/**
 * Wrapper for getCompanyAchizitii - get direct acquisitions by company/authority/cpv
 * Caching temporarily disabled
 */
export async function getCachedCompanyAchizitii(args: Args) {
  return getCompanyAchizitii(args);
}

/**
 * Wrapper for getCompanyLicitatii - get public tenders by company/authority/cpv
 * Caching temporarily disabled
 */
export async function getCachedCompanyLicitatii(args: Args) {
  return getCompanyLicitatii(args);
}

/**
 * Wrapper for getCompanyAchizitiiOffline - get offline acquisitions by company/authority/cpv
 * Caching temporarily disabled
 */
export async function getCachedCompanyAchizitiiOffline(args: Args) {
  return getCompanyAchizitiiOffline(args);
}

/**
 * Wrapper for getContractAchizitii - get single direct acquisition contract
 * Caching temporarily disabled
 */
export async function getCachedContractAchizitii(id: string) {
  return getContractAchizitii(id);
}

/**
 * Wrapper for getContractLicitatii - get single public tender contract
 * Caching temporarily disabled
 */
export async function getCachedContractLicitatii(id: string) {
  return getContractLicitatii(id);
}

/**
 * Wrapper for getContractAchizitiiOffline - get single offline acquisition contract
 * Caching temporarily disabled
 */
export async function getCachedContractAchizitiiOffline(id: string) {
  return getContractAchizitiiOffline(id);
}

// ============================================================================
// Sitemap functions
// ============================================================================

/**
 * Wrapper for getSitemapAchizitii
 * Caching temporarily disabled
 */
export async function getCachedSitemapAchizitii(size: number) {
  return getSitemapAchizitii(size);
}

/**
 * Wrapper for getSitemapLicitatii
 * Caching temporarily disabled
 */
export async function getCachedSitemapLicitatii(size: number) {
  return getSitemapLicitatii(size);
}

/**
 * Wrapper for getSitemapAchizitiiCpv
 * Caching temporarily disabled
 */
export async function getCachedSitemapAchizitiiCpv(size: number) {
  return getSitemapAchizitiiCpv(size);
}

/**
 * Wrapper for getSitemapLicitatiiCpv
 * Caching temporarily disabled
 */
export async function getCachedSitemapLicitatiiCpv(size: number) {
  return getSitemapLicitatiiCpv(size);
}

/**
 * Wrapper for getSitemapAchizitiiFirme
 * Caching temporarily disabled
 */
export async function getCachedSitemapAchizitiiFirme(size: number) {
  return getSitemapAchizitiiFirme(size);
}

/**
 * Wrapper for getSitemapAchizitiiAutoritati
 * Caching temporarily disabled
 */
export async function getCachedSitemapAchizitiiAutoritati(size: number) {
  return getSitemapAchizitiiAutoritati(size);
}

/**
 * Wrapper for getSitemapAchizitiiOffline
 * Caching temporarily disabled
 */
export async function getCachedSitemapAchizitiiOffline(size: number) {
  return getSitemapAchizitiiOffline(size);
}

// ============================================================================
// Embed functions
// ============================================================================

/**
 * Wrapper for getEmbedAchizitii - get latest acquisitions for embed widget
 * Caching temporarily disabled
 */
export async function getCachedEmbedAchizitii(fiscalNumber: string) {
  return getEmbedAchizitii({ fiscalNumber });
}

// ============================================================================
// Authority functions
// ============================================================================

interface AuthorityByNationalIdArgs {
  nationalId: string;
  page?: number;
  perPage?: number;
}

/**
 * Wrapper for getAuthorityByNationalId - get all tender types by authority fiscal number
 * Caching temporarily disabled
 */
export async function getCachedAuthorityByNationalId(args: AuthorityByNationalIdArgs) {
  return getAuthorityByNationalId(args);
}

// ============================================================================
// Company functions
// ============================================================================

interface CompanyByNationalIdArgs {
  nationalId: string;
  page?: number;
  perPage?: number;
}

/**
 * Wrapper for getCompanyByNationalId - get all tender types by company/supplier fiscal number
 * Caching temporarily disabled
 */
export async function getCachedCompanyByNationalId(args: CompanyByNationalIdArgs) {
  return getCompanyByNationalId(args);
}

// ============================================================================
// Authority top suppliers functions
// ============================================================================

interface AuthorityTopSuppliersArgs {
  nationalId: string;
  limit?: number;
}

/**
 * Wrapper for getAuthorityTopSuppliers - get top 10 suppliers for an authority in the past 12 months
 * Caching temporarily disabled
 */
export async function getCachedAuthorityTopSuppliers(args: AuthorityTopSuppliersArgs) {
  return getAuthorityTopSuppliers(args);
}

// ============================================================================
// Company top authorities functions
// ============================================================================

interface CompanyTopAuthoritiesArgs {
  nationalId: string;
  limit?: number;
}

/**
 * Wrapper for getCompanyTopAuthorities - get top 10 authorities for a company in the past 12 months
 * Caching temporarily disabled
 */
export async function getCachedCompanyTopAuthorities(args: CompanyTopAuthoritiesArgs) {
  return getCompanyTopAuthorities(args);
}

// ============================================================================
// ONRC trade-registry + MFP financials enrichment
// ============================================================================

/**
 * Wrapper for getCompanyRegistry - ONRC trade-registry data by CUI.
 * Caching disabled (matches the repo's ISR-cost stance); registry data is snapshot-based
 * and a strong candidate for re-enabling caching later.
 */
export async function getCachedCompanyRegistry(nationalId: string) {
  return getCompanyRegistry(nationalId);
}

/**
 * Wrapper for getCompanyFinancials - MFP financial history by CUI.
 * Caching disabled (see note above).
 */
export async function getCachedCompanyFinancials(nationalId: string) {
  return getCompanyFinancials(nationalId);
}

// ============================================================================
// Locality functions
// ============================================================================

interface LocalityStatsArgs {
  city: string;
  county: string;
}

/**
 * Wrapper for getLocalityStats - get summary statistics and spending over time for a locality
 * Caching temporarily disabled
 */
export async function getCachedLocalityStats(args: LocalityStatsArgs) {
  return getLocalityStats(args);
}

interface LocalityTopEntitiesArgs {
  city: string;
  county: string;
  limit?: number;
}

/**
 * Wrapper for getLocalityTopAuthorities - get top authorities in a locality
 * Caching temporarily disabled
 */
export async function getCachedLocalityTopAuthorities(args: LocalityTopEntitiesArgs) {
  return getLocalityTopAuthorities(args);
}

/**
 * Wrapper for getLocalityTopCompanies - get top companies in a locality
 * Caching temporarily disabled
 */
export async function getCachedLocalityTopCompanies(args: LocalityTopEntitiesArgs) {
  return getLocalityTopCompanies(args);
}

interface LocalityTopCpvArgs {
  city: string;
  county: string;
  limit?: number;
}

/**
 * Wrapper for getLocalityTopCpv - get top CPV categories in a locality
 * Caching temporarily disabled
 */
export async function getCachedLocalityTopCpv(args: LocalityTopCpvArgs) {
  return getLocalityTopCpv(args);
}

interface RelatedLocalitiesArgs {
  county: string;
  currentCity: string;
  limit?: number;
}

/**
 * Wrapper for getRelatedLocalities - get other cities in the same county
 * Caching temporarily disabled
 */
export async function getCachedRelatedLocalities(args: RelatedLocalitiesArgs) {
  return getRelatedLocalities(args);
}
