// Copyright Titanium I.T. LLC.
import { createRoot } from 'react-dom/client';
import { Application } from "./application.js";

const domNode = document.getElementById('react-root');
if (domNode === null) throw new Error("Couldn't find 'react-root' DOM element");

const root = createRoot(domNode);

root.render(<Application />);
// root.render(<Hello name="fellow meat puppet" onClick={onClick} />);

function onClick() {
  alert("I too enjoy using my human legs to walk adjacent to dihydrogen monoxide.");
}