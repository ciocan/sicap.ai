import { pick } from "ramda";

import { esClient } from "../config";
import { ES_INDEX_PUBLIC } from "../utils";
import { RootObject } from "./types";

import {
  noticeProps,
  noticeDetailsProps,
  caNoticeEdit_New,
  caNoticeEdit_New__section1_New__section1_1__caAddress,
  section2_2_New,
  caNoticeEdit_New_U__section1_New_U__section1_1__caAddress,
  caNoticeEdit_New_U__section2_New_U__section2_1_New_U,
} from "./common";

export async function getContractLicitatii(id: string) {
  const result = await esClient.search({
    index: ES_INDEX_PUBLIC,
    body: {
      query: {
        match: {
          _id: id,
        },
      },
    },
  });

  const [contract] = result.hits.hits as RootObject[];

  if (!contract) {
    throw new Error(`Contractul nu a fost gasit: ${id}`);
  }

  const data = {
    ...pick(noticeProps, contract._source.item),
    ...{
      ...pick(noticeDetailsProps, contract._source.publicNotice || {}),
      ...pick(
        caNoticeEdit_New,
        contract._source.publicNotice?.caNoticeEdit_New?.section2_New?.section2_1_New || {},
      ),
      ...pick(
        caNoticeEdit_New__section1_New__section1_1__caAddress,
        contract._source.publicNotice?.caNoticeEdit_New?.section1_New?.section1_1?.caAddress || {},
      ),
      ...pick(
        caNoticeEdit_New_U__section1_New_U__section1_1__caAddress,
        contract._source.publicNotice?.caNoticeEdit_New_U?.section1_New_U?.section1_1?.caAddress ||
          {},
      ),
      ...pick(
        caNoticeEdit_New_U__section2_New_U__section2_1_New_U,
        contract._source.publicNotice?.caNoticeEdit_New_U?.section2_New_U?.section2_1_New_U || {},
      ),
      ...pick(
        section2_2_New,
        contract._source.publicNotice?.caNoticeEdit_New?.section2_New?.section2_2_New || {},
      ),
      ...pick(["contractDate", "contractValue"], contract._source?.noticeContracts?.items[0] || {}),
      winner: {
        ...pick(
          ["name", "fiscalNumber", "entityId"],
          contract._source?.noticeContracts?.items[0]?.winner || {},
        ),
      },
      winners: contract._source?.noticeContracts?.items[0]?.winners?.map((winner) => ({
        ...pick(["entityId", "name", "fiscalNumber"], winner || {}),
      })),
      istoric: contract._source.istoric,
    },
  };

  return data;
}
