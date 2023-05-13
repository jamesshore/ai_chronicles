import { test, assert } from "./tests.js";
// import {render, screen, cleanup} from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { Hello } from "./hello.js";

export default "placeholder";

// import "global-jsdom/register";
//
// describe("Hello", () => {
//
//   afterEach(() => {
//     cleanup();
//   });
//
//   it("renders", () => {
//     const { getByRole } = render(<Hello name={"my_name"}/>);
//     const header = getByRole("heading");
//     assert.match(header.innerHTML, /my_name/);
//   });
//
//   it("responds to button clicks", async () => {
//     let called = false;
//     const fn = () => {
//       called = true;
//     };
//
//     const user = userEvent.setup({ document });
//     const { getByRole } = render(<Hello onClick={fn} />);
//     const button = getByRole("button");
//     await user.click(button);
//
//     assert.equal(called, true);
//   });
//
// });