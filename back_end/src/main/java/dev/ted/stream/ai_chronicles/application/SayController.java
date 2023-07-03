package dev.ted.stream.ai_chronicles.application;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SayController {

  @PostMapping("/say")
  public SayResponse post(@Valid @RequestBody SayRequest request) {
    return new SayResponse("hardcoded_answer");
  }
}

record SayRequest(@NotBlank String message) {
}

record SayResponse(String answer) {
}