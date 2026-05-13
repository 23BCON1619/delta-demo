import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { 
  Lock, 
  Key,
  LayoutDashboard, Users, CreditCard, Package, Settings, 
  LogOut, Search, Zap, Check, X, Plus, Trash2, Bird, 
  RefreshCcw, AlertCircle, Loader2 
} from 'lucide-react';
import axios from 'axios';

// Change this to your production backend URL (e.g., https://your-api.com/api)
const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:5001/api" 
  : "/api"; // Assumes backend is on the same domain

// Shared Components
const NavItem = ({ active, icon: Icon, label, to }) => (
  <Link 
    to={to}
    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${active ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Sidebar = ({ onLogout, userEmail }) => {
  const location = useLocation();

  return (
    <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 fixed h-full z-10 flex flex-col">
      <div className="p-6 flex items-center gap-3 mb-8">
        <Bird size={32} className="text-indigo-500" />
        <span className="text-xl font-bold tracking-tight text-white">HireMate Admin</span>
      </div>
      <nav className="space-y-1 px-2 flex-1">
        <NavItem to="/" active={location.pathname === '/'} icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/users" active={location.pathname === '/users'} icon={Users} label="Users" />
        <NavItem to="/requests" active={location.pathname === '/requests'} icon={CreditCard} label="Requests" />
        <NavItem to="/packages" active={location.pathname === '/packages'} icon={Package} label="Packages" />
        <NavItem to="/settings" active={location.pathname === '/settings'} icon={Settings} label="Settings" />
      </nav>
      
      <div className="p-4 border-t border-slate-800 bg-black/20">
        <div className="text-xs text-slate-500 mb-2 truncate px-2">Access Level:</div>
        <div className="text-sm text-indigo-400 font-medium truncate px-2 mb-4">Master Administrator</div>
        <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

// Pages
const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, pending: 0, approved: 0, rejected: 0, packages: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/stats`);
        setStats(res.data);
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Users" value={stats.users} icon={Users} color="text-blue-400" />
        <StatCard label="Pending Requests" value={stats.pending} icon={CreditCard} color="text-amber-400" />
        <StatCard label="Approved Requests" value={stats.approved} icon={Check} color="text-emerald-400" />
        <StatCard label="Rejected Requests" value={stats.rejected} icon={X} color="text-red-400" />
        <StatCard label="Active Packages" value={stats.packages} icon={Package} color="text-indigo-400" />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 bg-white/5 rounded-xl ${color}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-slate-400 text-sm">{label}</div>
  </div>
);

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const addCredits = async (uid) => {
    const min = prompt("Add Minutes:", "60");
    const q = prompt("Add Questions:", "20");
    if (min && q) {
      await axios.post(`${API_BASE}/users/add-credits`, {
        uid,
        minutes: parseInt(min),
        questions: parseInt(q)
      });
      fetchUsers();
    }
  };

  const filtered = users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">User Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search email..." 
            className="bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white outline-none focus:border-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-white">
          <thead className="bg-white/5 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">User Details</th>
              <th className="p-4">Minutes</th>
              <th className="p-4">Questions</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-white">{u.email}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{u.id}</div>
                </td>
                <td className="p-4 text-indigo-400 font-bold">{u.credits || 0}</td>
                <td className="p-4 text-emerald-400 font-bold">{u.questionCredits || 0}</td>
                <td className="p-4 text-slate-400 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  }) : 'N/A'}
                </td>
                <td className="p-4">
                  <button onClick={() => addCredits(u.id)} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                    <Zap size={16} /> Add Credits
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RequestsPage = () => {
  const [reqs, setReqs] = useState([]);
  const [approvingReq, setApprovingReq] = useState(null);
  const [rejectingReq, setRejectingReq] = useState(null);
  const [deletingReq, setDeletingReq] = useState(null);
  const [editCredits, setEditCredits] = useState({ min: 0, q: 0 });

  const fetchReqs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/requests`);
      setReqs(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchReqs(); }, []);

  const handleApproveClick = async (req) => {
    const packageId = req.packageId || req.amount;
    let initialCredits = { min: 60, q: 40 };
    try {
      const pkgRes = await axios.get(`${API_BASE}/packages`);
      const pkg = pkgRes.data.find(p => p.id === packageId);
      if (pkg) initialCredits = { min: pkg.min || 0, q: pkg.q || 0 };
    } catch (e) { console.error(e); }
    setEditCredits(initialCredits);
    setApprovingReq(req);
  };

  const confirmApprove = async () => {
    try {
      const res = await axios.post(`${API_BASE}/requests/approve`, {
        reqId: approvingReq.id,
        userId: approvingReq.userId,
        manual: editCredits
      });
      if (res.data.success) {
        alert("Approved successfully!");
        setApprovingReq(null);
        fetchReqs();
      }
    } catch (e) { alert("Error: " + (e.response?.data?.error || e.message)); }
  };

  const confirmReject = async () => {
    try {
      const res = await axios.post(`${API_BASE}/requests/reject`, { reqId: rejectingReq.id });
      if (res.data.success) {
        alert("Request Rejected.");
        setRejectingReq(null);
        fetchReqs();
      }
    } catch (e) { alert("Error: " + (e.response?.data?.error || e.message)); }
  };

  const confirmDelete = async () => {
    try {
      const res = await axios.delete(`${API_BASE}/requests/${deletingReq.id}`);
      if (res.data.success) {
        alert("Record Deleted.");
        setDeletingReq(null);
        fetchReqs();
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8">Credit Requests</h2>
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-white">
          <thead className="bg-white/5 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Package/Amount</th>
              <th className="p-4">Time</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {reqs.map(r => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium">
                  <div>{r.userEmail}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{r.platform || 'App'}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-indigo-400">{r.packageId || r.amount || "Manual"}</div>
                  <div className="text-xs text-slate-500">₹{r.amount}</div>
                </td>
                <td className="p-4">
                  <div className="text-xs text-slate-300">
                    {r.timestamp ? new Date(r.timestamp).toLocaleString('en-IN', { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                    }) : 'N/A'}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                    r.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {r.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleApproveClick(r)} 
                          className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => setRejectingReq(r)} 
                          className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setDeletingReq(r)} 
                        className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm p-8 rounded-2xl border border-slate-800 animate-fade-in shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Approval</h3>
            <p className="text-slate-400 text-sm mb-6">Credits for <span className="text-indigo-400 font-bold">{approvingReq.userEmail}</span></p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 ml-1 uppercase">Minutes</label>
                <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" value={editCredits.min} onChange={e => setEditCredits({...editCredits, min: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="text-xs text-slate-500 ml-1 uppercase">Questions</label>
                <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white" value={editCredits.q} onChange={e => setEditCredits({...editCredits, q: parseInt(e.target.value) || 0})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={confirmApprove} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold">Confirm</button>
                <button onClick={() => setApprovingReq(null)} className="flex-1 border border-slate-700 text-white py-3 rounded-lg font-bold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm p-8 rounded-2xl border border-slate-800 animate-fade-in shadow-2xl text-center">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <X size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Reject Request?</h3>
            <p className="text-slate-400 text-sm mb-8">User: {rejectingReq.userEmail}</p>
            <div className="flex gap-4">
              <button onClick={confirmReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-red-600/20 transition-all">Reject Now</button>
              <button onClick={() => setRejectingReq(null)} className="flex-1 border border-slate-700 text-white py-3 rounded-lg font-bold hover:bg-white/5 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm p-8 rounded-2xl border border-slate-800 animate-fade-in shadow-2xl text-center">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Record?</h3>
            <p className="text-slate-400 text-sm mb-8">This will permanently remove the request record for {deletingReq.userEmail}.</p>
            <div className="flex gap-4">
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all">Delete Permanently</button>
              <button onClick={() => setDeletingReq(null)} className="flex-1 border border-slate-700 text-white py-3 rounded-lg font-bold hover:bg-white/5 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PackagesPage = () => {
  const [pkgs, setPkgs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', price: 0, order: 0, min: 0, q: 0 });

  const DEFAULT_LIST = [
    { id: "hours_1", name: "1 Hour (60 Min | 40 Q)", price: 999, order: 1, min: 60, q: 40 },
    { id: "hours_2", name: "2 Hours (120 Min | 60 Q)", price: 1599, order: 2, min: 120, q: 60 },
    { id: "hours_3", name: "3 Hours (180 Min | 80 Q)", price: 1999, order: 3, min: 180, q: 80 },
    { id: "hours_5", name: "5 Hours (300 Min | 100 Q)", price: 2999, order: 4, min: 300, q: 100 },
    { id: "monthly", name: "Monthly (800 Q)", price: 6999, order: 5, min: 0, q: 800 },
    { id: "addon_10", name: "+20 Q Addon", price: 199, order: 6, min: 0, q: 20 },
    { id: "addon_20", name: "+40 Q Addon", price: 299, order: 7, min: 0, q: 40 },
  ];

  const fetchPkgs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/packages`);
      setPkgs(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPkgs(); }, []);

  const syncDefaults = async () => {
    console.log("SYNC STARTED...");
    try {
      const res = await axios.post(`${API_BASE}/packages/setup-defaults`);
      console.log("SYNC RESPONSE:", res.data);
      if (res.data.success) {
        alert("Success! Default packages initialized.");
        fetchPkgs();
      }
    } catch (e) {
      console.error("SYNC ERROR:", e);
      alert("Sync failed: " + (e.response?.data?.error || e.message));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/packages/save`, form);
    setShowModal(false);
    fetchPkgs();
  };

  const del = async (id) => {
    if (confirm("Delete package?")) {
      await axios.delete(`${API_BASE}/packages/${id}`);
      fetchPkgs();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Billing Packages</h2>
        <div className="flex gap-4">
          <button onClick={syncDefaults} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-2 font-bold transition-all">
            <Zap size={18} /> Sync Defaults
          </button>
          <button onClick={() => { setForm({ id: '', name: '', price: 0, order: 0, min: 0, q: 0 }); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all">
            <Plus size={18} /> New Package
          </button>
        </div>
      </div>

      {pkgs.length === 0 ? (
        <div className="bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-3xl p-20 text-center">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Packages Found</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Your billing database is empty. Click the button below to load your default plans.</p>
          <button onClick={syncDefaults} className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all">
            Initialize Default Packages
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pkgs.map(p => (
            <div key={p.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 group relative hover:border-indigo-500/50 transition-all">
              <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
              <div className="text-2xl font-bold text-indigo-400 mb-2">₹{p.price}</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white/5 p-2 rounded-lg text-center">
                  <div className="text-xs text-slate-500 uppercase">Minutes</div>
                  <div className="text-white font-bold">{p.min || 0}</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg text-center">
                  <div className="text-xs text-slate-500 uppercase">Questions</div>
                  <div className="text-white font-bold">{p.q || 0}</div>
                </div>
              </div>
              <div className="text-slate-400 text-sm">ID: {p.id} | Order: {p.order}</div>
              <button onClick={() => { setForm(p); setShowModal(true); }} className="absolute top-4 right-12 text-slate-600 hover:text-indigo-400 transition-colors">
                <Check size={18} title="Edit" />
              </button>
              <button onClick={() => del(p.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors">
                <Trash2 size={18} title="Delete" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md p-8 rounded-2xl border border-slate-800 animate-fade-in shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-bold text-white mb-6">Manage Package</h3>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 ml-1">Package ID (Non-editable if editing)</label>
                <input placeholder="ID (e.g. basic_10)" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500" value={form.id} onChange={e => setForm({...form, id: e.target.value})} required />
              </div>
              <input placeholder="Display Name" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price (₹)" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} required />
                <input type="number" placeholder="Order" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500" value={form.order} onChange={e => setForm({...form, order: parseInt(e.target.value)})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 ml-1">Minutes</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500" value={form.min} onChange={e => setForm({...form, min: parseInt(e.target.value)})} required />
                </div>
                <div>
                  <label className="text-xs text-slate-500 ml-1">Questions</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500" value={form.q} onChange={e => setForm({...form, q: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-700 text-white py-3 rounded-lg font-bold hover:bg-white/5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const [qr, setQr] = useState({ id: null, url: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE}/settings`);
        setQr(res.data.qr);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  const saveQr = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/settings/save-qr`, qr);
    alert("QR URL Updated!");
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <h2 className="text-3xl font-bold text-white mb-8">System Settings</h2>
      <div className="space-y-6">
        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CreditCard size={20} className="text-indigo-500"/> Payment QR Code
          </h3>
          <form onSubmit={saveQr} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 ml-1">Image URL</label>
              <input 
                placeholder="https://example.com/qr.png" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-indigo-500" 
                value={qr.url} 
                onChange={e => setQr({...qr, url: e.target.value})} 
              />
            </div>
            {qr.url && (
              <div className="p-2 bg-white/5 rounded-xl border border-white/10 w-fit">
                <img src={qr.url} className="h-40 rounded-lg shadow-lg" alt="QR Preview" />
              </div>
            )}
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20">
              Update Payment QR
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '454512') {
      onLogin();
    } else {
      setError('Incorrect master password');
      setPassword('');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-slate-900/50 backdrop-blur-xl w-full max-w-md p-10 rounded-3xl border border-slate-800 animate-fade-in shadow-2xl text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4">
            <Bird size={64} className="text-indigo-500" />
          </div>
          <h1 className="text-4xl font-extrabold text-white">HireMate Admin</h1>
          <p className="text-slate-400 mt-3 text-lg">Enter password to access panel</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm border border-red-500/20 mb-6 flex items-center gap-2 justify-center">
          <AlertCircle size={16} /> {error}
        </div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="password"
              placeholder="Master Password"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center text-xl tracking-[0.5em]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-indigo-600/20"
          >
            <Key size={20} />
            Unlock Dashboard
          </button>
        </form>
        
        <p className="text-slate-500 mt-8 text-sm">
          Protected Administrative Terminal
        </p>
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('adminAuth') === 'true');

  const handleLogin = () => {
    localStorage.setItem('adminAuth', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar onLogout={handleLogout} />
        <main className="ml-64 flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
