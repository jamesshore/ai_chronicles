// Copyright Titanium I.T. LLC.

export default function Hello({ name, onClick }) {
  return <>
    <h1>Hello, {name}, from React!</h1>
    <button onClick={onClick}></button>
  </>;
}
