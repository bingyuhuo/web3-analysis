"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Pricing from "@/components/pricing";

export default function Home() {
  return (
    <div className="w-screen h-screen">
      <Header />
      <Pricing />
      <Footer />
    </div>
  );
}
