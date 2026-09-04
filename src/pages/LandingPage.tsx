import React from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Video, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Users, 
  Award,
  ChevronRight,
  BrainCircuit,
  BarChart3
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onLoginClick: (role?: 'candidate' | 'recruiter') => void;
  onRegisterClick: (role?: 'candidate' | 'recruiter') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLoginClick, onRegisterClick }) => {

  const handleCandidateStart = () => {
    onRegisterClick('candidate');
  };

  const handleRecruiterStart = () => {
    onRegisterClick('recruiter');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D] flex flex-col justify-between selection:bg-orange-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => onNavigate('landing')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-700 flex items-center justify-center shadow-sm group-hover:bg-orange-800 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-[#191C1D] tracking-tight">
                HireMind <span className="text-orange-700 font-black text-sm px-1.5 py-0.5 rounded-md bg-orange-50 border border-orange-100">AI</span>
              </span>
              <span className="text-[11px] text-[#737380] font-medium block -mt-1 tracking-wider uppercase">
                Recruitment Intelligence OS
              </span>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#464555]">
            <a href="#hero" className="text-orange-700 font-semibold hover:text-orange-800 transition-colors">Home</a>
            <a href="#features" className="hover:text-[#191C1D] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#191C1D] transition-colors">How It Works</a>
            <button onClick={handleCandidateStart} className="hover:text-orange-700 transition-colors">For Candidates</button>
            <button onClick={handleRecruiterStart} className="hover:text-orange-700 transition-colors">For Recruiters</button>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLoginClick()}
              className="px-4 py-2.5 text-sm font-semibold text-[#464555] hover:text-[#191C1D] hover:bg-gray-100 rounded-xl transition-all"
            >
              Login
            </button>
            <button
              onClick={() => onRegisterClick()}
              className="px-5 py-2.5 rounded-xl bg-orange-700 text-white text-sm font-semibold shadow-[0_10px_20px_-5px_rgba(194,65,12,0.28)] hover:bg-orange-800 hover:shadow-[0_15px_25px_-5px_rgba(194,65,12,0.36)] transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Small pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 shadow-xs">
              <Sparkles className="w-4 h-4 text-orange-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                AI-POWERED RECRUITMENT PLATFORM
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#191C1D] tracking-tight leading-[1.12]">
              Smarter Hiring with <br />
              <span className="text-orange-700">
                AI Intelligence
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-[#464555] leading-relaxed max-w-2xl font-normal">
              HireMind AI automates resume screening, AI interviews, skill evaluation and candidate ranking to help you hire the right talent faster and fairer.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleCandidateStart}
                className="px-7 py-3.5 rounded-xl bg-orange-700 text-white text-base font-semibold shadow-[0_10px_25px_-5px_rgba(194,65,12,0.32)] hover:bg-orange-800 hover:shadow-[0_15px_30px_-5px_rgba(194,65,12,0.4)] hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center gap-2"
              >
                <span>I'm a Candidate</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleRecruiterStart}
                className="px-7 py-3.5 rounded-xl bg-white text-[#191C1D] border border-[#E5E7EB] text-base font-semibold shadow-xs hover:bg-[#F8F9FA] hover:border-gray-300 transition-all flex items-center gap-2"
              >
                <span>I'm a Recruiter</span>
                <ChevronRight className="w-4 h-4 text-[#737380]" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="pt-4 flex items-center gap-6 text-xs text-[#737380] font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Bias Screening</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Real-Time Voice AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Multidimensional Ranking</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-orange-100/60 rounded-3xl blur-2xl -z-10" />

            <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-[0_20px_50px_-10px_rgba(79,70,229,0.12)] space-y-5">
              {/* Top candidate badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Rahul Mehta"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#191C1D]">Rahul Mehta</h4>
                    <p className="text-xs text-[#737380]">Senior AI Developer Applicant</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  91% Top Match
                </div>
              </div>

              {/* Multidimensional Radar Metric Preview */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#464555] font-medium">ATS Semantic Match</span>
                  <span className="font-bold text-[#191C1D]">92%</span>
                </div>
                <div className="w-full bg-orange-50 h-2 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-orange-700 rounded-full" />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#464555] font-medium">AI Live Interview & Speech</span>
                  <span className="font-bold text-[#191C1D]">88%</span>
                </div>
                <div className="w-full bg-orange-50 h-2 rounded-full overflow-hidden">
                  <div className="w-[88%] h-full bg-orange-700 rounded-full" />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#464555] font-medium">Coding & Technical MCQs</span>
                  <span className="font-bold text-[#191C1D]">90%</span>
                </div>
                <div className="w-full bg-orange-50 h-2 rounded-full overflow-hidden">
                  <div className="w-[90%] h-full bg-orange-700 rounded-full" />
                </div>
              </div>

              {/* AI Recommendation Summary Box */}
              <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                <BrainCircuit className="w-5 h-5 text-orange-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-700 uppercase">AI Verdict: Strongly Recommended</span>
                  </div>
                  <p className="text-xs text-[#464555] mt-1 leading-relaxed">
                    Demonstrates stellar transformer architectural depth with 100% test completion and high clarity articulation.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-[#737380]">
                <span>Rank #1 in Pipeline</span>
                <button 
                  onClick={handleRecruiterStart} 
                  className="text-orange-700 hover:text-orange-800 font-bold hover:underline flex items-center gap-1"
                >
                  View Full Candidate Profile &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligent Precision Capabilities Section */}
      <section id="features" className="py-20 bg-white border-t border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-[#191C1D] tracking-tight">
              Intelligent Precision Capabilities
            </h2>
            <p className="text-base text-[#464555] leading-relaxed">
              Transforming every stage of the hiring lifecycle with intelligent analysis and predictive insights.
            </p>
          </div>

          {/* EXACTLY FOUR MAIN FEATURE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: AI Resume Screening */}
            <button onClick={handleCandidateStart} className="text-left bg-[#F8F9FA] p-6 rounded-2xl border border-[#E5E7EB] hover:border-orange-200 hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(194,65,12,0.08)] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-700 mb-5 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#191C1D] mb-2">
                  1. AI Resume Screening
                </h3>
                <p className="text-sm text-[#464555] leading-relaxed">
                  Instantly parse and evaluate resumes against job requirements.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200/70 text-xs font-semibold text-orange-700 flex items-center gap-1">
                <span>Try Resume Intelligence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Card 2: AI Interviews */}
            <button onClick={handleCandidateStart} className="text-left bg-[#F8F9FA] p-6 rounded-2xl border border-[#E5E7EB] hover:border-orange-200 hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(194,65,12,0.08)] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-700 mb-5 group-hover:scale-110 transition-transform">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#191C1D] mb-2">
                  2. AI Interviews
                </h3>
                <p className="text-sm text-[#464555] leading-relaxed">
                  Conduct preliminary conversational interviews powered by AI to assess soft skills and technical knowledge.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200/70 text-xs font-semibold text-orange-700 flex items-center gap-1">
                <span>Explore Live AI Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Card 3: Behavior Analysis */}
            <button onClick={handleCandidateStart} className="text-left bg-[#F8F9FA] p-6 rounded-2xl border border-[#E5E7EB] hover:border-orange-200 hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(194,65,12,0.08)] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-700 mb-5 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#191C1D] mb-2">
                  3. Behavior Analysis
                </h3>
                <p className="text-sm text-[#464555] leading-relaxed">
                  Analyze candidate responses and interview performance to provide behavioral insights.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200/70 text-xs font-semibold text-orange-700 flex items-center gap-1">
                <span>View Sentiment Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Card 4: Smart Ranking */}
            <button onClick={handleRecruiterStart} className="text-left bg-[#F8F9FA] p-6 rounded-2xl border border-[#E5E7EB] hover:border-orange-200 hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(194,65,12,0.08)] transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#191C1D] mb-2">
                  4. Smart Ranking
                </h3>
                <p className="text-sm text-[#464555] leading-relaxed">
                  A dynamic multidimensional ranking system highlighting top talent based on multiple assessment data points.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200/70 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span>Configure Weights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* How it works workflow strip */}
      <section id="how-it-works" className="py-16 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">End-to-End Pipeline</span>
            <h3 className="text-2xl font-bold text-[#191C1D] mt-1">Four Seamless Steps to Top Engineering Talent</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] text-center">
              <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-700 font-bold text-sm inline-flex items-center justify-center mb-3">1</span>
              <h4 className="font-bold text-sm text-[#191C1D]">Resume Upload</h4>
              <p className="text-xs text-[#737380] mt-1">Instant ATS parsing and skill gap identification.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] text-center">
              <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-700 font-bold text-sm inline-flex items-center justify-center mb-3">2</span>
              <h4 className="font-bold text-sm text-[#191C1D]">Skill Assessments</h4>
              <p className="text-xs text-[#737380] mt-1">Timed cognitive aptitude, MCQ and live coding tests.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] text-center">
              <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-700 font-bold text-sm inline-flex items-center justify-center mb-3">3</span>
              <h4 className="font-bold text-sm text-[#191C1D]">AI Voice Interview</h4>
              <p className="text-xs text-[#737380] mt-1">Autonomous multi-turn voice and behavioral evaluations.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] text-center">
              <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-700 font-bold text-sm inline-flex items-center justify-center mb-3">4</span>
              <h4 className="font-bold text-sm text-[#191C1D]">Smart Ranking</h4>
              <p className="text-xs text-[#737380] mt-1">Weighted holistic scoring and hiring recommendation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-700 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base text-[#191C1D]">HireMind AI</span>
              <span className="text-xs text-[#737380] block">Autonomous Multi-Modal Recruitment Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-[#737380]">
            <span>Final Year Engineering Project</span>
            <span>•</span>
            <span>Powered by Gemini & PostgreSQL</span>
            <span>•</span>
            <span>© 2026 HireMind AI</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCandidateStart}
              className="text-xs font-semibold text-orange-700 hover:text-orange-800 hover:underline"
            >
              Candidate Portal
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleRecruiterStart}
              className="text-xs font-semibold text-orange-700 hover:text-orange-800 hover:underline"
            >
              Recruiter Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
