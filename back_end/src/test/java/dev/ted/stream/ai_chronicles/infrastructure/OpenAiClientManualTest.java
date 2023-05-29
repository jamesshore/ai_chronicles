package dev.ted.stream.ai_chronicles.infrastructure;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@Tag("manual")
@Disabled
class OpenAiClientManualTest {

    @Test
    void manualTestAgainstRealOpenAiService() {
        String API_KEY = "";
        String PROMPT = "Pretend you have crashed on a planet populated by robots. What is the first thing you say?";

        OpenAiClient openAiClient = OpenAiClient.create(API_KEY);
        String response = openAiClient.prompt(PROMPT);
        assertThat(response)
                .isEqualTo("manually check response here");
    }

}