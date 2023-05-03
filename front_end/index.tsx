// Copyright Titanium I.T. LLC.
import {createRoot} from 'react-dom/client';

const domNode = document.getElementById('react-root');
if (domNode === null) throw new Error("Couldn't find 'react-root' DOM element");

const root = createRoot(domNode);
root.render(<Hello />);

function Hello() {
  return <h1>Hello from React!</h1>;
}
