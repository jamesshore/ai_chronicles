import { strict as assert } from "node:assert";
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hello from "./hello.js";
import "global-jsdom/register";

describe("index", () => {

  it("runs test", () => {
    render(<Hello />);
  });

});