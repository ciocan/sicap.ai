import { callAPI } from "@/utils/api";
import { env } from "./env.server";

const emailTemplates = {
  welcome: 8,
} as const;

const listmonkLists = {
  users: 6,
} as const;

interface ListmonkSubscriber {
  id: number;
  created_at: string;
  updated_at: string;
  uuid: string;
  email: string;
  name: string;
  attribs: Record<string, unknown>;
  status: string;
  lists: { id: string }[];
}

function listmonkRequest({
  method = "POST",
  endpoint,
  data = undefined,
}: {
  method?: "POST" | "PUT" | "PATCH" | "DELETE" | "GET";
  endpoint: string;
  data?: Record<string, unknown>;
}) {
  return callAPI({
    method,
    url: `${env.LISTMONK_API_URL}${endpoint}`,
    body: data,
    headers: {
      Authorization: `Basic ${env.LISTMONK_API_KEY}`,
    },
  });
}

export async function addSubscriber({
  email,
  name,
  attribs,
}: {
  email: string;
  name: string;
  attribs: Record<string, unknown>;
}) {
  return await listmonkRequest({
    endpoint: "/subscribers",
    data: {
      email,
      name,
      status: "enabled",
      lists: [listmonkLists.users],
      attribs,
    },
  });
}

export async function messageSubscriber({
  email,
  template,
  data,
}: {
  email: string;
  template: keyof typeof emailTemplates;
  data?: Record<string, unknown>;
}) {
  return await listmonkRequest({
    endpoint: "/tx",
    data: {
      subscriber_email: email,
      template_id: emailTemplates[template],
      from_email: env.LISTMONK_FROM_EMAIL,
      data,
    },
  });
}

export async function getSubscriberInfo(email: string) {
  const res = (await listmonkRequest({
    method: "GET",
    endpoint: `/subscribers?query=subscribers.email='${email}'`,
  })) as { data: { results: ListmonkSubscriber[] } };

  const [subscriber] = res.data.results;
  return subscriber;
}

export async function addSubscriberToLists({
  email,
  lists,
}: {
  email: string;
  lists: (keyof typeof listmonkLists)[];
}) {
  const subscriber = await getSubscriberInfo(email);

  if (!subscriber) {
    console.error(`addSubscriberToList: Subscriber ${email} not found`);
    return;
  }

  return await listmonkRequest({
    method: "PUT",
    endpoint: "/subscribers/lists",
    data: {
      ids: [subscriber.id],
      action: "add",
      target_list_ids: lists.map((list) => listmonkLists[list]),
      status: "confirmed",
    },
  });
}
