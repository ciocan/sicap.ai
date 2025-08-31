import esb from "elastic-builder";
import type { estypes } from "@elastic/elasticsearch";

import { esClient } from "../config";
import {
  ES_INDEX_DIRECT,
  ES_INDEX_PUBLIC,
  ES_INDEX_OFFLINE,
  type Fields,
  fieldsAchizitii,
  filedsLicitatii,
  fieldsAchizitiiOffline,
  transformItem,
} from "../utils";
import type { IndexName, SearchFilters } from "../types";

interface SearchContractsParams {
  query?: string;
  page?: number;
  perPage?: number;
  filters: SearchFilters;
}

interface SearchContractsResult {
  took: number;
  total: number;
  items: Array<{
    id: string;
    index: IndexName;
    fields: any;
  }>;
}

type SearchTotalHits = estypes.SearchTotalHits;

export async function searchContractsAgent({
  query,
  page = 1,
  perPage = 5,
  filters,
}: SearchContractsParams): Promise<SearchContractsResult> {
  const {
    db = [ES_INDEX_PUBLIC, ES_INDEX_DIRECT, ES_INDEX_OFFLINE],
    dateFrom,
    dateTo,
    valueFrom,
    valueTo,
    authority,
    cpv,
    localityAuthority,
    countyAuthority,
    supplier,
    localitySupplier,
    countySupplier,
    euFunds,
  } = filters;

  const mustQueries: esb.Query[] = [];

  if (query) {
    mustQueries.push(esb.queryStringQuery(query).lenient(true));
  }

  const filterQueries: esb.Query[] = [];

  // Date filters
  if (dateFrom || dateTo) {
    const dateRangeQueries: esb.Query[] = [];
    if (dateFrom || dateTo) {
      dateRangeQueries.push(
        esb
          .rangeQuery("item.noticeStateDate")
          .gte(dateFrom || "1900-01-01")
          .lte(dateTo || "2100-12-31"),
      );
      dateRangeQueries.push(
        esb
          .rangeQuery("item.publicationDate")
          .gte(dateFrom || "1900-01-01")
          .lte(dateTo || "2100-12-31"),
      );
    }
    if (dateRangeQueries.length > 0) {
      filterQueries.push(esb.boolQuery().should(dateRangeQueries));
    }
  }

  // Value filters
  if (valueFrom || valueTo) {
    const valueRangeQueries: esb.Query[] = [];
    const minValue = valueFrom ? parseFloat(valueFrom) : 0;
    const maxValue = valueTo ? parseFloat(valueTo) : Number.MAX_SAFE_INTEGER;

    valueRangeQueries.push(
      esb.rangeQuery("noticeContracts.items.contractValue").gte(minValue).lte(maxValue),
    );
    valueRangeQueries.push(esb.rangeQuery("item.closingValue").gte(minValue).lte(maxValue));
    valueRangeQueries.push(esb.rangeQuery("item.awardedValue").gte(minValue).lte(maxValue));

    filterQueries.push(esb.boolQuery().should(valueRangeQueries));
  }

  // Authority filters
  if (authority) {
    const authorityFilter = esb
      .boolQuery()
      .should([
        esb.matchPhraseQuery("item.contractingAuthorityNameAndFN", authority),
        esb.matchPhraseQuery("item.contractingAuthority", authority),
      ]);
    filterQueries.push(authorityFilter);
  }

  if (localityAuthority) {
    const localityFilter = esb
      .boolQuery()
      .should([
        esb.matchPhraseQuery(
          "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.city",
          localityAuthority,
        ),
        esb.matchPhraseQuery("authority.city", localityAuthority),
      ]);
    filterQueries.push(localityFilter);
  }

  if (countyAuthority) {
    const countyFilter = esb
      .boolQuery()
      .should([
        esb.matchPhraseQuery(
          "publicNotice.caNoticeEdit_New.section1_New.section1_1.caAddress.county.text",
          countyAuthority,
        ),
        esb.matchPhraseQuery("authority.county", countyAuthority),
      ]);
    filterQueries.push(countyFilter);
  }

  // Supplier filters
  if (supplier) {
    const supplierFilter = esb
      .boolQuery()
      .should([
        esb.matchPhraseQuery("noticeContracts.items.winner.name", supplier),
        esb.matchPhraseQuery("item.supplier", supplier),
      ]);
    filterQueries.push(supplierFilter);
  }

  if (localitySupplier) {
    const supplierLocalityFilter = esb
      .boolQuery()
      .should([
        esb.matchPhraseQuery("noticeContracts.items.winner.address.city", localitySupplier),
        esb.matchPhraseQuery("supplier.city", localitySupplier),
        esb.matchPhraseQuery("details.noticeEntityAddress.city", localitySupplier),
      ]);
    filterQueries.push(supplierLocalityFilter);
  }

  if (countySupplier) {
    const supplierCountyFilter = esb
      .boolQuery()
      .should([
        esb.matchPhraseQuery("noticeContracts.items.winner.address.county.text", countySupplier),
        esb.matchPhraseQuery("supplier.county", countySupplier),
      ]);
    filterQueries.push(supplierCountyFilter);
  }

  // CPV filter
  if (cpv) {
    const cpvFilter = esb
      .boolQuery()
      .should([
        esb.matchPhraseQuery("item.cpvCodeAndName", cpv),
        esb.matchPhraseQuery("item.cpvCode", cpv),
      ]);
    filterQueries.push(cpvFilter);
  }

  // EU Funds filter
  if (euFunds) {
    const euFundsFilter = esb
      .boolQuery()
      .should([
        esb.existsQuery(
          "publicNotice.caNoticeEdit_New.section2_New.section2_2_New.descriptionList.sysEuropeanFund.id",
        ),
        esb.existsQuery("publicDirectAcquisition.sysEuropeanFund.id"),
        esb.existsQuery("details.sysEuropeanFund.id"),
      ]);
    filterQueries.push(euFundsFilter);
  }

  const searchQuery = esb
    .requestBodySearch()
    .query(esb.boolQuery().must(mustQueries).filter(filterQueries))
    .sort(
      esb
        .sort()
        .script(
          esb.script(
            "inline",
            `
              if (doc.containsKey('item.noticeStateDate')) {
                return doc['item.noticeStateDate'].value.getMillis();
              } else if (doc.containsKey('item.publicationDate')) {
                return doc['item.publicationDate'].value.getMillis();
              } else {
                return 0;
              }
            `,
          ),
        )
        .type("number")
        .order("desc"),
    )
    .highlight(esb.highlight().preTags(["<mark>"]).postTags(["</mark>"]).field("*"))
    .from((page - 1) * perPage)
    .size(perPage);

  const searchParams = {
    index: db,
    body: searchQuery.toJSON(),
    fields: [...fieldsAchizitii, ...filedsLicitatii, ...fieldsAchizitiiOffline],
    _source: false,
  };

  const result = await esClient.search(searchParams);
  const total = result.hits.total as SearchTotalHits;

  return {
    took: result.took,
    total: total.value,
    items: result?.hits?.hits?.map((hit) => ({
      id: hit._id as string,
      index: hit._index as IndexName,
      fields: transformItem(hit._index, hit.fields as Fields, hit.highlight as Fields),
    })),
  };
}
