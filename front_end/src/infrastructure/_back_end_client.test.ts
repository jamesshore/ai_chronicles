import { assert, test } from "../util/tests.js";
import { HttpClient } from "./http_client.js";
import { BackEndClient } from "./back_end_client.js";

export default test(({ it }) => {

  it("sends requests", async () => {
    const { httpRequests } = await sayAsync({ message: "my_message" });

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

  it("parses responses", async () => {
    const { answer } = await sayAsync({ configuredAnswer: "back_end_answer" });
    assert.equal(answer, "back_end_answer");
  });

});

async function sayAsync({
  message = "irrelevant_message",
  configuredAnswer = "irrelevant_configured_answer",
}) {
  const httpClient = HttpClient.createNull({
    "http://localhost:5020/say": {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        answer: configuredAnswer,
      }),
    },
  });
  const httpRequests = httpClient.trackRequests();

  const backEndClient = new BackEndClient(httpClient);
  const answer = await backEndClient.sayAsync(message);
  return { httpRequests, answer };
}
