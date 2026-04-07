import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { Upload, Camera, Send, CheckCircle, AlertCircle, Clock, XCircle, FileText, User } from 'lucide-react';

export default function InvestorKYC() {
  const { partyName, kycStatus, refreshKYC } = useApp();
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [idType, setIdType] = useState('passport');
  const [idNumber, setIdNumber] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, [stream]);

  const handleIdCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Max 5MB'); return; }
    setIdCardFile(file);
    const r = new FileReader(); r.onload = () => setIdCardPreview(r.result as string); r.readAsDataURL(file); setError('');
  };

  const handleSelfieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader(); r.onload = () => setSelfiePreview(r.result as string); r.readAsDataURL(file); setUseLiveCamera(false); setError('');
  };

  const startCamera = async () => {
    try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } }); setStream(s); setUseLiveCamera(true); if (videoRef.current) videoRef.current.srcObject = s; }
    catch { setError('Camera access denied'); }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const c = canvasRef.current, v = videoRef.current; c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    setSelfiePreview(c.toDataURL('image/jpeg', 0.8));
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); } setUseLiveCamera(false);
  };

  const submit = async () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!idNumber.trim()) { setError('ID number is required'); return; }
    if (!idCardPreview) { setError('Upload your ID card'); return; }
    if (!selfiePreview) { setError('Take or upload a selfie'); return; }
    setSubmitting(true); setError('');
    try {
      const result = await api.submitKYCFull({ investorName: partyName, fullName, nationality, idType, idNumber, idCardBase64: idCardPreview, selfieBase64: selfiePreview });
      if (result.error) setError(result.error); else { setSuccess(true); refreshKYC(); }
    } catch (e: any) { setError(e.message || 'Submission failed'); }
    setSubmitting(false);
  };

  if (kycStatus === 'approved') return (
    <div className="max-w-2xl"><h1 className="text-2xl font-bold text-white mb-6">KYC Verification</h1>
      <div className="bg-green-900/20 border border-green-800 rounded-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-semibold mb-2">KYC Approved</h2>
        <p className="text-gray-400">Your identity has been verified. You can now browse projects and invest.</p>
      </div></div>
  );

  if (kycStatus === 'pending') return (
    <div className="max-w-2xl"><h1 className="text-2xl font-bold text-white mb-6">KYC Verification</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 text-center">
        <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-semibold mb-2">Under Review</h2>
        <p className="text-gray-400">Your documents are being reviewed by the admin.</p>
      </div></div>
  );

  if (success) return (
    <div className="max-w-2xl"><h1 className="text-2xl font-bold text-white mb-6">KYC Verification</h1>
      <div className="bg-green-900/20 border border-green-800 rounded-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-semibold mb-2">Submitted Successfully</h2>
        <p className="text-gray-400">Your documents are being reviewed.</p>
      </div></div>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">KYC Verification</h1>
      <p className="text-gray-500 mb-6">Submit your identity documents to start investing</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">1</div>
          <h2 className="text-white font-semibold">Personal Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Full Legal Name *</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Alice Chen"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-green-500 outline-none" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Nationality</label>
            <input value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. South African"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-green-500 outline-none" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">ID Type</label>
            <select value={idType} onChange={e => setIdType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm">
              <option value="passport">Passport</option><option value="national_id">National ID</option><option value="drivers_license">Driver License</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">ID Number *</label>
            <input value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="Document number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-green-500 outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">2</div>
          <h2 className="text-white font-semibold">Identity Documents</h2>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded ml-2">Off-Chain</span>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-gray-400 text-sm mb-2 flex items-center gap-1"><FileText size={14} /> ID Card / Passport *</label>
            {idCardPreview ? (
              <div className="relative"><img src={idCardPreview} alt="ID" className="w-full h-48 object-cover rounded-lg border border-gray-700" />
                <button onClick={() => { setIdCardFile(null); setIdCardPreview(''); }} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"><XCircle size={16} /></button></div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-green-500">
                <Upload size={24} className="text-gray-500 mb-2" /><span className="text-gray-400 text-sm">Click to upload</span>
                <input type="file" accept="image/*" onChange={handleIdCard} className="hidden" />
              </label>
            )}
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 flex items-center gap-1"><User size={14} /> Live Selfie *</label>
            {selfiePreview && !useLiveCamera ? (
              <div className="relative"><img src={selfiePreview} alt="Selfie" className="w-full h-48 object-cover rounded-lg border border-gray-700" />
                <button onClick={() => setSelfiePreview('')} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"><XCircle size={16} /></button></div>
            ) : useLiveCamera ? (
              <div className="relative"><video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-lg border border-gray-700" />
                <button onClick={captureSelfie} className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1"><Camera size={14} /> Capture</button>
                <canvas ref={canvasRef} className="hidden" /></div>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={startCamera} className="flex flex-col items-center justify-center w-full h-[5.5rem] bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg hover:border-green-500"><Camera size={24} className="text-green-400 mb-1" /><span className="text-gray-400 text-sm">Take Live Selfie</span></button>
                <label className="flex flex-col items-center justify-center w-full h-[5.5rem] bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-blue-500"><Upload size={24} className="text-blue-400 mb-1" /><span className="text-gray-400 text-sm">Or Upload Photo</span><input type="file" accept="image/*" onChange={handleSelfieFile} className="hidden" /></label>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-800 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={16} /> {error}</div>}

      <button onClick={submit} disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
        {submitting ? 'Submitting...' : <><Send size={16} /> Submit KYC Application</>}
      </button>
    </div>
  );
}
