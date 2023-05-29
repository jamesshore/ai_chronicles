import { test, assert } from "../util/tests.js";
import http from "node:http";

const PORT = 5011;

export default test(({ describe, it, beforeAll, afterAll }) => {
  let server;

  beforeAll(async () => {
    server = new SpyServer();
    await server.startAsync();
  });

  afterAll(async () => {
    await server.stopAsync();
  });

  it("makes HTTP requests", async () => {
    const options = {
      method: "post",
      headers: {
        "content-type": "application/json",
        "my-header": "my-value",
      },
      body: JSON.stringify({
        myRequestBody: "request-body",
      }),
    };
    const response = await fetch(`http://localhost:${PORT}/my-path`, options);

    assert.deepEqual(server.lastRequest, {
      path: "/my-path",
      method: "POST",
      headers: {
        host: `localhost:${PORT}`,
        connection: "keep-alive",
        "content-type": "application/json",
        "my-header": "my-value",
        accept: "*/*",
        "accept-language": "*",
        "sec-fetch-mode": "cors",
        "user-agent": "undici",
        "accept-encoding": "gzip, deflate",
        "content-length": "32",
      },
      body: JSON.stringify({
        myRequestBody: "request-body",
      }),
    });

    assert.equal(response.status, 418);
    const headers = Object.fromEntries(response.headers.entries());
    delete headers["content-length"];
    delete headers.date;

    assert.deepEqual(headers, {
      connection: "close",
      "content-type": "application/json",
    });

    assert.deepEqual(await response.json(), {
      body: "my_body",
    });
  });

});


class SpyServer {

  private readonly _httpServer;
  private _lastRequest;

  constructor() {
    this._httpServer = http.createServer();
    this._lastRequest = null;
  }

  get lastRequest() {
    return this._lastRequest;
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


          // prevent client from keeping connection open and preventing the server from stopping
          response.statusCode = 418;
          response.setHeader("connection", "close");
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ body: "my_body" }));
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
