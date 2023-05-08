package dev.ted.stream.ai_chronicles.infrastructure;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;


class OpenAiClientTest {
    // Test 0:
    // Manually figure out what the request and responses actually are

    @Disabled
    @Test
    void sendsPromptToOpenAi() {
        JsonHttpClient httpClient = JsonHttpClient.createNull();
        var httpRequests = httpClient.trackRequests();

        OpenAiClient openAi = new OpenAiClient(httpClient, "my_api_key");
        openAi.prompt("my_prompt");

        assertThat(httpRequests.output())
                .containsExactly(JsonHttpRequest.createPost("https://api.openai.com/v1/chat/completions", new Object()));



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


    }

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