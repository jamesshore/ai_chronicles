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
    console.log("client: Making request");
    const response = await fetch("http://localhost:" + PORT);
    console.log("client: Request finished");

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
    console.log(response);
  });

});


class SpyServer {

  private readonly httpServer;
  private lastRequest;

  constructor() {
    this.httpServer = http.createServer();
    this.lastRequest = null;
  }

  async startAsync() {
    await new Promise((resolve, reject) => {
      this.httpServer.listen(PORT);
      this.httpServer.on("listening", () => {
        resolve();
      });
      this.httpServer.on("request", (request, response) => {
        console.log("server: receiving request");
        request.resume();
        request.on("end", () => {
          console.log("server: request received");

          console.log("server: sending response");

          // prevent client from keeping connection open and preventing the server from stopping
          response.statusCode = 418;
          response.setHeader("connection", "close");
          response.setHeader("content-type", "application/json");
          response.end(JSON.stringify({ body: "my_body" }));

          console.log("server: response sent");
        });
      });
    });
    console.log("server: started");
  }

  async stopAsync() {
    console.log("server: attempting to stop");
    await new Promise((resolve, reject) => {
      this.httpServer.close();
      this.httpServer.on("close", () => {
        resolve();
      });
    });
    console.log("server: stopped");
  }

}
