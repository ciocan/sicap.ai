"use client";
import { useEffect } from "react";
import { AssistantRuntimeProvider, useAssistantRuntime } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useQueryState } from "nuqs";

import { Thread } from "@/components/agent/thread";
import { ThreadList } from "@/components/agent/thread-list";
import ToolUIWrapper from "@/components/agent/tool-ui";
import { useMastraClient } from "./use-mastra-client";

const messages = [
  {
    id: "E7r0Hze",
    createdAt: "2025-07-26T17:56:43.418Z",
    role: "user",
    content: [
      {
        type: "text",
        text: "Care sunt ultimele achizitii directe de ieri din Baicoi?",
      },
    ],
    attachments: [],
    metadata: {
      custom: {},
    },
  },
  {
    id: "z3iWO40",
    role: "assistant",
    status: {
      type: "complete",
      reason: "stop",
    },
    content: [
      {
        type: "tool-call",
        state: "result",
        status: {
          type: "complete",
          reason: "unknown",
        },
        toolCallId: "call_AhOxOeXixGPVyjyUSO59z1xn",
        toolName: "searchContractsTool",
        argsText:
          '{"page":1,"perPage":3,"db":["achizitii-directe"],"dateFrom":"2025-07-25","dateTo":"2025-07-25","localityAuthority":"Baicoi"}',
        args: {
          page: 1,
          perPage: 3,
          db: ["achizitii-directe"],
          dateFrom: "2025-07-25",
          dateTo: "2025-07-25",
          localityAuthority: "Baicoi",
        },
        result: {
          took: 2,
          total: 23,
          items: [
            {
              id: "120233795",
              index: "achizitii-directe",
              fields: {
                date: "2025-07-25T10:09:13.000Z",
                name: "DAC BON CONSUM A5/2EX/50 FILE",
                code: "DA38597435",
                cpvCode: "22800000-8",
                cpvCodeAndName:
                  "22800000-8 - Registre, registre contabile, clasoare, formulare si alte articole imprimate de papetarie din hartie sau din carton (Rev.2)",
                value: 75,
                supplierId: 39092,
                supplierName: "RO11805367 SELGROS CASH&CARRY SRL",
                localitySupplier: "Brasov",
                countySupplier: "Brasov",
                contractingAuthorityId: 7480,
                contractingAuthorityName: "2845710 Orasul Baicoi(Primaria Oras Baicoi)",
                localityAuthority: "Baicoi",
                countyAuthority: "Prahova",
                state: "Oferta acceptata",
                stateId: 7,
                type: "Furnizare",
                typeId: 1,
              },
            },
            {
              id: "120233604",
              index: "achizitii-directe",
              fields: {
                date: "2025-07-25T09:58:48.000Z",
                name: "Materiale horticole",
                code: "DA38597234",
                cpvCode: "03121000-5",
                cpvCodeAndName: "03121000-5 - Produse horticole (Rev.2)",
                value: 3179,
                supplierId: 127179,
                supplierName: "32857059 SC NEXT GARDEN INVEST SRL",
                localitySupplier: "Ploiesti",
                countySupplier: "Prahova",
                contractingAuthorityId: 7480,
                contractingAuthorityName: "2845710 Orasul Baicoi(Primaria Oras Baicoi)",
                localityAuthority: "Baicoi",
                countyAuthority: "Prahova",
                state: "Oferta acceptata",
                stateId: 7,
                type: "Furnizare",
                typeId: 1,
              },
            },
            {
              id: "120233508",
              index: "achizitii-directe",
              fields: {
                date: "2025-07-25T09:55:16.000Z",
                name: "QUO-Kit reactivi Quo-Test (15 teste)",
                code: "DA38597188",
                cpvCode: "33140000-3",
                cpvCodeAndName: "33140000-3 - Consumabile medicale (Rev.2)",
                value: 1160,
                supplierId: 46,
                supplierName: "RO 14600285 X-Lab Solutions S.R.L.",
                localitySupplier: "Cluj-Napoca",
                countySupplier: "Cluj",
                contractingAuthorityId: 4681,
                contractingAuthorityName: "2845265 SPITALUL ORASENESC BAICOI",
                localityAuthority: "Baicoi",
                countyAuthority: "Prahova",
                state: "Oferta acceptata",
                stateId: 7,
                type: "Furnizare",
                typeId: 1,
              },
            },
          ],
        },
        isError: false,
      },
      {
        type: "text",
        text: "Iată ultimele achiziții directe din Băicoi pentru data de 25 iulie 2025:\n\n1. **DAC BON CONSUM A5/2EX/50 FILE**\n   - **Cod:** DA38597435\n   - **ID:** 120233795\n   - **Autoritate contractantă:** 2845710 - Orașul Băicoi (Primăria Oraș Băicoi)\n   - **Valoare:** 75 RON\n   - **Furnizor:** RO11805367 SELGROS CASH&CARRY SRL\n   - **Stare:** Ofertă acceptată\n   - **Localitate furnizor:** Brașov\n   - **Județ furnizor:** Brașov\n\n2. **Materiale horticole**\n   - **Cod:** DA38597234\n   - **ID:** 120233604\n   - **Autoritate contractantă:** 2845710 - Orașul Băicoi (Primăria Oraș Băicoi)\n   - **Valoare:** 3,179 RON\n   - **Furnizor:** 32857059 SC NEXT GARDEN INVEST SRL\n   - **Stare:** Ofertă acceptată\n   - **Localitate furnizor:** Ploiești\n   - **Județ furnizor:** Prahova\n\n3. **QUO-Kit reactivi Quo-Test (15 teste)**\n   - **Cod:** DA38597188\n   - **ID:** 120233508\n   - **Autoritate contractantă:** 2845265 - Spitalul Orășenesc Băicoi\n   - **Valoare:** 1,160 RON\n   - **Furnizor:** RO 14600285 X-Lab Solutions S.R.L.\n   - **Stare:** Ofertă acceptată\n   - **Localitate furnizor:** Cluj-Napoca\n   - **Județ furnizor:** Cluj\n\nDacă ai nevoie de mai multe informații sau de alte căutări, te rog să îmi spui!",
        status: {
          type: "complete",
          reason: "unknown",
        },
      },
    ],
    metadata: {
      unstable_state: null,
      unstable_annotations: [],
      unstable_data: [],
      steps: [
        {
          state: "finished",
          messageId: "msg-P9HhZuglQy9G02ZxSLrhPQ2k",
          finishReason: "tool-calls",
          usage: {
            promptTokens: 5198,
            completionTokens: 57,
          },
          isContinued: false,
        },
        {
          state: "finished",
          messageId: "msg-MXwMUBCGyhrPoZVPHQGtgCRZ",
          finishReason: "stop",
          usage: {
            promptTokens: 5888,
            completionTokens: 465,
          },
          isContinued: false,
        },
      ],
      custom: {},
    },
    createdAt: "2025-07-26T17:56:43.418Z",
  },
];

export const Agent = () => {
  const [threadId] = useQueryState("t");
  const client = useMastraClient();

  useEffect(() => {
    const fetchThreads = async () => {
      const threads = await client.getMemoryThreads({
        agentId: "sicapAgent",
        resourceId: "1c2ed6f3-0472-453f-95eb-14e92098738d", // user id
      });
      console.log("threads", threads);
    };
    fetchThreads();
  }, [client]);

  const runtime = useChatRuntime({
    api: "/api/chat",
    adapters: {
      history: {
        load: async () => {
          const response = await fetch(`/api/chat/${threadId}`);
          const json = await response.json();
          console.log("json", json);
          // return {
          //   headId: messages[messages.length - 1].id,
          //   parentId: messages[messages.length - 2].id,
          //   unstable_resume: false,
          //   messages: messages.map((message) => ({
          //     parentId: null,
          //     message,
          //   })),
          // };
          return {
            messages: [],
          };
        },
        append: async (item) => {
          // console.log("append", item);
        },
      },
    },
  });

  // console.log("runtime", runtime);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="grid h-[100dvh] grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
        <ThreadList />
        <Thread />
        <ToolUIWrapper />
      </div>
    </AssistantRuntimeProvider>
  );
};
