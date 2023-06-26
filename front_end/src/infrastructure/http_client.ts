import { OutputListener, OutputTracker } from "./output_listener.js";

export interface HttpClientOutput {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

export class HttpClient {

  private _requestsListener = new OutputListener<HttpClientOutput>();

  static create(): HttpClient {
    return new HttpClient(globalThis);
  }

  static createNull(responses): HttpClient {
    return new HttpClient(new StubbedGlobals(responses));
  }

  private constructor(readonly theGlobals) {
    this._globals = theGlobals;
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
    method = method.toUpperCase();
    headers = this.#normalizeHeaders(headers);

    this._requestsListener.emit({ url, method, headers, body });
    
    const fetchOptions = { method, headers, body };
    const fetchResponse = await this._globals.fetch(url, fetchOptions);

    return {
      status: fetchResponse.status,
      headers: Object.fromEntries(fetchResponse.headers.entries()),
      body: await fetchResponse.text(),
    };
  }

  trackRequests(): OutputTracker<HttpClientOutput> {
    return this._requestsListener.trackOutput();
  }

  #normalizeHeaders(headers: Record<string, string>) {
    return Object.fromEntries(
      Object.entries(headers).map(([ key, value ]) => [ key.toLowerCase(), value ])
    );
  }

}


class StubbedGlobals {

  constructor(private readonly _responses) {
  }

  async fetch(url): Promise<Response> {
    const defaultResponse = {
      status: 501,
      headers:  {
        default_nulled_header_name: "default_nulled_header_value",
      },
      body: "default_nulled_HTTP_response",
    };
    const configuredResponse = this._responses?.[url] ?? defaultResponse;

    const response = new Response(configuredResponse.body, {
      status: configuredResponse.status,
      headers: configuredResponse.headers,
    });
    if (configuredResponse.headers["content-type"] === undefined) {
      response.headers.delete("content-type");
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(response);
      }, 0);
    });
  }

}
