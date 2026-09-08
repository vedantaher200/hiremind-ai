import React, { useEffect, useState } from 'react';
import {
  Mail,
  MapPin,
  Briefcase,
  Edit3,
  Save,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';

interface AdminProfilePageProps {
  onNavigate?: (page: string) => void;
}

export const AdminProfilePage: React.FC<AdminProfilePageProps> = () => {
  const { user, updateProfile, uploadAvatar } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    setEditName(user?.name || '');
    setEditTitle(user?.title || 'Platform Super Administrator');
    setEditLocation(user?.location || 'Global Operations Center');
    setEditBio(user?.bio || 'Head of platform operations, compliance verification, and ecosystem security.');
    setEditPhone(user?.phone || '+1 (555) 019-2834');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        name: editName.trim(),
        title: editTitle.trim(),
        location: editLocation.trim(),
        bio: editBio.trim(),
        phone: editPhone.trim()
      });

      setShowEditModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update admin profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ text: 'Avatar must be less than 5MB.', type: 'error' });
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      await uploadAvatar(file);
      setAvatarMessage({ text: 'Admin profile picture updated successfully!', type: 'success' });
    } catch (err: any) {
      setAvatarMessage({ text: err?.message || 'Failed to upload profile picture.', type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Identification Card */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] overflow-hidden">
        {/* Decorative Header Banner */}
        <div className="h-36 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Root Authority Verified</span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-14 mb-6">
            {/* Avatar with Upload Control */}
            <div className="relative group w-28 h-28 sm:w-32 sm:h-32">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                }
                alt={user?.name || 'Administrator'}
                className="w-full h-full rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
              />
              <label className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[11px] font-bold">Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2.5 bg-white border border-[#E5E7EB] hover:border-[#3525CD] text-[#191C1D] text-xs font-bold rounded-xl shadow-xs hover:bg-[#F8F9FA] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-[#3525CD]" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {avatarMessage && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                avatarMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {avatarMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{avatarMessage.text}</span>
            </div>
          )}

          {/* Title & Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#191C1D]">{user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-[#3525CD] border border-indigo-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Platform Administrator
              </span>
            </div>
            <p className="text-sm font-medium text-[#737380] mt-1">
              {user?.title || 'Super Administrator & Security Lead'}
            </p>

            <div className="flex flex-wrap gap-y-2 gap-x-6 mt-4 text-xs text-[#464555]">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#8E8EA0]" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#8E8EA0]" />
                <span>{user?.location || 'Global Headquarters'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#8E8EA0]" />
                <span>{user?.phone || 'Secure Line (Configured)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#8E8EA0]" />
                <span>Active Since {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bio / Mission Statement */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h2 className="font-extrabold text-base text-[#191C1D]">Administrative Mandate & Overview</h2>
            <Sparkles className="w-4 h-4 text-[#3525CD]" />
          </div>
          <p className="text-sm text-[#464555] leading-relaxed">
            {user?.bio ||
              'Oversees recruiter company credentialing, candidate evaluation algorithms, platform security monitoring, and regulatory compliance across all multi-modal assessment systems.'}
          </p>

          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#737380] mb-3">
              Platform Responsibilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Company Due Diligence</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Review GST/incorporation certificates and authorize legitimate recruiters.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Algorithm Integrity</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ensure unbiased ATS compatibility and Gemini behavioral evaluation pipelines.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Security & Access Control</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enforce role-based boundaries, cryptographic token verification, and data isolation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Audit Logs & Compliance</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Maintain immutable records of administrative decisions and policy updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick System Authority Stats */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h2 className="font-extrabold text-base text-[#191C1D]">Access Privileges</h2>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-[#737380]">Role Level:</span>
              <span className="font-bold text-slate-900 uppercase tracking-wider">Super Administrator</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-[#737380]">Verification Authority:</span>
              <span className="font-bold text-emerald-600">Unrestricted</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-[#737380]">Audit Trail:</span>
              <span className="font-bold text-indigo-600">Enabled (PostgreSQL)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#737380]">Database Access:</span>
              <span className="font-bold text-slate-900">Prisma ORM Secured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Administrator Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464555] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3525CD]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464555] mb-1">
              Official Title
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3525CD]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#464555] mb-1">
                Location / Center
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3525CD]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#464555] mb-1">
                Phone Contact
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3525CD]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#464555] mb-1">
              Administrative Bio / Scope
            </label>
            <textarea
              rows={4}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3525CD]/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-xs font-bold text-[#464555] hover:text-[#191C1D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#3525CD] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
