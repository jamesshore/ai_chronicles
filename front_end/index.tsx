// Copyright Titanium I.T. LLC.
import {createRoot} from 'react-dom/client';
import Hello from "./hello.js";

const domNode = document.getElementById('react-root');
if (domNode === null) throw new Error("Couldn't find 'react-root' DOM element");

const root = createRoot(domNode);
root.render(<Hello />);
