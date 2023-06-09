import { OutputListener, OutputTracker } from "./output_listener.js";

export interface HttpClientOutput {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

export type NulledHttpClientEndpoints = Record<string, NulledHttpClientResponse>;

export interface NulledHttpClientResponse {
  status?: number,
  headers?: Record<string, string>,
  body?: string,
}

interface OurGlobals {
  fetch(
    url: string,
    options: { method: string, headers: Record<string, string>, body: string }
  ): Promise<Response>,
}

export class HttpClient {

  private _requestsListener = new OutputListener<HttpClientOutput>();

  static create(): HttpClient {
    return new HttpClient(globalThis);
  }

  static createNull(endpoints? : NulledHttpClientEndpoints): HttpClient {
    return new HttpClient(new StubbedGlobals(endpoints));
  }

  private constructor(private readonly _globals: OurGlobals) {
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

  constructor(private readonly _endpoints?: NulledHttpClientEndpoints) {
  }

  async fetch(url: string): Promise<Response> {
    const DEFAULT_STATUS = 501;
    const DEFAULT_HEADERS = { default_nulled_header_name: "default_nulled_header_value" };
    const DEFAULT_BODY = "default_nulled_HTTP_response";

    const configuredResponse = this._endpoints?.[url] ?? {} as NulledHttpClientResponse;

    const response = new Response(configuredResponse.body ?? DEFAULT_BODY, {
      status: configuredResponse.status ?? DEFAULT_STATUS,
      headers: configuredResponse.headers ?? DEFAULT_HEADERS,
    });
    if (configuredResponse.headers?.["content-type"] === undefined) {
      response.headers.delete("content-type");
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(response);
      }, 0);
    });
  }

}
