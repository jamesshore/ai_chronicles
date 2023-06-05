export class HttpClient {

  async requestAsync({
    url,
    method,
    headers,
    body,
  }: {
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string,
  }): Promise<{
    status: number,
    headers: Record<string, string>,
    body: string,
  }> {
    const fetchOptions = { method, headers, body };
    const fetchResponse = await fetch(url, fetchOptions);

    return {
      status: fetchResponse.status,
      headers: Object.fromEntries(fetchResponse.headers.entries()),
      body: await fetchResponse.text(),
    };
  }

}