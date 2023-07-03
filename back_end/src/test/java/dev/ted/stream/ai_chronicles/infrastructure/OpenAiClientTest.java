package dev.ted.stream.ai_chronicles.infrastructure;

import dev.ted.stream.ai_chronicles.OutputTracker;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class OpenAiClientTest {

  private static final OpenAiResponseBody IRRELEVANT_RESPONSE_BODY = new OpenAiResponseBody(
    "irrelevant_id",
    "irrelevant_object",
    42,
    "irrelevant_model",
    new Usage(
      42,
      42,
      42
    ),
    new Choice[]{new Choice(
      new Message(
        "irrelevant role",
        "my_open_ai_response"
      ),
      "irrelevant_reason",
      42
    )}
  );

  @Test
  void sendsPromptToOpenAi() {
    JsonHttpClient httpClient = JsonHttpClient.createNull(Map.of(
      OpenAiClient.OPEN_AI_ENDPOINT, IRRELEVANT_RESPONSE_BODY
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
    assertThat(httpRequests.output())
      .containsExactly(expectedRequest);
  }

  @Test
  void parsesOpenAiResponse() {
    JsonHttpClient httpClient = JsonHttpClient.createNull(Map.of(
      OpenAiClient.OPEN_AI_ENDPOINT, new OpenAiResponseBody(
        "irrelevant_id",
        "irrelevant_object",
        42,
        "irrelevant_model",
        new Usage(
          42,
          42,
          42
        ),
        new Choice[] {new Choice(
          new Message(
            "irrelevant role",
            "my_open_ai_response"
          ),
          "irrelevant_reason",
          42
        )}
      )
    ));
    OpenAiClient openAi = new OpenAiClient(httpClient, "my_api_key");

    String message = openAi.prompt("my_prompt");

    assertThat(message)
      .isEqualTo("my_open_ai_response");
  }

  @Test
  void tracksPrompts() {
    OpenAiClient openAi = createOpenAiClient();
    OutputTracker<OpenAiClient.Prompt> prompts = openAi.trackPrompts();

    openAi.prompt("my_prompt");

    OpenAiClient.Prompt expectedPrompt = new OpenAiClient.Prompt("my_prompt");
    assertThat(prompts.output())
      .containsExactly(expectedPrompt);
  }

  @Test
  void nulledClientProvidesDefaultResponse() {
    OpenAiClient openAi = OpenAiClient.createNull();

    String response = openAi.prompt("irrelevant_prompt");

    assertThat(response)
      .isEqualTo("nulled_OpenAiClient_response");
  }

  @Test
  void nulledClientProvidesConfiguredResponse() {
    OpenAiClient openAi = OpenAiClient.createNull("my_response");

    String response = openAi.prompt("irrelevant_prompt");

    assertThat(response)
      .isEqualTo("my_response");
  }

  @NotNull
  private static OpenAiClient createOpenAiClient() {
    JsonHttpClient httpClient = JsonHttpClient.createNull(Map.of(
      OpenAiClient.OPEN_AI_ENDPOINT, IRRELEVANT_RESPONSE_BODY
    ));
    return new OpenAiClient(httpClient, "irrelevant_api_key");
  }

}