import { assert, test } from "../util/tests.js";
import { HttpClient } from "./http_client.js";
import { BackEndClient } from "./back_end_client.js";

export default test(({ it }) => {

  it.skip("sends requests", () => {
    const httpClient = HttpClient.createNull();
    const httpRequests = httpClient.trackRequests();

    const backEndClient = new BackEndClient(httpClient);
    backEndClient.say("my_message");

    assert.deepEqual(httpRequests.data, [{
      path: "/say",
      method: "post",
      headers: "application/json",
      body: JSON.stringify({
        message: "my_message",
      }),
    }]);
  });

  it("parses responses");

});