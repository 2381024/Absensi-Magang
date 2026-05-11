import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => setStatus({ status: "error", message: err.message }));
  }, []);

  return (
    <div className="app">
      <h1>Absensi Magang</h1>
      <div className="status">
        <span>API Status: </span>
        {status ? (
          <code>{JSON.stringify(status, null, 2)}</code>
        ) : (
          <span>Connecting...</span>
        )}
      </div>
    </div>
  );
}

export default App;