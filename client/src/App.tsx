function App() {
  return (
    <main className="min-h-screen bg-black p-10 text-white font-sans">
      <h1 className="text-5xl font-bold">
        ScamSense
      </h1>

      <p className="mt-4 text-brand-pearl">
        Your digital safety companion.
      </p>

      <button className="mt-8 rounded-xl bg-brand-lime px-6 py-3 font-semibold text-black">
        Analyze Message
      </button>

      <p className="mt-8 font-mono text-sm text-brand-lavender">
        SCAN_STATUS: READY
      </p>
    </main>
  );
}

export default App;