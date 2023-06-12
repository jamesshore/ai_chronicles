import { OutputListener } from "./output_listener.js";

export class HttpClient {

  private _outputListener = new OutputListener<any>();

  static create(): HttpClient {
    return new HttpClient(fetch);
  }

  static createNull(): HttpClient {
    return new HttpClient(stubbedFetch);
  }

  private constructor(private readonly _fetch: any) {
  }

  async requestAsync({
    url,
    method,
    headers = {},
    body = "",
  }: {
    url: string,
    method: string,
    headers?: Record<string, string>,
    body?: string,
  }): Promise<{
    status: number,
    headers: Record<string, string>,
    body: string,
  }> {
    const fetchOptions = { method, headers, body };
    this._outputListener.emit({ url, method, headers, body });
    const fetchResponse = await this._fetch(url, fetchOptions);

    return {
      status: fetchResponse.status,
      headers: Object.fromEntries(fetchResponse.headers.entries()),
      body: await fetchResponse.text(),
    };
  }

  trackRequests(): any {
    return this._outputListener.trackOutput();
  }
}

function stubbedFetch(): Promise<Response> {
  const response = new Response("nulled body", {
    status: 503,
    headers: {
      nulledHeader: "nulledHeaderValue",
    },
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response);
    }, 0);
  });
}
