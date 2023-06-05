import { assert, test } from "../util/tests.js";
import http from "node:http";

const PORT = 5011;

async function requestAsync({ url, method, headers, body, }) {
  const fetchOptions = { method, headers, body };
  const fetchResponse = await fetch(url, fetchOptions);

  return {
    status: fetchResponse.status,
    headers: Object.fromEntries(fetchResponse.headers.entries()),
    body: await fetchResponse.text(),
  };
}

export default test(({ describe, it, beforeAll, beforeEach, afterAll }) => {
  let server;

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

  it("makes HTTP requests", async () => {
    server.setResponse({
      status: 201,
      headers: {
        myResponseHeader: "header-value",
        // prevent client from keeping connection open and preventing the server from stopping
        connection: "close",
      },
      body: "my_response_body",
    });


    const response = await requestAsync({
      url: `http://localhost:${PORT}/my-path`,
      method: "post",
      headers: {
        "my-header": "my-value",
      },
      body: "my_request_body",
    });

    delete response.headers["content-length"];
    delete response.headers.date;
    assert.deepEqual(response, {
      status: 201,
      headers: {
        connection: "close",
        myresponseheader: "header-value",
      },
      body: "my_response_body",
    });

    assert.deepEqual(server.lastRequest, {
      path: "/my-path",
      method: "POST",
      headers: {
        host: `localhost:${PORT}`,
        connection: "keep-alive",
        "my-header": "my-value",
        "content-type": "text/plain;charset=UTF-8",
        accept: "*/*",
        "accept-language": "*",
        "sec-fetch-mode": "cors",
        "user-agent": "undici",
        "accept-encoding": "gzip, deflate",
        "content-length": "15",
      },
      body: "my_request_body",
    });
  });

});


class SpyServer {

  private readonly _httpServer;
  private _lastRequest;
  private _nextResponse;

  constructor() {
    this._httpServer = http.createServer();
    this.reset();
  }

  reset() {
    this._lastRequest = null;
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
    await new Promise((resolve, reject) => {
      this._httpServer.listen(PORT);
      this._httpServer.on("listening", () => {
        resolve();
      });
      this._httpServer.on("request", (request, response) => {
        let body = "";
        request.on("data", (chunk) => {
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
    await new Promise((resolve, reject) => {
      this._httpServer.close();
      this._httpServer.on("close", () => {
        resolve();
      });
    });
  }

}
