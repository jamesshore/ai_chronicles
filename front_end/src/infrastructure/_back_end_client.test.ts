import { assert, test } from "../util/tests.js";
import { HttpClient } from "./http_client.js";
import { BackEndClient } from "./back_end_client.js";

const IRRELEVANT_SAY = "irrelevant_say";

export default test(({ it }) => {

  it("sends requests", async () => {
    const httpClient = HttpClient.createNull();
    const httpRequests = httpClient.trackRequests();

    const backEndClient = new BackEndClient(httpClient);
    await backEndClient.sayAsync("my_message");

    assert.deepEqual(httpRequests.data, [{
      url: "http://localhost:5020/say",
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "my_message",
      }),
    }]);
  });

  // it("parses responses", async () => {
  //   const httpClient = HttpClient.createNull({
  //     "/say": {
  //       status: 200,
  //       headers: {
  //         "content-type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         answer: "back_end_answer",
  //       }),
  //     }
  //   });
  //
  //   const backEndClient = new BackEndClient(httpClient);
  //   const answer = await backEndClient.sayAsync(IRRELEVANT_SAY);
  //
  //   assert.equal(answer, "back_end_answer");
  // });

});