import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { CheckCircle, XCircle, RefreshCw, Eye, EyeOff, FileText, User } from 'lucide-react';

interface KYCEntry {
  investorName: string;
  fullName: string;
  nationality: string;
  idType: string;
  idNumber: string;
  status: string;
  hasDocuments: boolean;
  idCardBase64?: string;
  selfieBase64?: string;
}

export default function KYCApprovals() {
  const [requests, setRequests] = useState<KYCEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getKYCFull();
      setRequests(data || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (investorName: string) => {
    await api.approveKYCByName(investorName);
    load();
  };

  const reject = async (investorName: string) => {
    await api.rejectKYCByName(investorName);
    load();
  };

  const toggleDocs = (id: string) => {
    setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return 'bg-green-500/20 text-green-400';
    if (s === 'rejected') return 'bg-red-500/20 text-red-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">KYC Approvals</h1>
          <p className="text-gray-500 text-sm">Review investor identity documents and approve or reject</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No KYC submissions yet</p>
          <p className="text-gray-600 text-sm mt-1">Investors submit KYC from their portal with ID card + selfie</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.investorName} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-semibold text-lg">{r.fullName || r.investorName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusBadge(r.status)}`}>{r.status}</span>
                    </div>
                    <div className="text-gray-500 text-sm">{r.investorName}</div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(r.investorName)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => reject(r.investorName)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Nationality</span>
                    <div className="text-white">{r.nationality || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">ID Type</span>
                    <div className="text-white">{r.idType || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">ID Number</span>
                    <div className="text-white">{r.idNumber || '—'}</div>
                  </div>
                </div>

                {r.hasDocuments && (
                  <button onClick={() => toggleDocs(r.investorName)}
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    {expandedDocs[r.investorName] ? <EyeOff size={14} /> : <Eye size={14} />}
                    {expandedDocs[r.investorName] ? 'Hide Documents' : 'View Documents'}
                  </button>
                )}
              </div>

              {expandedDocs[r.investorName] && r.hasDocuments && (
                <div className="border-t border-gray-800 p-5 bg-gray-950/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Off-Chain Documents</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                        <FileText size={14} /> ID Card / Passport
                      </div>
                      {r.idCardBase64 ? (
                        <img src={r.idCardBase64} alt="ID Card" className="w-full h-56 object-cover rounded-lg border border-gray-700" />
                      ) : (
                        <div className="w-full h-56 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">No image</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                        <User size={14} /> Live Selfie
                      </div>
                      {r.selfieBase64 ? (
                        <img src={r.selfieBase64} alt="Selfie" className="w-full h-56 object-cover rounded-lg border border-gray-700" />
                      ) : (
                        <div className="w-full h-56 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">No image</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}