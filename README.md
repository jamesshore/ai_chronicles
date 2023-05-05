# The AI Chronicles

A spaceship crashes on a planet. You emerge in the wreckage of a civilization, populated by robots. How will you survive and thrive?

The AI Chronicles is an experiment in using OpenAI/ChatGPT to create a role-playing game. It's build in React and TypeScript on the front end and Spring Boot, and Java.

We're building it live! Join us on Twitch every week at https://jitterted.stream. For more information, see https://www.jamesshore.com/s/ai-chronicles. Your hosts: [James Shore](https://www.jamesshore.com) and [Ted M. Young](https://ted.dev/about).


# Technical Approach

We are building The AI Chronicles using Extreme Programming practices, including pair programming, continuous integration, test-driven development, and more. For information, see [The Art of Agile Development 2nd ed.](https://www.jamesshore.com/v2/books/aoad2) by James Shore.

* Architecture:
  * Monolith with separate React front-end and Spring Boot back-end
  * Monorepo
  * [A-Frame Architecture](https://www.jamesshore.com/v2/projects/nullables/testing-without-mocks#a-frame-arch)
  * Testing using [Nullables](https://www.jamesshore.com/v2/projects/nullables)


# The Plan

This plan is based on Chapter 8, "Planning," of The Art of Agile Development.


## Vision

A compelling role-playing game in which the player negotiates with a complex civilization, trading off their goals, the goals of multiple factions, and survival.


## Mission

Goal: Build a proof-of-concept that demonstrates three major gameplay systems: conversation, environmental hazards, and conflict.

Non-goals:

* We are not yet supporting robot factions or conversations with more than one robot.
* We are not supporting persistence or multiple players at this time.


## Minimum Valuable Increments

* A conversation with a robot resulting in success or failure, where "success" is the robot agreeing to take us to shelter.
* (TBD: Additional MVI's involving environmental hazards and conflict.)


## User Stories

* Placeholder communication with OpenAI
* Placeholder web page
* Conversation with OpenAI via front-end
* ...


## Engineering Tasks

Story: Placeholder communication with OpenAI

(tbd)