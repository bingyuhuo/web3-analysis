"use client";

import { useEffect, useState } from "react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Input from "@/components/input";
import Reports from "@/components/reports";
import { Report } from "@/types/report";
import { UserCredits } from "@/types/user";
import CreditsExpiryNotice from '@/components/credits-expiry-notice';

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<UserCredits | null>(null);

  const fetchReports = async function () {
    try {
      const result = await fetch("/api/get-reports");
      const { data } = await result.json();
      if (data) {
        setReports(data);
      }
    } catch (error) {
      console.error("Failed to fetch report list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="w-screen min-h-screen">
      <Header />
      <main className="pt-16">
        <Hero />
        <Input setReports={setReports} />
        {!loading && <Reports reports={reports} />}
        <CreditsExpiryNotice credits={credits} />
      </main>
      <Footer />
    </div>
  );
}
