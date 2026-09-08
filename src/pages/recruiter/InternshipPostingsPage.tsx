import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  X,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { api } from '../../lib/api';
import { Internship } from '../../types';

export const InternshipPostingsPage: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [eligibility, setEligibility] = useState('Undergraduates or Recent Graduates');
  const [location, setLocation] = useState('Remote');
  const [mode, setMode] = useState('Remote');
  const [duration, setDuration] = useState('3 Months');
  const [stipend, setStipend] = useState('$1,200/month');
  const [openings, setOpenings] = useState(2);

  const fetchMyInternships = async () => {
    setLoading(true);
    try {
      const data = await api.internships.myInternships().catch(() => []);
      setInternships(data);
    } catch (err) {
      console.error('Failed to load recruiter internships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInternships();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg(null);

    try {
      const skillArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.internships.create({
        title,
        department,
        description,
        skills: skillArray,
        eligibility,
        location,
        mode,
        duration,
        stipend,
        openings: Number(openings) || 1
      });

      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setSkills('');
      await fetchMyInternships();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to post internship.');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseInternship = async (id: string) => {
    if (!confirm('Are you sure you want to close this internship posting?')) return;
    try {
      await api.internships.delete(id);
      await fetchMyInternships();
    } catch (err: any) {
      alert(err?.message || 'Failed to close internship.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Internship Management</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Corporate Internship Postings
          </h1>
          <p className="text-xs text-slate-500">
            Create and oversee your company's internship programs, separate from full-time job requisitions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Internship</span>
        </button>
      </div>

      {/* Internships List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <span>Loading your internship postings...</span>
        </div>
      ) : internships.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <h3 className="font-bold text-sm text-slate-800">No Internships Posted Yet</h3>
          <p className="mt-1 text-slate-500 max-w-sm mx-auto mb-4">
            Publish your first internship to recruit top university talent and future full-time candidates.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            Create Internship
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internships.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.status}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                    <div className="text-xs text-slate-500">{item.department} • {item.openings} Openings</div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                      {item.stipend || 'Paid'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{item.location}</span>
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{item.duration}</span>
                  <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{item.mode}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <Users className="w-4 h-4" />
                  <span>{item.applicantCount || 0} Applicants</span>
                </div>

                {item.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleCloseInternship(item.id)}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close Posting
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Internship Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-700" />
                <h3 className="font-extrabold text-base text-slate-900">Post New Internship</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="my-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internship Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI / Machine Learning Research Intern"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 Months, 6 Months"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco or Remote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Stipend</label>
                  <input
                    type="text"
                    required
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    placeholder="e.g. $1,200/month"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, PyTorch, Linear Algebra, Git"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={eligibility}
                  onChange={(e) => setEligibility(e.target.value)}
                  placeholder="e.g. Pre-final or Final year students in CS / AI"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Tasks</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline internship projects, learning outcomes, and day-to-day responsibilities..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {creating ? 'Publishing...' : 'Publish Internship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
