export async function callAPI({
  method = "POST",
  url,
  body,
  headers = {},
}: {
  method?: "POST" | "PUT" | "PATCH" | "DELETE" | "GET";
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  try {
    const options = {
      method,
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *client
      body: method === "GET" ? undefined : JSON.stringify(body || {}), // body data type must match "Content-Type" header
    } as RequestInit;
    const response = await fetch(url, options);
    return (await response.json()) as unknown; // parses JSON response into native JavaScript objects
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw err;
  }
}
