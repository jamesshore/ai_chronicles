export function Application() {
  return <>
    <div className="conversation">
      <p>The history of our conversation goes here.</p>
    </div>
    <hr />
    <div className="interaction">
      <form>
        <p>What would you like to say to your robot overlord?</p>
        <textarea></textarea>
        <br />
        <button>Supplicate yourself to the robot</button>
      </form>
    </div>
  </>;
}