package dev.ted.stream.ai_chronicles.infrastructure;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;


class OpenAiClientTest {

  @Test
  void sendsPromptToOpenAi() {
    JsonHttpClient httpClient = JsonHttpClient.createNull(Map.of(
      OpenAiClient.OPEN_AI_ENDPOINT, "don't care about response"
    ));
    var httpRequests = httpClient.trackRequests();
    OpenAiClient openAi = new OpenAiClient(httpClient, "my_api_key");
    openAi.prompt("my_prompt");

    JsonHttpRequest expectedRequest = JsonHttpRequest.createPost(
      OpenAiClient.OPEN_AI_ENDPOINT,
      Map.of(
        "Authorization", "Bearer my_api_key",
        "Content-Type", "application/json"
      ),
      new OpenAiRequestBody("gpt-3.5-turbo",
        List.of(new OpenAiRequestBody.Message("user", "my_prompt")),
        0.7
      )
    );
    assertThat(httpRequests.output()).containsExactly(expectedRequest);
  }

  @Test
  @Disabled
  void parsesOpenAiResponse() {
    JsonHttpClient httpClient = JsonHttpClient.createNull(Map.of(
      OpenAiClient.OPEN_AI_ENDPOINT, "what will be parsed here?"
    ));
    var httpRequests = httpClient.trackRequests();
    OpenAiClient openAi = new OpenAiClient(httpClient, "my_api_key");

    String message = openAi.prompt("my_prompt");

    assertThat(message)
      .isEqualTo("the parsed response");


/**
 * HTTP/1.1 200 OK
 * Date: Mon, 22 May 2023 20:51:01 GMT
 * Content-Type: application/json
 * Transfer-Encoding: chunked
 * Connection: keep-alive
 * access-control-allow-origin: *
 * Cache-Control: no-cache, must-revalidate
 * openai-model: gpt-3.5-turbo-0301
 * openai-organization: user-jllqpwvsdh23ln5gwvpjjfir
 * openai-processing-ms: 1855
 * openai-version: 2020-10-01
 * strict-transport-security: max-age=15724800; includeSubDomains
 * x-ratelimit-limit-requests: 3500
 * x-ratelimit-limit-tokens: 90000
 * x-ratelimit-remaining-requests: 3499
 * x-ratelimit-remaining-tokens: 89959
 * x-ratelimit-reset-requests: 17ms
 * x-ratelimit-reset-tokens: 26ms
 * x-request-id: 6c2312d084fefeb424fe5a229df94ecc
 * CF-Cache-Status: DYNAMIC
 * Server: cloudflare
 * CF-RAY: 7cb7ef3f2e7dc69c-SEA
 * Content-Encoding: br
 * alt-svc: h3=":443"; ma=86400, h3-29=":443"; ma=86400
 *
 * {
 *   "id": "chatcmpl-7J6mZzHXNqVJeEd7TGfdMN3whQVL8",
 *   "object": "chat.completion",
 *   "created": 1684788659,
 *   "model": "gpt-3.5-turbo-0301",
 *   "usage": {
 *     "prompt_tokens": 29,
 *     "completion_tokens": 16,
 *     "total_tokens": 45
 *   },
 *   "choices": [
 *     {
 *       "message": {
 *         "role": "assistant",
 *         "content": "\"Hello, my name is [insert name here]. I come in peace.\""
 *       },
 *       "finish_reason": "stop",
 *       "index": 0
 *     }
 *   ]
 * }
 */

  }

    // a. Create a Nulled HttpClient
    // b. Make the request
    // c. Check that the correct request was made

//        POST https://api.openai.com/v1/chat/completions
//        Authorization: Bearer {{openai}}
//        Content-Type: application/json
//
//        {
//            "model": "gpt-3.5-turbo",
//                "messages": [
//            {
//                "role": "user",
//                    "content": "Pretend you have crashed on a planet populated by robots. What is the first thing you say?"
//            }
//  ],
//            "temperature": 0.7
//        }


  @Test
  void parsesResponseFromOpenAi() {
    // Test 2: Parses the HTTP response
    // a. Create a Nulled HttpClient with a specific response hardcoded
    // b. Make the request
    // c. Check the return value to see that the response was parsed correctly


    // Test 3..n: Error handling

    // Including Paranoic telemetry
  }
}