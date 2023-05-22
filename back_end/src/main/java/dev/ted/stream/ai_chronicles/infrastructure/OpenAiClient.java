package dev.ted.stream.ai_chronicles.infrastructure;

import java.util.List;
import java.util.Map;

public class OpenAiClient {
  static final String OPEN_AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

  private JsonHttpClient httpClient;
  private final String apiKey;

  public OpenAiClient(JsonHttpClient httpClient, String apiKey) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
  }

  public String prompt(String prompt) {
    Map<String, String> headers = Map.of(
      "Authorization", "Bearer " + apiKey,
      "Content-Type", "application/json"
    );
    httpClient.post(OPEN_AI_ENDPOINT, Void.class, headers, new OpenAiRequestBody("gpt-3.5-turbo",
      List.of(new OpenAiRequestBody.Message("user", prompt)),
      0.7
    ));

    return null;
  }
}
