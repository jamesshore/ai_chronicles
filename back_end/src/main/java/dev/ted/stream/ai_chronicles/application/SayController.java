package dev.ted.stream.ai_chronicles.application;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SayController {

  @PostMapping("/say")
  public SayResponse post() {
    return new SayResponse("hardcoded_answer");
  }
}

record SayResponse(String answer) {
}