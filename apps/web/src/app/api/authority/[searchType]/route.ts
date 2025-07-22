import { NextResponse } from "next/server";
import { withAxiom } from "next-axiom";

import {
  ES_INDEX_DIRECT,
  ES_INDEX_OFFLINE,
  ES_INDEX_PUBLIC,
  searchAuthorityAquisitions,
  searchAuthorityLicitatii,
  searchAuthorityOffline,
} from "@sicap/api";
import { withBearerToken } from "../../middleware/withBearerToken";

type RouteParams = {
  searchType: string;
};

const searchFunctionMap = {
  [ES_INDEX_DIRECT]: searchAuthorityAquisitions,
  [ES_INDEX_OFFLINE]: searchAuthorityOffline,
  [ES_INDEX_PUBLIC]: searchAuthorityLicitatii,
};

export const GET = withBearerToken(
  withAxiom(async (request, context: { params: RouteParams }) => {
    const searchParams = new URLSearchParams(request.url?.split("?")[1]);
    const searchType = context?.params?.searchType;

    const authorityFiscalCode = searchParams.get("authorityFiscalCode");
    const pitId = searchParams.get("pitId");
    const searchAfter = searchParams.get("searchAfter");

    if (!authorityFiscalCode || !pitId) {
      return new NextResponse("Missing authorityFiscalCode or pitId", {
        status: 400,
      });
    }

    const searchFunction = searchFunctionMap[searchType];

    if (!searchFunction) {
      request.log.error(`Invalid searchType: ${searchType}`);
      return new NextResponse("Invalid searchType", { status: 400 });
    }

    try {
      return NextResponse.json(await searchFunction(authorityFiscalCode, pitId, searchAfter));
    } catch (error) {
      request.log.error(String(error));
      return new NextResponse("Invalid pitId", { status: 500 });
    }
  }),
);
