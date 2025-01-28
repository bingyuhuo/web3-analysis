export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
      <div className="mx-auto w-full max-w-7xl px-5 pt-16">
        <div className="mx-auto mb-8 w-full max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Web3 Investment Analysis
          </h1>
          <p className="mx-auto mb-4 max-w-[528px] text-xl text-gray-300">
            AI-Powered Deep Analysis Generator for Web3 Projects
          </p>
        </div>
      </div>
    </section>
  );
}
