import React, { useMemo, useState } from 'react';
import {
  Award,
  ChevronRight,
  Download,
  Sparkles,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CircularScore } from '../../components/common/CircularScore';
import { Modal } from '../../components/common/Modal';

interface ResultsPageProps {
  onNavigate: (page: string) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { testAttempts } = useData();

  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  const candidateName = user?.name || 'Candidate';

  const rows = useMemo(() => {
    if (!testAttempts || testAttempts.length === 0) {
      return [];
    }

    return testAttempts
      .filter(
        attempt =>
          !attempt.candidateId ||
          attempt.candidateId === user?.id
      )
      .map(attempt => ({
        assessment: attempt.testTitle || 'Assessment Test',
        score: attempt.score ?? 0,
        maxScore: attempt.totalPoints ?? 0,
        percentage: `${attempt.percentage ?? 0}%`,
        percentageValue: attempt.percentage ?? 0,
        date: attempt.completedAt
          ? new Date(attempt.completedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          : 'Recently completed',
        category: attempt.category || 'Assessment',
        status: attempt.status || 'Completed'
      }))
      .reverse();
  }, [testAttempts, user?.id]);

  const overallScore = useMemo(() => {
    if (rows.length === 0) {
      return 0;
    }

    const totalPercentage = rows.reduce(
      (total, row) => total + row.percentageValue,
      0
    );

    return Math.round(totalPercentage / rows.length);
  }, [rows]);

  const overallStatus =
    overallScore >= 80
      ? 'Excellent'
      : overallScore >= 70
      ? 'Strong Recommended'
      : overallScore >= 50
      ? 'Developing'
      : 'Needs Improvement';

  const overallDescription =
    rows.length === 0
      ? 'Complete your available assessments to generate a comprehensive performance analysis and overall candidate score.'
      : overallScore >= 80
      ? 'Excellent performance across completed assessments. Your results demonstrate strong technical and problem-solving capabilities.'
      : overallScore >= 70
      ? 'Candidate demonstrates strong overall potential with solid performance across the completed assessments.'
      : overallScore >= 50
      ? 'Candidate demonstrates developing capabilities. Completing additional practice and assessments can help strengthen the overall profile.'
      : 'More improvement is recommended. Review your completed assessments and focus on strengthening weaker areas.';

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">
            My Results
          </h1>

          <p className="mt-1 text-sm text-[#464555]">
            Comprehensive performance analysis for {candidateName}.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-xs hover:bg-[#F8F9FA] transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#3525CD]" />
          <span>Export Official Transcript</span>
        </button>
      </div>

      {/* Main Results Table */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#191C1D]">
              Performance Breakdown
            </h3>

            <p className="text-xs text-[#737380] mt-0.5">
              Your scores from completed assessment modules
            </p>
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 w-fit">
            {rows.length} Completed
          </span>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#464555]">
              <thead className="bg-[#F8F9FA] text-[#737380] uppercase tracking-wider font-bold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3.5">Assessment</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Max Score</th>
                  <th className="px-6 py-3.5">Percentage</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 font-medium">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#F8F9FA]/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3525CD] shrink-0" />

                        <div>
                          <p className="font-bold text-[#191C1D]">
                            {row.assessment}
                          </p>

                          <span className="inline-block mt-1 text-[10px] font-normal text-[#8E8EA0] bg-gray-100 px-2 py-0.5 rounded-md">
                            {row.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-[#191C1D]">
                      {row.score}
                    </td>

                    <td className="px-6 py-4 text-[#737380]">
                      {row.maxScore}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-[#3525CD] rounded-lg font-bold">
                        {row.percentage}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          row.status === 'Passed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.status === 'Failed'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-[#737380]'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[#737380] whitespace-nowrap">
                      {row.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-[#3525CD] flex items-center justify-center mx-auto mb-4">
              <Award className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-[#191C1D]">
              No Test Results Yet
            </h3>

            <p className="text-xs text-[#737380] mt-2 max-w-md mx-auto">
              Complete an evaluation test to see your scores and detailed
              performance analysis here.
            </p>

            <button
              onClick={() => onNavigate('tests')}
              className="mt-5 px-6 py-2.5 rounded-xl bg-[#3525CD] text-white text-xs font-bold hover:bg-[#281BA8] transition-colors"
            >
              Go to Evaluation Tests
            </button>
          </div>
        )}
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-white to-indigo-50/40 p-8 rounded-3xl border border-indigo-100 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.08)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
          <CircularScore
            score={overallScore}
            size={160}
            strokeWidth={14}
            label="Overall Score"
          />

          <span
            className={`mt-3 text-xs font-bold px-3 py-1 rounded-full ${
              overallScore >= 70
                ? 'text-[#3525CD] bg-indigo-50'
                : 'text-[#737380] bg-gray-100'
            }`}
          >
            {rows.length > 0
              ? `${rows.length} Assessment${
                  rows.length > 1 ? 's' : ''
                } Completed`
              : 'Awaiting Assessments'}
          </span>
        </div>

        <div className="lg:col-span-8 space-y-4 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#712AE2]" />

            <span className="text-xs font-bold uppercase tracking-wider text-[#712AE2]">
              HireMind Performance Analysis
            </span>
          </div>

          <h3 className="text-2xl font-extrabold text-[#191C1D] leading-tight">
            Overall Candidate Potential: {overallStatus}
          </h3>

          <p className="text-sm text-[#464555] leading-relaxed">
            {overallDescription}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowDetailedBreakdown(true)}
              disabled={rows.length === 0}
              className="px-6 py-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold shadow-xs hover:bg-[#F8F9FA] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              View Details
            </button>

            <button
              onClick={() => onNavigate('tests')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>
                {rows.length > 0
                  ? 'Take Another Test'
                  : 'Start an Assessment'}
              </span>

              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Modal */}
      <Modal
        isOpen={showDetailedBreakdown}
        onClose={() => setShowDetailedBreakdown(false)}
        title="Comprehensive Evaluation Breakdown"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-[#3525CD]" />

              <h4 className="font-bold text-[#3525CD]">
                Overall Performance
              </h4>
            </div>

            <p className="text-[#464555]">
              Your current overall score is based on the results of all
              completed assessments recorded in your profile.
            </p>
          </div>

          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-bold text-[#191C1D]">
                    {row.assessment}
                  </p>

                  <p className="text-[10px] text-[#737380] mt-0.5">
                    {row.category}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-[#3525CD]">
                    {row.percentage}
                  </p>

                  <p className="text-[10px] text-[#737380]">
                    {row.score}/{row.maxScore} Points
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />

            <div>
              <h4 className="font-bold text-emerald-800">
                Current Overall Score: {overallScore}%
              </h4>

              <p className="text-emerald-700 mt-1">
                Continue completing assessments to build a more comprehensive
                candidate performance profile.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};