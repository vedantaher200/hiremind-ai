import React, { useEffect, useState } from 'react';
import {
  Mail,
  MapPin,
  Briefcase,
  Edit3,
  Plus,
  User,
  Globe,
  Save,
  Award,
  GraduationCap,
  Code2,
  Linkedin,
  Github,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

interface CandidateProfilePageProps {
  onNavigate?: (page: string) => void;
}

export const CandidateProfilePage: React.FC<CandidateProfilePageProps> = () => {
  const { user, updateProfile } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);

  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLinkedinUrl, setEditLinkedinUrl] = useState('');
  const [editGithubUrl, setEditGithubUrl] = useState('');
  const [editPortfolioUrl, setEditPortfolioUrl] = useState('');

  useEffect(() => {
    setEditName(user?.name || '');
    setEditTitle(user?.title || '');
    setEditLocation(user?.location || '');
    setEditBio(user?.bio || '');
    setEditPhone(user?.phone || '');
    setEditLinkedinUrl(user?.linkedinUrl || '');
    setEditGithubUrl(user?.githubUrl || '');
    setEditPortfolioUrl(user?.portfolioUrl || '');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile({
        name: editName.trim(),
        title: editTitle.trim(),
        location: editLocation.trim(),
        bio: editBio.trim(),
        phone: editPhone.trim(),
        linkedinUrl: editLinkedinUrl.trim(),
        githubUrl: editGithubUrl.trim(),
        portfolioUrl: editPortfolioUrl.trim()
      });

      setShowEditModal(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to update profile.'
      );
    }
  };

  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        await updateProfile({
          avatar: reader.result as string
        });
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : 'Unable to update profile picture.'
        );
      }
    };

    reader.readAsDataURL(file);
  };

  const getInitials = () => {
    if (!user?.name) return 'C';

    return user.name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#737380]">
            Candidate Profile
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-[#191C1D]">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-[#737380]">
            Manage your professional profile, skills and career information.
          </p>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#3525CD] text-white text-xs font-bold hover:bg-[#281BA8] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)]"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PROFILE CARD */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'Candidate'}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-50 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-3xl font-extrabold ring-4 ring-indigo-50 shadow-md">
                    {getInitials()}
                  </div>
                )}

                <label
                  htmlFor="candidate-avatar-upload"
                  className="absolute -bottom-1 -right-1 w-10 h-10 bg-[#3525CD] text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-md hover:bg-[#281BA8] transition-colors"
                  title="Change profile picture"
                >
                  <Plus className="w-5 h-5" />
                </label>

                <input
                  id="candidate-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <span className="absolute bottom-1 right-10 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>

              <h2 className="text-xl font-extrabold text-[#191C1D] mt-5">
                {user?.name || 'Candidate'}
              </h2>

              <p className="text-sm font-semibold text-[#3525CD] mt-1">
                {user?.title || 'Professional Candidate'}
              </p>

              <span className="mt-3 px-3 py-1 bg-indigo-50 text-[#3525CD] rounded-full text-[11px] font-bold capitalize border border-indigo-100">
                {user?.availabilityStatus || 'Available'}
              </span>
            </div>

            {/* CONTACT DETAILS */}
            <div className="space-y-4 pt-6 mt-6 border-t border-[#E5E7EB] text-xs">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#8E8EA0] mt-0.5 shrink-0" />

                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8E8EA0]">
                    Email
                  </p>

                  <p className="text-[#464555] mt-1 break-all">
                    {user?.email || 'No email available'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#8E8EA0] mt-0.5 shrink-0" />

                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8E8EA0]">
                    Location
                  </p>

                  <p className="text-[#464555] mt-1">
                    {user?.location || 'Location not added'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-[#8E8EA0] mt-0.5 shrink-0" />

                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8E8EA0]">
                    Experience
                  </p>

                  <p className="text-[#464555] mt-1">
                    {user?.yearsOfExperience !== undefined
                      ? `${user.yearsOfExperience} years`
                      : 'Not added'}
                  </p>
                </div>
              </div>
            </div>

            {/* PROFESSIONAL LINKS */}
            {(user?.linkedinUrl || user?.githubUrl || user?.portfolioUrl) && (
              <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
                <p className="text-[10px] uppercase font-bold text-[#8E8EA0] mb-3">
                  Professional Links
                </p>

                <div className="flex flex-wrap gap-2">
                  {user?.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}

                  {user?.githubUrl && (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-gray-100 text-[#191C1D] flex items-center justify-center hover:bg-gray-200 transition-colors"
                      title="GitHub"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}

                  {user?.portfolioUrl && (
                    <a
                      href={user.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-purple-50 text-[#712AE2] flex items-center justify-center hover:bg-purple-100 transition-colors"
                      title="Portfolio"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {/* PROFESSIONAL OVERVIEW */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <User className="w-5 h-5 text-[#3525CD]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#191C1D]">
                  Professional Overview
                </h3>

                <p className="text-xs text-[#737380] mt-0.5">
                  Your professional information visible to recruiters.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#8E8EA0]">
                  Full Name
                </p>

                <p className="text-sm font-bold text-[#191C1D] mt-2">
                  {user?.name || 'Not added'}
                </p>
              </div>

              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#8E8EA0]">
                  Professional Title
                </p>

                <p className="text-sm font-bold text-[#191C1D] mt-2">
                  {user?.title || 'Not added'}
                </p>
              </div>

              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#8E8EA0]">
                  Availability
                </p>

                <p className="text-sm font-bold text-[#191C1D] mt-2">
                  {user?.availabilityStatus || 'Available'}
                </p>
              </div>

              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#8E8EA0]">
                  Location
                </p>

                <p className="text-sm font-bold text-[#191C1D] mt-2">
                  {user?.location || 'Not added'}
                </p>
              </div>
            </div>
          </div>

          {/* ABOUT ME */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#712AE2]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#191C1D]">
                  About Me
                </h3>

                <p className="text-xs text-[#737380] mt-0.5">
                  Your professional summary visible to recruiters.
                </p>
              </div>
            </div>

            {user?.bio ? (
              <p className="text-sm text-[#464555] leading-relaxed whitespace-pre-wrap">
                {user.bio}
              </p>
            ) : (
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-dashed border-[#E5E7EB]">
                <p className="text-sm text-[#737380]">
                  No professional summary added yet.
                </p>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="mt-3 text-xs font-bold text-[#3525CD] hover:underline"
                >
                  Add your summary
                </button>
              </div>
            )}
          </div>

          {/* SKILLS */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#191C1D]">
                  Skills
                </h3>

                <p className="text-xs text-[#737380] mt-0.5">
                  Your key professional and technical skills.
                </p>
              </div>
            </div>

            {user?.skills && user.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 text-[#3525CD] text-xs font-bold border border-indigo-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-dashed border-[#E5E7EB]">
                <p className="text-sm text-[#737380]">
                  No skills added yet.
                </p>
              </div>
            )}
          </div>

          {/* EXPERIENCE */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-orange-600" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#191C1D]">
                  Experience
                </h3>

                <p className="text-xs text-[#737380] mt-0.5">
                  Your professional work experience.
                </p>
              </div>
            </div>

            {user?.experience && user.experience.length > 0 ? (
              <div className="space-y-4">
                {user.experience.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#191C1D]">
                          {item.role}
                        </h4>

                        <p className="text-xs font-semibold text-[#3525CD] mt-1">
                          {item.company}
                        </p>
                      </div>

                      <span className="text-[11px] text-[#737380]">
                        {item.duration}
                      </span>
                    </div>

                    {item.location && (
                      <p className="text-xs text-[#737380] mt-2">
                        {item.location}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-[#464555] leading-relaxed mt-3">
                        {item.description}
                      </p>
                    )}

                    {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.skills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[10px] font-semibold text-[#737380]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-dashed border-[#E5E7EB]">
                <p className="text-sm text-[#737380]">
                  No work experience added yet.
                </p>
              </div>
            )}
          </div>

          {/* EDUCATION */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#191C1D]">
                  Education
                </h3>

                <p className="text-xs text-[#737380] mt-0.5">
                  Your academic qualifications.
                </p>
              </div>
            </div>

            {user?.education && user.education.length > 0 ? (
              <div className="space-y-4">
                {user.education.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#191C1D]">
                          {item.degree}
                        </h4>

                        <p className="text-xs font-semibold text-[#3525CD] mt-1">
                          {item.institution}
                        </p>

                        <p className="text-xs text-[#737380] mt-1">
                          {item.field}
                        </p>
                      </div>

                      <span className="text-[11px] text-[#737380]">
                        {item.year}
                      </span>
                    </div>

                    {item.grade && (
                      <p className="text-xs text-[#464555] mt-3">
                        Grade: {item.grade}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-dashed border-[#E5E7EB]">
                <p className="text-sm text-[#737380]">
                  No education details added yet.
                </p>
              </div>
            )}
          </div>

          {/* PROFILE STATUS */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-[#3525CD]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#191C1D]">
                  Profile Management
                </h3>

                <p className="text-xs text-[#464555] leading-relaxed mt-1">
                  Keep your profile updated to help recruiters better understand
                  your skills, experience and professional background.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Candidate Profile"
        maxWidth="lg"
      >
        <form
          onSubmit={handleSaveProfile}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Full Name
            </label>

            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Email Address
            </label>

            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full p-3 bg-gray-100 border border-[#E5E7EB] rounded-xl text-[#737380] cursor-not-allowed"
            />

            <p className="text-[10px] text-[#8E8EA0] mt-1.5">
              Email is managed by your account login and cannot be changed here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#464555] block mb-1.5">
                Professional Title
              </label>

              <input
                type="text"
                placeholder="e.g. Software Developer"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
              />
            </div>

            <div>
              <label className="font-bold text-[#464555] block mb-1.5">
                Phone Number
              </label>

              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Location
            </label>

            <input
              type="text"
              placeholder="e.g. Pune, India"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              LinkedIn URL
            </label>

            <input
              type="url"
              placeholder="https://linkedin.com/in/your-profile"
              value={editLinkedinUrl}
              onChange={(e) => setEditLinkedinUrl(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              GitHub URL
            </label>

            <input
              type="url"
              placeholder="https://github.com/your-username"
              value={editGithubUrl}
              onChange={(e) => setEditGithubUrl(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Portfolio URL
            </label>

            <input
              type="url"
              placeholder="https://yourportfolio.com"
              value={editPortfolioUrl}
              onChange={(e) => setEditPortfolioUrl(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Professional Summary
            </label>

            <textarea
              rows={5}
              placeholder="Tell recruiters about your professional background..."
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none resize-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-[#464555] font-bold hover:bg-[#F8F9FA]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#3525CD] text-white font-bold rounded-xl hover:bg-[#281BA8] transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};