import { strict as assert } from "node:assert";
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hello from "./index.js";

describe("index", () => {

  it("runs test", () => {
    render(<Hello />);
  });

});