package dev.ted.stream.ai_chronicles.infrastructure;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class OpenAiClientJsonTests {

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void responseBodyObjectSerializesToJson() throws JsonProcessingException {
        OpenAiResponseBody openAiResponseBody = new OpenAiResponseBody(
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

        String json = objectMapper.writeValueAsString(openAiResponseBody);

        assertThat(json)
                .isEqualTo("""
                           {"id":"irrelevant_id","object":"irrelevant_object","created":42,"model":"irrelevant_model","usage":{"prompt_tokens":42,"completion_tokens":42,"total_tokens":42},"choices":[{"message":{"role":"irrelevant role","content":"my_open_ai_response"},"finish_reason":"irrelevant_reason","index":42}]}""");
    }

    @Test
    void jsonDeserializesToResponseBodyObject() throws JsonProcessingException {
        String json = """
                {"id":"chatcmpl-7LcIqfBQeihcsnuXgGZg8Pekqky8z",
                "object":"chat.completion",
                "created":1685386480,
                "model":"gpt-3.5-turbo-0301",
                "usage":{"prompt_tokens":37,"completion_tokens":183,"total_tokens":220},
                "choices":[{"message":{"role":"assistant","content":"I would maintain a positive attitude and keep an open mind as I navigate this new and unfamiliar world, hoping to find a way back home."},
                "finish_reason":"stop",
                "index":0}]}
                """;
        OpenAiResponseBody responseBody = objectMapper.readValue(json, OpenAiResponseBody.class);

        OpenAiResponseBody expectedResponseBody = new OpenAiResponseBody(
                "chatcmpl-7LcIqfBQeihcsnuXgGZg8Pekqky8z",
                "chat.completion",
                1685386480,
                "gpt-3.5-turbo-0301",
                new Usage(37, 183, 220),
                new Choice[]{
                        new Choice(
                                new Message("assistant",
                                            "I would maintain a positive attitude and keep an open mind as I navigate this new and unfamiliar world, hoping to find a way back home."),
                                "stop",
                                0
                        )}
        );
        assertThat(responseBody)
                .isEqualTo(expectedResponseBody);
    }

}
