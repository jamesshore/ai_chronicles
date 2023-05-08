package dev.ted.stream.ai_chronicles.infrastructure;

public class OpenAiClient {
    private static final String OPEN_AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
    private JsonHttpClient httpClient;

    public OpenAiClient(JsonHttpClient httpClient, String apiKey) {
        this.httpClient = httpClient;
    }

    public String prompt(String prompt) {
        httpClient.post(OPEN_AI_ENDPOINT, new Object());

        return null;
    }
}
