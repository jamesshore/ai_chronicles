export function Hello({
  name,
  onClick,
}: {
  name?: string,
  onClick?: () => void,
}) {
  return <>
    <h1>Hello from React, {name}!</h1>
    <button onClick={onClick}>Click me</button>
  </>;
}
