import HandTracker from "./components/HandTracker";

function App() {
  return (
    <div style={{ background: "#0f172a", height: "100vh" }}>
      <h2 style={{ color: "white", textAlign: "center", padding: "10px" }}>
        Control por Gestos con IA
      </h2>
      <HandTracker />
    </div>
  );
}

export default App;
