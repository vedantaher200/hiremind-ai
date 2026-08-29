import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  Users, 
  Calendar, 
  Sparkles, 
  Trash2, 
  Edit3, 
  CheckCircle2,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Job } from '../../types';
import { Modal } from '../../components/common/Modal';

interface JobsManagementPageProps {
  onNavigate: (page: string, candidateId?: string) => void;
}

export const JobsManagementPage: React.FC<JobsManagementPageProps> = ({ onNavigate }) => {
  const { jobs, addJob, applications } = useData();
  const [createModal, setCreateModal] = useState(false);

  // Form state for new job
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [type, setType] = useState('Full-Time');
  const [salary, setSalary] = useState('$150,000 - $180,000');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description.trim() || !skillsInput.trim()) return;

    const newJob: Job = {
      id: `job-${Date.now()}`,
      title,
      department,
      location,
      type: type as any,
      experienceLevel: 'Senior',
      salaryRange: salary,
      status: 'Active',
      description,
      requirements: [],
      requiredSkills: skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      applicantCount: 0,
      createdAt: new Date().toISOString()
    };

    addJob(newJob);
    setCreateModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">Job Openings & Management</h1>
          <p className="mt-1 text-sm text-[#464555]">
            Configure roles, define AI benchmark criteria, and track incoming candidate velocity.
          </p>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Job</span>
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => {
          const appCount = applications.filter(a => a.jobId === job.id).length || job.applicantCount;

          return (
            <div
              key={job.id}
              className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] hover:shadow-md hover:border-indigo-200 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#3525CD] border border-indigo-100">
                    {job.department}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {job.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#191C1D]">{job.title}</h3>
                  <p className="text-xs text-[#737380] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </p>
                </div>

                <p className="text-xs text-[#464555] line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.requiredSkills.slice(0, 4).map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-[#F8F9FA] text-[10px] font-semibold text-[#464555] border border-gray-100">
                      {sk}
                    </span>
                  ))}
                  {job.requiredSkills.length > 4 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#F8F9FA] text-[10px] font-semibold text-[#8E8EA0]">
                      +{job.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#464555]">
                  <Users className="w-4 h-4 text-[#3525CD]" />
                  <span className="font-bold">{appCount} Applicants</span>
                </div>

                <button
                  onClick={() => onNavigate('candidates-list')}
                  className="text-xs font-bold text-[#3525CD] hover:underline flex items-center gap-1"
                >
                  <span>Review Pool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Job Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Job Posting"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveJob} className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-[#464555]">Job Title</label>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Senior Machine Learning Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#464555] block mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#464555] block mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#464555] block mb-1">Employment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Contract">Contract</option>
                <option value="Part-Time">Part-Time</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#464555] block mb-1">Salary Range</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1">Required Skills (Comma separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1">Job Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed responsibilities and required qualifications..."
              className="w-full p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModal(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white font-bold rounded-xl"
            >
              Publish Job
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
