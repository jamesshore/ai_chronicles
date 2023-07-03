package dev.ted.stream.ai_chronicles.infrastructure;

import dev.ted.stream.ai_chronicles.OutputListener;
import dev.ted.stream.ai_chronicles.OutputTracker;

import java.util.List;
import java.util.Map;

public class OpenAiClient {
  static final String OPEN_AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

  private final JsonHttpClient httpClient;
  private final String apiKey;
  private final OutputListener<Prompt> listener = new OutputListener<>();

  public static OpenAiClient create(String apiKey) {
    return new OpenAiClient(JsonHttpClient.create(), apiKey);
  }

  public static OpenAiClient createNull() {
    return createNull("nulled_OpenAiClient_response");
  }

  public static OpenAiClient createNull(String configuredAnswer) {
    JsonHttpClient httpClient = JsonHttpClient.createNull(Map.of(
      OpenAiClient.OPEN_AI_ENDPOINT, createNulledHttpResponse(configuredAnswer)
    ));
    return new OpenAiClient(httpClient, "nulled_api_key");
  }

  public OpenAiClient(JsonHttpClient httpClient, String apiKey) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
  }

  public String prompt(String prompt) {
    listener.emit(new Prompt(prompt));

    Map<String, String> headers = Map.of(
      "Authorization", "Bearer " + apiKey,
      "Content-Type", "application/json"
    );
    var response = httpClient.post(
      OPEN_AI_ENDPOINT,
      OpenAiResponseBody.class,
      headers,
      new OpenAiRequestBody(
        "gpt-3.5-turbo",
        List.of(new OpenAiRequestBody.Message("user", prompt)),
        0.7
      )
    );

    return response.choices()[0].message().content();
  }

  public OutputTracker<Prompt> trackPrompts() {
    return listener.createTracker();
  }

  private static OpenAiResponseBody createNulledHttpResponse(String response) {
    return new OpenAiResponseBody(
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
          response
        ),
        "irrelevant_reason",
        42
      )}
    );
  }

  record Prompt(String prompt) {
  }

}
