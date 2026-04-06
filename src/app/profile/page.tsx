'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useApp } from '@/context/AppContext';
import AvatarCard from '../../components/Avatarcard';
import { PILLARS } from '@/data/pillars';
import { BASE_URL } from '../../lib/base';

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, subscribed, plan, logout, freeResults, premiumResults, setUser } = useApp();

  const [mounted, setMounted] = useState(false)
  const [editMode, setEditMode] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true)
  }, [])

  console.log("USER THAT WE GET IS")
  console.log(user)
  useEffect(() => {
    if (!user) router.push('/login');
    else {
      setEditEmail(user.email || '');
      setEditName(user.full_name || user.email?.split('@')[0] || '');
    }
  }, [user, router]);

  if (!mounted) return null
  if (!user) return null;

  if (!user) return null;

  const results   = premiumResults ?? freeResults;
  const global    = results?.global;
  const pillarMap = results?.pillarPercents;

  const pillarList = pillarMap
    ? PILLARS.map(p => ({ ...p, love: pillarMap[p.id]?.love ?? 50 })).sort((a, b) => b.love - a.love)
    : [];
  const best  = pillarList[0];
  const worst = pillarList[pillarList.length - 1];

  const displayName = user.full_name || user.email?.split('@')[0] || '?';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    handleCloseCamera();
    setEditMode(false);
    setSaveError('');
    setSaveSuccess(false);
    setEditEmail(user.email || '');
    setEditName(user.full_name || user.email?.split('@')[0] || '');
    setEditPassword('');
    setEditAvatar(null);
    setAvatarPreview(null);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const formData = new FormData();
      if (editEmail && editEmail !== user.email) formData.append('email', editEmail);
      if (editName && editName !== (user.full_name || '')) formData.append('full_name', editName);
      if (editPassword) formData.append('password', editPassword);
      if (editAvatar) formData.append('avatar', editAvatar);

      const res = await fetch(`${BASE_URL}/users/update`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Update failed');
      const { user: updatedUser } = await res.json();
      if (setUser) setUser({ ...user, ...updatedUser });
      setAvatarPreview(null);
      toast.success('Profile updated!', { containerId: 'profile' });
      
      setSaveSuccess(true);
      setEditPassword('');
      setEditMode(false);
    } catch (err: any) {
      setSaveError(err.message || 'Something went wrong');
      toast.error(err.message || 'Something went wrong', { containerId: 'profile' });
    } finally {
      setSaving(false);
    }
  };

  const inputBase = 'w-full text-sm text-gray-800 rounded-xl px-3 py-2.5 transition';
  const inputEditable = `${inputBase} bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent`;
  const inputReadonly = `${inputBase} bg-transparent border border-transparent text-gray-700 cursor-default select-none`;

  const handleOpenCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch (err) {
      toast.error('Camera access denied', { containerId: 'profile' });
    }
  };

  const handleCloseCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setShowCamera(false);
  };

  const handleCapturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setEditAvatar(file);
      setAvatarPreview(URL.createObjectURL(blob));
      handleCloseCamera();
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/60 to-gray-50 pb-16">
      <ToastContainer containerId="profile" autoClose={3000} />
      <div className="max-w-xl mx-auto px-5 pt-8">


        <div className="relative bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#5B21B6] rounded-3xl p-6 text-white overflow-hidden mb-5 shadow-2xl shadow-violet-200">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-[radial-gradient(ellipse,rgba(184,134,11,0.09),transparent_70%)] pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-700 flex items-center justify-center text-xl font-black shadow-lg flex-shrink-0 select-none overflow-hidden">
              {avatarPreview || user.avatar
                ? <img src={avatarPreview || user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black tracking-tight truncate">{displayName}</h2>
              {user.email && <p className="text-white/50 text-xs truncate">{user.email}</p>}
              {user.age   && <p className="text-white/60 text-sm">{user.age} {t('profile.yearsOld')}</p>}
              <div className="mt-1.5 flex items-center gap-2">
                {subscribed ? (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-[#1E1B4B] text-[10px] font-black px-2.5 py-0.5 rounded-full capitalize">
                    ⭐ {plan} PLAN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-white/70 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                    {t('profile.freePlan')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-white/70 text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {global && (
            <div className="relative mt-5 flex gap-3">
              <div className="flex-1 bg-white/8 border border-white/12 rounded-2xl py-3 text-center">
                <div className="text-2xl font-black text-yellow-400">{global.ego}%</div>
                <div className="text-[10px] font-bold text-yellow-300/80 mt-0.5">🟡 EGO</div>
              </div>
              <div className="flex items-center justify-center px-2 text-white/30 text-lg">⚡</div>
              <div className="flex-1 bg-white/8 border border-white/12 rounded-2xl py-3 text-center">
                <div className="text-2xl font-black text-violet-300">{global.love}%</div>
                <div className="text-[10px] font-bold text-violet-300/80 mt-0.5">💜 LOVE</div>
              </div>
            </div>
          )}
        </div>

      
        <div className="mb-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">{t('profile.editProfile')}</h3>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 transition">
                  ✏️ {t('profile.editButton') || 'Edit Profile'}
                </button>
              ) : (
                <button onClick={handleCancelEdit} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                  {t('profile.cancel') || 'Cancel'}
                </button>
              )}
            </div>

          
            <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-700 flex items-center justify-center text-lg font-black text-white flex-shrink-0 overflow-hidden shadow">
                {avatarPreview || user.avatarUrl || user.avatar
                  ? <img src={avatarPreview || user.avatarUrl || user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : initials
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">{t('profile.profilePicture') || 'Profile Picture'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editMode ? 'JPG, PNG · max 2MB' : (avatarPreview || user.avatarUrl || user.avatar ? 'Custom photo' : 'No photo uploaded')}
                </p>
              </div>
              {editMode ? (
                <div className="flex flex-col gap-1.5">
                  <label className="cursor-pointer text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition text-center">
                    📁 Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <button onClick={handleOpenCamera} className="text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition">
                    📷 Camera
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-300 font-medium">🔒</span>
              )}
            </div>

          
            <div className="px-5 py-4 border-b border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} readOnly={!editMode} className={editMode ? inputEditable : inputReadonly} />
            </div>

            
            <div className="px-5 py-4 border-b border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('profile.emailLabel') || 'Email'}</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} readOnly={!editMode} className={editMode ? inputEditable : inputReadonly} />
            </div>

            <div className="px-5 py-4 border-b border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t('profile.newPassword') || 'Password'}</label>
              {editMode ? (
                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder={t('profile.passwordPlaceholder') || 'Enter new password…'} className={inputEditable} />
              ) : (
                <input type="password" value="placeholder" readOnly className={`${inputReadonly} tracking-widest text-gray-300`} />
              )}
            </div>

          
            {editMode && (
              <div className="px-5 py-4">
                {saveError && <p className="text-xs text-red-500 mb-3">⚠️ {saveError}</p>}
                {saveSuccess && <p className="text-xs text-emerald-600 mb-3">✅ {t('profile.saveSuccess') || 'Profile updated!'}</p>}
                <button onClick={handleSaveProfile} disabled={saving}
                  className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:opacity-90 transition disabled:opacity-50">
                  {saving ? (t('profile.saving') || 'Saving…') : (t('profile.saveChanges') || 'Save Changes')}
                </button>
              </div>
            )}
          </div>
        </div>

       
        {global && (
          <div className="mb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('profile.yourAvatar')}</h3>
            <AvatarCard egoPercent={global.ego} />
          </div>
        )}

       
        <div className="mb-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('profile.activity')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-lg font-black text-indigo-950">{freeResults ? '45' : '0'}</div>
              <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{t('profile.freeQuestions')}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">🧭</div>
              <div className="text-lg font-black text-indigo-950">9</div>
              <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{t('profile.pillarsExplored')}</div>
            </div>
            <div className={`rounded-2xl p-4 text-center shadow-sm border ${subscribed ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
              <div className="text-2xl mb-1">{subscribed ? '⭐' : '🔒'}</div>
              <div className={`text-lg font-black ${subscribed ? 'text-yellow-700' : 'text-gray-300'}`}>
                {subscribed ? t('profile.yes') : t('profile.no')}
              </div>
              <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{t('profile.premiumReport')}</div>
            </div>
          </div>
        </div>

       
        {pillarList.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('profile.pillarHighlights')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">{t('profile.strongest')}</div>
                <div className="text-base font-black text-indigo-950">{best.icon} {t(`pillars.${best.id}.name`)}</div>
                <div className="text-xs text-gray-400 mt-1">LOVE {best.love}%</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">{t('profile.toDevelop')}</div>
                <div className="text-base font-black text-indigo-950">{worst.icon} {t(`pillars.${worst.id}.name`)}</div>
                <div className="text-xs text-gray-400 mt-1">LOVE {worst.love}%</div>
              </div>
            </div>
          </div>
        )}

       
        <div className="mb-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('profile.quickActions')}</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
            <Link href="/quiz" className="flex items-center gap-3 px-5 py-4 hover:bg-violet-50 transition group">
              <span className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-base group-hover:bg-violet-200 transition">📋</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{t('profile.retakeQuiz')}</div>
                <div className="text-xs text-gray-400">{t('profile.freeQuestionsCount')}</div>
              </div>
              <span className="text-gray-300">›</span>
            </Link>

            {freeResults && (
              <Link href="/results" className="flex items-center gap-3 px-5 py-4 hover:bg-violet-50 transition group">
                <span className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-base group-hover:bg-violet-200 transition">📊</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{t('profile.viewResults')}</div>
                  <div className="text-xs text-gray-400">{t('profile.latestFreeTest')}</div>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            )}

            {subscribed ? (
              <Link href="/premium-quiz" className="flex items-center gap-3 px-5 py-4 hover:bg-yellow-50 transition group">
                <span className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center text-base group-hover:bg-yellow-200 transition">⭐</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{t('profile.premiumQuiz')}</div>
                  <div className="text-xs text-gray-400">{t('profile.deepQuestions')}</div>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            ) : (
              <Link href="/subscription" className="flex items-center gap-3 px-5 py-4 hover:bg-yellow-50 transition group">
                <span className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center text-base group-hover:bg-yellow-200 transition">🔒</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{t('profile.unlockPremium')}</div>
                  <div className="text-xs text-yellow-600 font-semibold">{t('profile.seePlans')}</div>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            )}

            {premiumResults && (
              <Link href="/premium-report" className="flex items-center gap-3 px-5 py-4 hover:bg-violet-50 transition group">
                <span className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-base group-hover:bg-indigo-200 transition">📄</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{t('profile.premiumReport')}</div>
                  <div className="text-xs text-gray-400">{t('profile.fullAnalysis')}</div>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            )}

            <Link href="/subscription" className="flex items-center gap-3 px-5 py-4 hover:bg-violet-50 transition group">
              <span className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-base group-hover:bg-indigo-200 transition">💳</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{t('profile.subscription')}</div>
                <div className="text-xs text-gray-400">{subscribed ? t('profile.managePlan') : t('profile.viewPlans')}</div>
              </div>
              <span className="text-gray-300">›</span>
            </Link>
          </div>
        </div>

       
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="w-full py-3 text-sm font-semibold text-red-400 border border-red-100 rounded-2xl hover:bg-red-50 transition"
        >
          {t('profile.signOut')}
        </button>

        <p className="text-center text-[10px] text-gray-400 mt-8">{t('footer')}</p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">📷 Take Photo</h3>
              <button onClick={handleCloseCamera} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition">✕ Close</button>
            </div>
            <div className="relative bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-square object-cover" />
            </div>
            <div className="p-4">
              <button onClick={handleCapturePhoto} className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:opacity-90 transition">
                📸 Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
