package dev.ted.stream.ai_chronicles.infrastructure;

import java.util.Arrays;
import java.util.Objects;

public record OpenAiResponseBody(String id,
                                 String object,
                                 long created,
                                 String model,
                                 Usage usage,
                                 Choice[] choices) {
    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        OpenAiResponseBody that = (OpenAiResponseBody) o;
        return created == that.created && Objects.equals(id, that.id) && Objects.equals(object, that.object) && Objects.equals(model, that.model) && Objects.equals(usage, that.usage) && Arrays.equals(choices, that.choices);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(id, object, created, model, usage);
        result = 31 * result + Arrays.hashCode(choices);
        return result;
    }
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
