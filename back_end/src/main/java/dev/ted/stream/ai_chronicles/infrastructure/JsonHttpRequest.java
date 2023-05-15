package dev.ted.stream.ai_chronicles.infrastructure;

import org.springframework.http.HttpMethod;

import java.util.Collections;
import java.util.Map;
import java.util.Objects;

public class JsonHttpRequest {
  private final HttpMethod httpMethod;
  private final String url;
  private final Map<String, String> headers;
  private final Object body;

  public static JsonHttpRequest createGet(String url) {
    return new JsonHttpRequest(HttpMethod.GET, url, Collections.emptyMap(), null);
  }

  public static JsonHttpRequest createPost(String url, Map<String, String> headers, Object body) {
    return new JsonHttpRequest(HttpMethod.POST, url, headers, body);
  }

  private JsonHttpRequest(HttpMethod httpMethod, String url, Map<String, String> headers, Object body) {
    this.httpMethod = httpMethod;
    this.url = url;
    this.headers = headers;
    this.body = body;
  }

  public HttpMethod httpMethod() {
    return httpMethod;
  }

  public String url() {
    return url;
  }

  public Object body() {
    return body;
  }

  public Map<String, String> headers() {
    return headers;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    JsonHttpRequest that = (JsonHttpRequest) o;

    if (!httpMethod.equals(that.httpMethod)) return false;
    if (!url.equals(that.url)) return false;
    if (!headers.equals(that.headers)) return false;
    return Objects.equals(body, that.body);
  }

  @Override
  public int hashCode() {
    int result = httpMethod.hashCode();
    result = 31 * result + url.hashCode();
    result = 31 * result + headers.hashCode();
    result = 31 * result + (body != null ? body.hashCode() : 0);
    return result;
  }

  @Override
  public String toString() {
    return "JsonHttpRequest: " +
      "httpMethod=" + httpMethod +
      ", url='" + url + '\'' +
      ", headers=" + headers +
      ", body=" + body;
  }
}
