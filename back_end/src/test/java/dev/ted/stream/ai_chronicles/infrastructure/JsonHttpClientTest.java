package dev.ted.stream.ai_chronicles.infrastructure;

import dev.ted.stream.ai_chronicles.OutputTracker;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JsonHttpClientTest {

  public static final Map<String, String> IRRELEVANT_HEADERS = Collections.emptyMap();
  public static final ExampleBody IRRELEVANT_BODY = new ExampleBody("irrelevant body");

  @Test
  void nulledGetForUnconfiguredEndpointsThrowsNotFoundException() {
    // Although Nullables typically have a useful default, that's not possible
    // for JsonHttpClient because the response is always context-specific.

    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull();

    assertThatThrownBy(() -> {
      jsonHttpClient.get("/unconfigured", ExampleResponse.class);
    }).isInstanceOf(NoSuchElementException.class)
      .hasMessage("URL not configured: /unconfigured");
  }

  @Test
  void nulledPostForUnconfiguredEndpointThrowsNotFoundException() {
    // Although Nullables typically have a useful default, that's not possible
    // for JsonHttpClient because the response is always context-specific.

    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull();

    assertThatThrownBy(() -> {
      jsonHttpClient.post("/unconfigured", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    }).isInstanceOf(NoSuchElementException.class)
      .hasMessage("URL not configured: /unconfigured");
  }

  @Test
  void nulledGetReturnsSingleConfiguredInstanceForever() {
    ExampleResponse configuredExampleResponse = new ExampleResponse("configured value");

    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/configured", configuredExampleResponse)
    );

    ExampleResponse exampleResponse1 = jsonHttpClient.get("/configured", ExampleResponse.class);
    assertThat(exampleResponse1.getContent())
      .isEqualTo("configured value");

    ExampleResponse exampleResponse2 = jsonHttpClient.get("/configured", ExampleResponse.class);
    assertThat(exampleResponse2.getContent())
      .isEqualTo("configured value");

    ExampleResponse exampleResponse3 = jsonHttpClient.get("/configured", ExampleResponse.class);
    assertThat(exampleResponse3.getContent())
      .isEqualTo("configured value");
  }

  @Test
  void nulledPostReturnsSingleConfiguredInstanceForever() {
    ExampleResponse configuredExampleResponse = new ExampleResponse("configured value");

    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/configured", configuredExampleResponse)
    );

    ExampleResponse exampleResponse1 = jsonHttpClient.post("/configured", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse1.getContent())
      .isEqualTo("configured value");

    ExampleResponse exampleResponse2 = jsonHttpClient.post("/configured", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse2.getContent())
      .isEqualTo("configured value");

    ExampleResponse exampleResponse3 = jsonHttpClient.post("/configured", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse3.getContent())
      .isEqualTo("configured value");
  }

  @Test
  void nulledGetReturnsDifferentConfiguredInstancesWhenGivenList() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/configured-list", List.of(
        new ExampleResponse("dto 1"),
        new ExampleResponse("dto 2"),
        new ExampleResponse("dto 3"))));

    ExampleResponse exampleResponse1 = jsonHttpClient.get("/configured-list",
      ExampleResponse.class);
    assertThat(exampleResponse1.getContent())
      .isEqualTo("dto 1");

    ExampleResponse exampleResponse2 = jsonHttpClient.get("/configured-list",
      ExampleResponse.class);
    assertThat(exampleResponse2.getContent())
      .isEqualTo("dto 2");

    ExampleResponse exampleResponse3 = jsonHttpClient.get("/configured-list",
      ExampleResponse.class);
    assertThat(exampleResponse3.getContent())
      .isEqualTo("dto 3");
  }

  @Test
  void nulledPostReturnsDifferentConfiguredInstancesWhenGivenList() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/configured-list", List.of(
        new ExampleResponse("dto 1"),
        new ExampleResponse("dto 2"),
        new ExampleResponse("dto 3"))));

    ExampleResponse exampleResponse1 = jsonHttpClient.post("/configured-list", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse1.getContent())
      .isEqualTo("dto 1");

    ExampleResponse exampleResponse2 = jsonHttpClient.post("/configured-list", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse2.getContent())
      .isEqualTo("dto 2");

    ExampleResponse exampleResponse3 = jsonHttpClient.post("/configured-list", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse3.getContent())
      .isEqualTo("dto 3");
  }

  @Test
  void nulledGetThrowsExceptionWhenListOfConfiguredInstancesRunsOut() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/list-of-one?a=b", List.of(new ExampleResponse("dto 1")))
    );
    jsonHttpClient.get("/list-of-one?a={parm}", ExampleResponse.class, "b");

    assertThatThrownBy(() -> jsonHttpClient.get("/list-of-one?a={parm}", ExampleResponse.class, "b"))
      .isInstanceOf(NoSuchElementException.class)
      .hasMessage("No more responses configured for URL: /list-of-one?a=b");
  }

  @Test
  void nulledPostThrowsExceptionWhenListOfConfiguredInstancesRunsOut() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/list-of-one", List.of(new ExampleResponse("dto 1")))
    );
    jsonHttpClient.post("/list-of-one", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);

    assertThatThrownBy(() -> jsonHttpClient.post("/list-of-one", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY))
      .isInstanceOf(NoSuchElementException.class)
      .hasMessage("No more responses configured for URL: /list-of-one");
  }

  @Test
  void nulledGetFailsFastWhenConfiguredResponseDoesntMatchExpectedResponseType() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/endpoint", "incorrect_configured_response")
    );

    assertThatThrownBy(() -> {
      var response = jsonHttpClient.get("/endpoint", ExampleResponse.class);
    })
      .isInstanceOf(ClassCastException.class)
      .hasMessage("URL /endpoint was configured to return an instance of\n" +
        "  class java.lang.String\n" +
        "but the request said the response should be cast to\n" +
        "  class dev.ted.stream.ai_chronicles.infrastructure.JsonHttpClientTest$ExampleResponse");
  }

  @Test
  void nulledPostFailsFastWhenConfiguredResponseDoesntMatchExpectedResponseType() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of("/endpoint", "incorrect_configured_response")
    );

    assertThatThrownBy(() -> jsonHttpClient.post("/endpoint", ExampleResponse.class, Collections.emptyMap(), null))
      .isInstanceOf(ClassCastException.class)
      .hasMessage("URL /endpoint was configured to return an instance of\n" +
        "  class java.lang.String\n" +
        "but the request said the response should be cast to\n" +
        "  class dev.ted.stream.ai_chronicles.infrastructure.JsonHttpClientTest$ExampleResponse");
  }

  @Test
  void nulledGetReturnsDifferentValuesBasedOnUriAndParameters() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(Map.of(
      "/configured1?parm=a", new ExampleResponse("configured 1a"),
      "/configured1?parm=b", new ExampleResponse("configured 1b"),
      "/configured2", new ExampleResponse("configured 2"))
    );

    ExampleResponse exampleResponse1A = jsonHttpClient.get("/configured1?parm={first}",
      ExampleResponse.class,
      "a");
    assertThat(exampleResponse1A.getContent())
      .isEqualTo("configured 1a");

    ExampleResponse exampleResponse1B = jsonHttpClient.get("/configured1?parm={first}",
      ExampleResponse.class,
      "b");
    assertThat(exampleResponse1B.getContent())
      .isEqualTo("configured 1b");

    ExampleResponse exampleResponse2 = jsonHttpClient.get("/configured2", ExampleResponse.class);
    assertThat(exampleResponse2.getContent())
      .isEqualTo("configured 2");
  }

  @Test
  void nulledPostReturnsDifferentValuesBasedOnUri() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(Map.of(
      "/configured1", new ExampleResponse("configured 1"),
      "/configured2", new ExampleResponse("configured 2"))
    );

    ExampleResponse exampleResponse1 = jsonHttpClient.post("/configured1", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse1.getContent())
      .isEqualTo("configured 1");

    ExampleResponse exampleResponse2 = jsonHttpClient.post("/configured2", ExampleResponse.class, IRRELEVANT_HEADERS, IRRELEVANT_BODY);
    assertThat(exampleResponse2.getContent())
      .isEqualTo("configured 2");
  }

  @Test
  void getAndPostRequestsAreTracked() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(
      Map.of(
        "/get-endpoint?a", new ExampleResponse(),
        "/post-endpoint", new ExampleResponse()
      )
    );

    OutputTracker<JsonHttpRequest> tracker = jsonHttpClient.trackRequests();

    jsonHttpClient.get("/get-endpoint?{parm}", ExampleResponse.class, "a");

    Map<String, String> headers = Map.of("header1", "value1", "header2", "value2");
    ExampleBody postedBody = new ExampleBody("post");
    jsonHttpClient.post("/post-endpoint", ExampleResponse.class, headers, postedBody);

    assertThat(tracker.output())
      .containsExactly(
        JsonHttpRequest.createGet("/get-endpoint?a"),
        JsonHttpRequest.createPost("/post-endpoint", headers, postedBody));
  }


  public static class ExampleResponse {
    private String content;

    public ExampleResponse() {
      content = "initial value";
    }

    public ExampleResponse(String configuredValue) {
      content = configuredValue;
    }

    public String getContent() {
      return content;
    }
  }

  public record ExampleBody(String bodyText) {
  }

}