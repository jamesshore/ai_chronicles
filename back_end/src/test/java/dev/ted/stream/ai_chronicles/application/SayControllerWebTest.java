package dev.ted.stream.ai_chronicles.application;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.skyscreamer.jsonassert.JSONAssert;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@WebMvcTest
public class SayControllerWebTest {

  @Autowired
  MockMvc mockMvc;

  @Test
  void acceptsPostAndReturnsResponse() throws Exception {
    MvcResult result = mockMvc.perform(post("/say")
      .contentType(MediaType.APPLICATION_JSON)
      .content("""
          {"message": "irrelevant_message"}"""))
      .andReturn();
    MockHttpServletResponse response = result.getResponse();

    assertThat(response.getStatus())
      .isEqualTo(200);

    assertThat(response.getHeader("content-type"))
      .isEqualTo("application/json");

    JSONAssert.assertEquals("""
          { "answer": "hardcoded_answer" }
        """,
      response.getContentAsString(), false);
  }

}
