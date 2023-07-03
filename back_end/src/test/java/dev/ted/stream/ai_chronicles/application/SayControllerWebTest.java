package dev.ted.stream.ai_chronicles.application;

import org.junit.jupiter.api.Test;
import org.skyscreamer.jsonassert.JSONAssert;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
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
  void acceptsPostRequests() throws Exception {
    mockMvc.perform(post("/say"))
      .andExpect(MockMvcResultMatchers.status().is2xxSuccessful());
  }

  @Test
  void returnsResponse() throws Exception {
    MvcResult result = mockMvc.perform(post("/say"))
      .andExpect(MockMvcResultMatchers.status().isOk())
      .andReturn();

    assertThat(result.getResponse().getHeader("content-type"))
      .isEqualTo("application/json");

    JSONAssert.assertEquals("""
        { "answer": "hardcoded_answer" }
      """,
      result.getResponse().getContentAsString(), false);
  }

}
