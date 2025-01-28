export interface Report {
  id?: number;
  projectName: string;
  summary: string;
  content: string | {
    summary: {
      description: string;
      imageDescription: string;
    };
    coreAnalysis: {
      technology: string;
      ecosystem: string;
      tokenomics: string;
    };
    investmentAnalysis: {
      competitiveAdvantage: string;
      risks: string;
      investmentStrategy: string;
    };
    socialLinks: {
      website: string;
      twitter: string;
      telegram: string;
      discord: string;
      github: string;
      docs: string;
    };
  };
  image_url: string;
  created_at: string;
  user_address?: string;
}

export interface ReportProps {
  reports: Report[];
}

export interface AnalysisResponse {
  summary: {
    description: string;
    imageDescription: string;
  };
  coreAnalysis: {
    technology: string;
    ecosystem: string;
    tokenomics: string;
  };
  investmentAnalysis: {
    competitiveAdvantage: string;
    risks: string;
    investmentStrategy: string;
  };
  socialLinks: {
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
    github: string;
    docs: string;
  };
} 