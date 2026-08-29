import React, { useEffect, useState } from 'react';
import {
  Mail,
  MapPin,
  Briefcase,
  Edit3,
  Plus,
  Building2,
  Globe,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

interface RecruiterProfilePageProps {
  onNavigate?: (page: string) => void;
}

export const RecruiterProfilePage: React.FC<RecruiterProfilePageProps> = () => {
  const { user, updateProfile } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    setEditName(user?.name || '');
    setEditTitle(user?.title || '');
    setEditLocation(user?.location || '');
    setEditBio(user?.bio || '');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile({
        name: editName.trim(),
        title: editTitle.trim(),
        location: editLocation.trim(),
        bio: editBio.trim()
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

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#737380]">
            Recruiter Profile
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-[#191C1D]">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-[#737380]">
            Manage your recruiter profile and professional information.
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
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={user?.name || 'Recruiter'}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-50 shadow-md"
                />

                <label
                  htmlFor="recruiter-avatar-upload"
                  className="absolute -bottom-1 -right-1 w-10 h-10 bg-[#3525CD] text-white rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-md hover:bg-[#281BA8] transition-colors"
                  title="Change profile picture"
                >
                  <Plus className="w-5 h-5" />
                </label>

                <input
                  id="recruiter-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <span className="absolute bottom-1 right-10 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>

              <h2 className="text-xl font-extrabold text-[#191C1D] mt-5">
                {user?.name || 'Recruiter'}
              </h2>

              <p className="text-sm font-semibold text-[#3525CD] mt-1">
                {user?.title || 'Talent Acquisition Specialist'}
              </p>

              <span className="mt-3 px-3 py-1 bg-purple-50 text-[#712AE2] rounded-full text-[11px] font-bold capitalize border border-purple-100">
                {user?.role || 'Recruiter'}
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
                    Position
                  </p>

                  <p className="text-[#464555] mt-1">
                    {user?.title || 'Talent Acquisition Specialist'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {/* PROFESSIONAL OVERVIEW */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#3525CD]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#191C1D]">
                  Professional Overview
                </h3>

                <p className="text-xs text-[#737380] mt-0.5">
                  Your recruiter information visible in the system.
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
                  Account Type
                </p>

                <p className="text-sm font-bold text-[#191C1D] mt-2 capitalize">
                  {user?.role || 'Recruiter'}
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

          {/* BIO */}
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
                  Your professional recruiter summary.
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

          {/* PROFILE STATUS */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Save className="w-5 h-5 text-[#3525CD]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#191C1D]">
                  Profile Management
                </h3>

                <p className="text-xs text-[#464555] leading-relaxed mt-1">
                  You can update your name, job title, location, professional
                  summary and profile picture anytime using the Edit Profile
                  button.
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
        title="Edit Recruiter Profile"
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

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Professional Title
            </label>

            <input
              type="text"
              placeholder="e.g. Senior Recruiter"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Location
            </label>

            <input
              type="text"
              placeholder="e.g. Mumbai, India"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-[#191C1D] outline-none focus:ring-2 focus:ring-[#3525CD]/20 focus:border-[#3525CD]"
            />
          </div>

          <div>
            <label className="font-bold text-[#464555] block mb-1.5">
              Professional Summary
            </label>

            <textarea
              rows={5}
              placeholder="Tell candidates about your professional background..."
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