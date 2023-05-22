package dev.ted.stream.ai_chronicles.infrastructure;

public record OpenAiResponseBody(String id,
                                 String object,
                                 long created,
                                 String model,
                                 Usage usage,
                                 Choice[] choices) {
}

record Usage(int prompt_tokens,
             int completion_tokens,
             int total_tokens) {
}

record Choice(Message message,
              String finish_reason,
              int index) {

}

record Message(String role, String content) {
}
