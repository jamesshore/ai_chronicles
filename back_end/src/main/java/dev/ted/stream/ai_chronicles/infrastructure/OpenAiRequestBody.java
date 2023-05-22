package dev.ted.stream.ai_chronicles.infrastructure;

import java.util.List;

public record OpenAiRequestBody(String model,
                                List<Message> messages,
                                double temperature) {
  record Message(String role, String content) {
  }
}
