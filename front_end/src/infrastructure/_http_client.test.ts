import { assert, test } from "../util/tests.js";
import { HttpClient } from "./http_client.js";
import * as http from "node:http";
import * as net from "net";

const PORT = 5011;
const URL_PREFIX = `http://localhost:${PORT}`;

const DEFAULT_FETCH_REQUEST_HEADERS = {
  "host": `localhost:${PORT}`,
  "connection": "keep-alive",
  "content-type": "text/plain;charset=UTF-8",
  "accept": "*/*",
  "accept-language": "*",
  "sec-fetch-mode": "cors",
  "user-agent": "undici",
  "accept-encoding": "gzip, deflate"
};

export default test(({ describe, beforeAll, beforeEach, afterAll }) => {
  let server: SpyServer;

  beforeAll(async () => {
    server = new SpyServer();
    await server.startAsync();
  });

  beforeEach(() => {
    server.reset();
  });

  afterAll(async () => {
    await server.stopAsync();
  });

  describe("normal instance", ({ it }) => {

    it("makes HTTP request", async () => {
      await requestAsync({
        url: `${URL_PREFIX}/my-path`,
        method: "post",
        headers: {
          "my-header": "my-value",
        },
        body: "my_request_body"
      });

      assert.deepEqual(server.lastRequest, {
        path: "/my-path",
        method: "POST",
        headers: {
          "my-header": "my-value",
          ...DEFAULT_FETCH_REQUEST_HEADERS,
          "content-length": "15",
        },
        body: "my_request_body",
      });
    });

    it("headers and body are optional", async () => {
      await requestAsync({
        url: `${URL_PREFIX}/my-path`,
        method: "post",
        headers: undefined,
        body: undefined,
      });

      assert.deepEqual(server.lastRequest, {
        path: "/my-path",
        method: "POST",
        headers: {
          ...DEFAULT_FETCH_REQUEST_HEADERS,
          "content-length": "0",
        },
        body: "",
      });
    });

    it("receives HTTP response", async () => {
      server.setResponse({
        status: 201,
        headers: {
          myResponseHeader: "header-value",
        },
        body: "my_response_body",
      });

      const { response } = await requestAsync();

      delete response.headers.date;
      assert.deepEqual(response, {
        status: 201,
        headers: {
          "myresponseheader": "header-value",
          // default server headers
          "connection": "keep-alive",
          "keep-alive": "timeout=5",
          "content-length": "16",
        },
        body: "my_response_body",
      });
    });

    it("tracks requests", async () => {
      const { requests } = await requestAsync({
        url: `${URL_PREFIX}/my-path`,
        method: "POST",
        headers: {
          "my-header": "my-value",
        },
        body: "my_request_body"
      });

      assert.deepEqual(requests.data, [{
        url: 'http://localhost:5011/my-path',
        method: "POST",
        headers: {
          "my-header": "my-value",
        },
        body: "my_request_body",
      }]);
    });

    it("normalizes tracked method and header names");

  });


  describe("nulled instance", ({ it }) => {

    it("doesn't make HTTP requests", async () => {
      await requestAsync({
        client: HttpClient.createNull(),
      });

      assert.equal(server.lastRequest, null);
    });

  });

});

async function requestAsync({
  client = HttpClient.create(),
  url = `${URL_PREFIX}/irrelevant_path`,
  method = "post",
  headers = undefined,
  body = undefined,
}: {
  client?: HttpClient,
  url?: string,
  method?: string,
  headers?: Record<string, string>,
  body?: string,
} = {}) {
  const requests = client.trackRequests();
  const response = await client.requestAsync({
    url,
    method: method,
    headers: headers,
    body: body,
  });

  return { response, requests };
}


interface SpyServerRequest {
  path?: string,
  method?: string,
  headers: http.IncomingHttpHeaders,
  body: string,
}

interface SpyServerResponse {
  status: number,
  headers: Record<string, string>,
  body: string,
}

class SpyServer {

  private readonly _httpServer;
  private _lastRequest!: null | SpyServerRequest;
  private _nextResponse!: SpyServerResponse;
  private _connections: net.Socket[] = [];

  constructor() {
    this._httpServer = http.createServer();
    this.reset();
  }

  reset() {
    this._lastRequest = null;
    this.setResponse();
  }

  get lastRequest() {
    return this._lastRequest;
  }

  setResponse(response = {
    status: 501,
    headers: {},
    body: ""
  }) {
    this._nextResponse = response;
  }

  async startAsync() {
    await new Promise<void>((resolve, reject) => {
      this._httpServer.listen(PORT);
      this._httpServer.on("listening", () => {
        resolve();
      });
      this._httpServer.on("connection", (socket: net.Socket) => {
        this._connections.push(socket);
      });
      this._httpServer.on("request", (request: http.IncomingMessage, response: http.ServerResponse) => {
        let body = "";
        request.on("data", (chunk: Buffer) => {
          body += chunk;
        });

        request.on("end", () => {
          this._lastRequest = {
            path: request.url,
            method: request.method,
            headers: request.headers,
            body,
          };

          response.statusCode = this._nextResponse.status;
          Object.entries(this._nextResponse.headers).forEach(([ key, value ]) => {
            response.setHeader(key, value);
          });
          response.end(this._nextResponse.body);
        });
      });
    });
  }

  async stopAsync() {
    await new Promise<void>((resolve, reject) => {
      this._httpServer.close();
      this._connections.forEach((socket) => {
        socket.destroy();
      });
      this._httpServer.on("close", () => {
        resolve();
      });
    });
  }

}
