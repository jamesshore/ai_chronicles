import { strict as assert } from "node:assert";
import {render, screen, cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hello from "./hello.js";
import "global-jsdom/register";

describe("Hello", () => {

  afterEach(() => {
    cleanup();
  });

  it("checks rendering", () => {
    const { getByRole } = render(<Hello name={"my_name"}/>);
    const header = getByRole("heading");
    assert.match(header.innerHTML, /my_name/);
  });

});