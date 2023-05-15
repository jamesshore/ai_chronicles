package dev.ted.stream.ai_chronicles.infrastructure;

import dev.ted.stream.ai_chronicles.OutputTracker;
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
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull();

    assertThatThrownBy(() -> {
      jsonHttpClient.get("/unconfigured", ExampleResponse.class);
    }).isInstanceOf(NoSuchElementException.class)
      .hasMessage("URL not configured: /unconfigured");
  }

  @Test
  void nulledPostForUnconfiguredEndpointThrowsNotFoundException() {
    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull();

    assertThatThrownBy(() -> {
      jsonHttpClient.post("/unconfigured", IRRELEVANT_HEADERS, IRRELEVANT_BODY);
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
  void nulledGetReturnsDifferentValuesBasedOnUriAndParameters() {
    ExampleResponse configuredExampleResponse1A = new ExampleResponse("configured 1a");
    ExampleResponse configuredExampleResponse1B = new ExampleResponse("configured 1b");
    ExampleResponse configuredExampleResponse2 = new ExampleResponse("configured 2");

    JsonHttpClient jsonHttpClient = JsonHttpClient.createNull(Map.of(
      "/configured1?parm=a", configuredExampleResponse1A,
      "/configured1?parm=b", configuredExampleResponse1B,
      "/configured2", configuredExampleResponse2)
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
    jsonHttpClient.post("/post-endpoint", headers, postedBody);

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