import { useState, useEffect } from "react";

// ── Config ────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL;

// Haversine formula — matches your backend utils/distance.js
const calcDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ── Theme ─────────────────────────────────────────────────────
const T = {
  primary: "#1B6CA8", primaryLight: "#E6F1FB",
  accent: "#1D9E75",  accentLight: "#E1F5EE",
  danger: "#E24B4A",  dangerLight: "#FCEBEB",
  warning: "#BA7517", warningLight: "#FEF3C7",
  text: "#1a1a1a",    textMuted: "#6b7280",
  border: "rgba(0,0,0,0.09)", surface: "#ffffff", bg: "#f7f9fc",
};

const s = {
  app:   { fontFamily:"'DM Sans','Segoe UI',sans-serif", minHeight:"100vh", background:T.bg, color:T.text },
  nav:   { background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky", top:0, zIndex:100 },
  logo:  { display:"flex", alignItems:"center", gap:10, fontWeight:800, fontSize:20, color:T.primary, cursor:"pointer" },
  card:  { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:24, marginBottom:20 },
  inp:   { width:"100%", padding:"10px 14px", border:`1px solid ${T.border}`, borderRadius:8, fontSize:14, outline:"none", background:T.surface, boxSizing:"border-box", color:T.text },
  lbl:   { display:"block", fontSize:13, fontWeight:500, color:T.textMuted, marginBottom:6 },
  btn:   (v="primary") => ({
    padding:"10px 20px", borderRadius:8, border:"none", fontWeight:600, fontSize:14, cursor:"pointer", transition:"all 0.15s",
    background: v==="primary"?T.primary : v==="danger"?T.danger : v==="success"?T.accent : T.bg,
    color: v==="ghost" ? T.textMuted : "#fff",
  }),
  badge: (c) => ({
    display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600,
    background: c==="green"?T.accentLight : c==="red"?T.dangerLight : c==="blue"?T.primaryLight : c==="warn"?T.warningLight : "#f3f4f6",
    color:       c==="green"?T.accent      : c==="red"?T.danger      : c==="blue"?T.primary      : c==="warn"?T.warning      : T.textMuted,
  }),
  sTitle: { fontSize:17, fontWeight:700, marginBottom:16, color:T.text },
  g2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  g3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 },
  g4: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16 },
  stat: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 20px" },
};

// ── Icons ──────────────────────────────────────────────────────
const HeartIcon = ({ size=20, color=T.danger }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;

const HospIcon = ({ size=20, color=T.primary }) =>
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

// ── Shared Components ──────────────────────────────────────────
function Avatar({ name, size=40, bg=T.primaryLight, color=T.primary }) {
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.35,flexShrink:0}}>{i}</div>;
}

const Field = ({ label, children }) =>
  <div style={{marginBottom:16}}><label style={s.lbl}>{label}</label>{children}</div>;

const InfoRow = ({ label, value, last }) =>
  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:last?"none":`1px solid ${T.border}`}}>
    <span style={{color:T.textMuted,fontSize:14}}>{label}</span>
    <span style={{fontSize:14,fontWeight:500}}>{value||"—"}</span>
  </div>;

function Spinner() {
  return <div style={{textAlign:"center",padding:60,color:T.textMuted,fontSize:14}}>Loading…</div>;
}

// ── Auth Page ──────────────────────────────────────────────────
// Backend routes: POST /api/auth/register  POST /api/auth/login
// register returns: { token, profile }
// login returns:    { token, user: { name, role } }
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"patient" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if (!form.email || !form.password) { setError("Please enter email and password."); return; }
    setError(""); setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");

      // login returns data.user.name, register uses form.name
      const name = data.user?.name || form.name;
      const role = data.user?.role || form.role;
      onLogin({ token: data.token, role, name });
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}>
            <HeartIcon size={32}/>
            <span style={{fontWeight:800,fontSize:28,color:T.primary}}>HealthBridge</span>
          </div>
          <p style={{color:T.textMuted,fontSize:15,margin:0}}>Your health, connected.</p>
        </div>

        <div style={{...s.card,padding:32}}>
          {/* Tab switcher */}
          <div style={{display:"flex",background:T.bg,borderRadius:10,padding:4,marginBottom:24}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,cursor:"pointer",background:mode===m?T.surface:"transparent",color:mode===m?T.primary:T.textMuted,fontWeight:mode===m?700:400,fontSize:14,boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>

          {mode==="register" && <Field label="Full Name"><input style={s.inp} placeholder="Your full name" value={form.name} onChange={e=>set("name",e.target.value)}/></Field>}
          <Field label="Email"><input style={s.inp} type="email" placeholder="you@email.com" value={form.email} onChange={e=>set("email",e.target.value)}/></Field>
          <Field label="Password"><input style={s.inp} type="password" placeholder="••••••••" value={form.password} onChange={e=>set("password",e.target.value)}/></Field>

          <Field label="Role">
            <select style={s.inp} value={form.role} onChange={e=>set("role",e.target.value)}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="hospital">Hospital</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          {error && <p style={{color:T.danger,fontSize:13,marginBottom:12}}>{error}</p>}
          <button onClick={submit} disabled={loading} style={{...s.btn("primary"),width:"100%",padding:"12px 0",fontSize:15}}>
            {loading ? "Please wait…" : mode==="login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Patient Home ───────────────────────────────────────────────
// Backend: GET /api/appointment/patient
// Returns: { appointments: [{ doctor: { user: { name }, specialization }, appointmentDate, status }] }
function PatientHome({ onNavigate, token, userName }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/appointment/patient`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setAppointments(d.appointments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);
return (
  <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
    <div style={{marginBottom:28}}>
      <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800}}>Hello, {userName}</h2>
      <p style={{margin:0,color:T.textMuted,fontSize:14}}>How are you feeling today?</p>
    </div>

    {/* ← ADD THE 4 CARDS GRID HERE */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16,marginBottom:24}}>

      <div style={{...s.card,background:T.dangerLight,border:`1px solid #fca5a5`,cursor:"pointer",marginBottom:0}} onClick={()=>onNavigate("panic")}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><HeartIcon size={22}/><p style={{margin:0,fontWeight:700,fontSize:15}}>SOS Emergency</p></div>
        <p style={{margin:"0 0 16px",color:T.textMuted,fontSize:13}}>Alert the nearest hospital with your live location instantly.</p>
        <button style={s.btn("danger")}>Open SOS</button>
      </div>

      <div style={{...s.card,cursor:"pointer",marginBottom:0}} onClick={()=>onNavigate("resources")}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><HospIcon size={22} color={T.accent}/><p style={{margin:0,fontWeight:700,fontSize:15}}>Hospital Resources</p></div>
        <p style={{margin:"0 0 16px",color:T.textMuted,fontSize:13}}>Browse nearby hospitals, bed availability and services.</p>
        <button style={s.btn("success")}>Find Hospitals</button>
      </div>

      <div style={{...s.card,cursor:"pointer",marginBottom:0}} onClick={()=>onNavigate("profile")}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <p style={{margin:0,fontWeight:700,fontSize:15}}>My Profile</p>
        </div>
        <p style={{margin:"0 0 16px",color:T.textMuted,fontSize:13}}>View and edit your medical profile and emergency contact.</p>
        <button style={s.btn("primary")}>View Profile</button>
      </div>

      <div style={{...s.card,cursor:"pointer",marginBottom:0}} onClick={()=>onNavigate("book")}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p style={{margin:0,fontWeight:700,fontSize:15}}>Book Appointment</p>
        </div>
        <p style={{margin:"0 0 16px",color:T.textMuted,fontSize:13}}>Find a doctor and schedule a consultation.</p>
        <button style={s.btn("success")}>Book Now</button>
      </div>

    </div>
    {/* ← END OF CARDS GRID */}

    <div style={s.card}>
      <p style={s.sTitle}>My Appointments</p>
      {loading ? <Spinner/> : appointments.length === 0 ? (
        <p style={{color:T.textMuted,fontSize:14}}>No appointments yet.</p>
      ) : appointments.map((a,i,arr) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
          <Avatar name={a.doctor?.user?.name} size={40}/>
          <div style={{flex:1}}>
            <p style={{margin:"0 0 2px",fontWeight:600,fontSize:14}}>{a.doctor?.user?.name || "Doctor"}</p>
            <p style={{margin:0,fontSize:13,color:T.textMuted}}>{a.doctor?.specialization} · {a.doctor?.hospital}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{margin:"0 0 4px",fontSize:13,fontWeight:500}}>{new Date(a.appointmentDate).toLocaleDateString()}</p>
            <span style={s.badge(a.status==="scheduled"?"blue":a.status==="completed"?"green":"red")}>{a.status}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}

// ── Patient Profile ────────────────────────────────────────────
// Backend: GET /api/patient/profile  POST /api/patient/profile
// Model fields: age, gender, bloodGroup, phone, address, emergencyContact { name, phone, relation }
function PatientProfile({ token }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const empty = { age:"", gender:"male", bloodGroup:"", phone:"", address:"", emergencyContact:{ name:"", phone:"", relation:"" } };
  const [profile, setProfile] = useState(empty);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    fetch(`${API_BASE}/patient/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.patient) {
          const p = d.patient;
          setUserName(p.user?.name || "");
          const loaded = {
            age:              String(p.age || ""),
            gender:           p.gender || "male",
            bloodGroup:       p.bloodGroup || "",
            phone:            p.phone || "",
            address:          p.address || "",
            emergencyContact: p.emergencyContact || { name:"", phone:"", relation:"" },
          };
          setProfile(loaded);
          setForm(loaded);
        }
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [token]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setEC = (k,v) => setForm(f=>({...f,emergencyContact:{...f.emergencyContact,[k]:v}}));

  const save = async () => {
    try {
      await fetch(`${API_BASE}/patient/profile`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setProfile(form);
      setEditing(false);
      setSaved(true);
      setTimeout(()=>setSaved(false), 3000);
    } catch(e) { console.error(e); }
  };

  if (loading) return <Spinner/>;

  return (
    <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px"}}>
      {saved && <div style={{background:T.accentLight,border:`1px solid ${T.accent}`,borderRadius:8,padding:"10px 16px",marginBottom:16,color:T.accent,fontSize:14,fontWeight:500}}>Profile saved successfully!</div>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <Avatar name={userName} size={56}/>
          <div>
            <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700}}>{userName}</h2>
            <span style={s.badge("blue")}>Patient</span>
          </div>
        </div>
        <button onClick={()=>{setEditing(!editing);setForm(profile);}} style={s.btn(editing?"ghost":"primary")}>
          {editing?"Cancel":"Edit Profile"}
        </button>
      </div>

      {editing ? (
        <div style={s.card}>
          <div style={s.g2}>
            <Field label="Age"><input style={s.inp} value={form.age} onChange={e=>set("age",e.target.value)}/></Field>
            <Field label="Gender">
              <select style={s.inp} value={form.gender} onChange={e=>set("gender",e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group"><input style={s.inp} value={form.bloodGroup} onChange={e=>set("bloodGroup",e.target.value)}/></Field>
            <Field label="Phone"><input style={s.inp} value={form.phone} onChange={e=>set("phone",e.target.value)}/></Field>
          </div>
          <Field label="Address"><textarea style={{...s.inp,height:80,resize:"vertical"}} value={form.address} onChange={e=>set("address",e.target.value)}/></Field>
          <p style={{fontWeight:700,fontSize:14,marginBottom:12}}>Emergency Contact</p>
          <div style={s.g3}>
            <Field label="Name"><input style={s.inp} value={form.emergencyContact.name} onChange={e=>setEC("name",e.target.value)}/></Field>
            <Field label="Phone"><input style={s.inp} value={form.emergencyContact.phone} onChange={e=>setEC("phone",e.target.value)}/></Field>
            <Field label="Relation"><input style={s.inp} value={form.emergencyContact.relation} onChange={e=>setEC("relation",e.target.value)}/></Field>
          </div>
          <button onClick={save} style={s.btn("primary")}>Save Changes</button>
        </div>
      ) : (
        <>
          <div style={s.card}>
            <p style={s.sTitle}>Personal Information</p>
            <InfoRow label="Age"         value={profile.age ? profile.age+" years" : "—"}/>
            <InfoRow label="Gender"      value={profile.gender}/>
            <InfoRow label="Blood Group" value={profile.bloodGroup}/>
            <InfoRow label="Phone"       value={profile.phone}/>
            <InfoRow label="Address"     value={profile.address} last/>
          </div>
          <div style={s.card}>
            <p style={s.sTitle}>Emergency Contact</p>
            <InfoRow label="Name"     value={profile.emergencyContact.name}/>
            <InfoRow label="Phone"    value={profile.emergencyContact.phone}/>
            <InfoRow label="Relation" value={profile.emergencyContact.relation} last/>
          </div>
        </>
      )}
    </div>
  );
}

// ── Hospital Resources (Patient view) ──────────────────────────
// Backend: GET /api/hospital/public/list
// Returns: { hospitals: [{ name, phone, address, emergencySupport, resources: { availableBeds, icuAvailable, totalBeds, icuBeds, ventilators }, availabilityWarning }] }
function HospitalResources({ token }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
  // Get user's location first
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;

    fetch(`${API_BASE}/hospital/public/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const mapped = (d.hospitals || []).map(h => {
          // Calculate distance using hospital's lat/lng
          const dist = h.location?.latitude && h.location?.longitude
            ? calcDistance(userLat, userLng, h.location.latitude, h.location.longitude)
            : null;

          return {
            name:        h.name,
            phone:       h.phone || "N/A",
            address:     h.address || "",
            beds:        h.resources?.availableBeds ?? 0,
            icu:         h.resources?.icuAvailable ?? 0,
            totalBeds:   h.resources?.totalBeds ?? 0,
            icuBeds:     h.resources?.icuBeds ?? 0,
            ventilators: h.resources?.ventilators ?? 0,
            er:          h.emergencySupport,
            status:      h.resources?.availableBeds > 0 ? "open" : "limited",
            warning:     h.availabilityWarning || null,
            dist:        dist ? `${dist.toFixed(1)} km` : "Unknown",
            distNum:     dist || 9999,
          };
        });

        // Sort by distance — nearest first
        mapped.sort((a, b) => a.distNum - b.distNum);
        setHospitals(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  }, () => {
    // Location denied — still load hospitals without distance
    fetch(`${API_BASE}/hospital/public/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const mapped = (d.hospitals || []).map(h => ({
          name:        h.name,
          phone:       h.phone || "N/A",
          address:     h.address || "",
          beds:        h.resources?.availableBeds ?? 0,
          icu:         h.resources?.icuAvailable ?? 0,
          totalBeds:   h.resources?.totalBeds ?? 0,
          icuBeds:     h.resources?.icuBeds ?? 0,
          ventilators: h.resources?.ventilators ?? 0,
          er:          h.emergencySupport,
          status:      h.resources?.availableBeds > 0 ? "open" : "limited",
          warning:     h.availabilityWarning || null,
          dist:        "Enable location",
          distNum:     9999,
        }));
        setHospitals(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  });
}, [token]);

  const filtered = hospitals.filter(h => {
    const matchText = h.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter==="all" ||
      (filter==="er"   && h.er) ||
      (filter==="beds" && h.beds > 0) ||
      (filter==="icu"  && h.icu > 0);
    return matchText && matchFilter;
  });

  const statusColor = st => st==="open"?"green":st==="limited"?"warn":"red";

  if (loading) return <Spinner/>;

  if (selected) {
    const h = selected;
    return (
      <div style={{maxWidth:700,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={()=>setSelected(null)} style={{...s.btn("ghost"),marginBottom:20,padding:"6px 12px",fontSize:13,border:`1px solid ${T.border}`}}>← Back</button>
        <div style={s.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              <div style={{width:48,height:48,borderRadius:12,background:T.primaryLight,display:"flex",alignItems:"center",justifyContent:"center"}}><HospIcon size={24}/></div>
              <div>
                <h2 style={{margin:"0 0 4px",fontSize:19,fontWeight:800}}>{h.name}</h2>
                <p style={{margin:0,fontSize:13,color:T.textMuted}}>{h.address}</p>
              </div>
            </div>
            <span style={s.badge(statusColor(h.status))}>{h.status}</span>
          </div>

          {h.warning && (
            <div style={{background:T.warningLight,border:`1px solid ${T.warning}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:T.warning,fontWeight:500}}>
              ⚠ {h.warning}
            </div>
          )}

          <div style={{...s.g3,marginBottom:20}}>
            {[
              {label:"Available Beds", val:h.beds,   color:h.beds>5?T.accent:h.beds>0?T.warning:T.danger},
              {label:"ICU Available",  val:h.icu,    color:h.icu>0?T.accent:T.danger},
              {label:"Ventilators",    val:h.ventilators, color:T.primary},
            ].map(st=>(
              <div key={st.label} style={{...s.stat,textAlign:"center",borderTop:`3px solid ${st.color}`}}>
                <p style={{margin:"0 0 4px",fontSize:12,color:T.textMuted}}>{st.label}</p>
                <p style={{margin:0,fontSize:22,fontWeight:800,color:st.color}}>{st.val}</p>
              </div>
            ))}
          </div>

          <InfoRow label="Phone"       value={h.phone}/>
          <InfoRow label="Emergency Room" value={h.er?"Available":"Not Available"}/>
          <InfoRow label="Total Beds"  value={h.totalBeds}/>
          <InfoRow label="Total ICU"   value={h.icuBeds} last/>
          <InfoRow label="Distance"    value={selected.dist}/>
          <InfoRow label="Phone"       value={h.phone}/>
        </div>
        <a href={`tel:${h.phone}`} style={{...s.btn("primary"),textDecoration:"none",display:"inline-block"}}>Call Hospital</a>
      </div>
    );
  }

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800}}>Hospital Resources</h2>
        <p style={{margin:0,color:T.textMuted,fontSize:14}}>Live bed and ICU availability from registered hospitals</p>
      </div>

      <div style={{...s.g4,marginBottom:24}}>
        {[
          {label:"Hospitals",      val:hospitals.length},
          {label:"With ER",        val:hospitals.filter(h=>h.er).length},
          {label:"Total Beds Free",val:hospitals.reduce((a,h)=>a+h.beds,0)},
          {label:"ICU Beds Free",  val:hospitals.reduce((a,h)=>a+h.icu,0)},
        ].map(st=>(
          <div key={st.label} style={{...s.stat,textAlign:"center"}}>
            <p style={{margin:"0 0 4px",fontSize:12,color:T.textMuted}}>{st.label}</p>
            <p style={{margin:0,fontSize:24,fontWeight:800,color:T.primary}}>{st.val}</p>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center"}}>
        <input style={{...s.inp,flex:1}} placeholder="Search hospitals…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:"flex",gap:6}}>
          {[["all","All"],["er","Has ER"],["beds","Has Beds"],["icu","Has ICU"]].map(([v,label])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${filter===v?T.primary:T.border}`,background:filter===v?T.primaryLight:"transparent",color:filter===v?T.primary:T.textMuted,fontWeight:filter===v?600:400,fontSize:13,cursor:"pointer"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {filtered.length===0 ? (
          <p style={{color:T.textMuted,textAlign:"center",padding:32}}>No hospitals found.</p>
        ) : filtered.map((h,i)=>(
          <div key={i} style={{...s.card,marginBottom:0,cursor:"pointer"}} onClick={()=>setSelected(h)}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:10,background:T.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <HospIcon size={22}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <p style={{margin:0,fontWeight:700,fontSize:15}}>{h.name}</p>
                  <span style={s.badge(statusColor(h.status))}>{h.status}</span>
                  {h.er && <span style={s.badge("red")}>ER</span>}
                  {h.warning && <span style={s.badge("warn")}>⚠ {h.warning}</span>}
                </div>
                <p style={{margin:0,fontSize:13,color:T.textMuted}}>
                {h.address || "Address not listed"} · <strong style={{color:T.primary}}>{h.dist}</strong>
                </p>
              </div>
              <div style={{display:"flex",gap:20,textAlign:"center",flexShrink:0}}>
                <div>
                  <p style={{margin:"0 0 2px",fontSize:20,fontWeight:800,color:h.beds>5?T.accent:h.beds>0?T.warning:T.danger}}>{h.beds}</p>
                  <p style={{margin:0,fontSize:11,color:T.textMuted}}>Beds free</p>
                </div>
                <div>
                  <p style={{margin:"0 0 2px",fontSize:20,fontWeight:800,color:h.icu>0?T.accent:T.danger}}>{h.icu}</p>
                  <p style={{margin:0,fontSize:11,color:T.textMuted}}>ICU free</p>
                </div>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panic / SOS Screen ─────────────────────────────────────────
// Backend: POST /api/panic/trigger
// Body: { latitude, longitude, address, reason }
// Returns: { hospital: { name, resources, availabilityWarning }, distanceInKm, panic }
function PanicScreen({ token }) {
  const [stage, setStage] = useState("idle"); // idle | locating | alerting | sent
  const [alertedHosp, setAlertedHosp] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (msg, type="sent") => setLog(l=>[
    { time: new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), msg, type },
    ...l
  ]);

  const trigger = async () => {
    setStage("locating");
    addLog("Detecting your location…");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setStage("alerting");
      addLog("Sending alert to nearest hospital…");

      try {
        const res = await fetch(`${API_BASE}/panic/trigger`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude,
            longitude,
            address: "Current Location",
            reason: "Emergency",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");

        setAlertedHosp({
          name: data.hospital?.name,
          dist: `${data.distanceInKm} km`,
        });
        setStage("sent");
        addLog(`Alert sent to ${data.hospital?.name} — ${data.distanceInKm} km away`, "sent");
        addLog(`Beds available: ${data.hospital?.resources?.availableBeds} · ICU: ${data.hospital?.resources?.icuAvailable}`, "ack");
        if (data.hospital?.availabilityWarning) {
          addLog(`Warning: ${data.hospital.availabilityWarning}`, "warn");
        }
      } catch(err) {
        setStage("idle");
        addLog("Failed to send alert. Call emergency services directly.", "err");
      }
    }, () => {
      setStage("idle");
      addLog("Location access denied. Please enable location and try again.", "err");
    });
  };

  const reset = () => { setStage("idle"); setAlertedHosp(null); };

  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{...s.card,textAlign:"center",padding:40,border:stage==="sent"?`2px solid ${T.danger}`:`1px solid ${T.border}`}}>
        <HeartIcon size={48} color={T.danger}/>
        <h2 style={{fontSize:22,fontWeight:800,margin:"16px 0 6px"}}>Emergency SOS</h2>
        <p style={{color:T.textMuted,fontSize:14,marginBottom:24}}>
          Sends your live location to the <strong>nearest available hospital</strong>. Ambulance will be dispatched immediately.
        </p>

        {stage==="sent" && alertedHosp && (
          <div style={{background:T.dangerLight,border:`1px solid ${T.danger}`,borderRadius:10,padding:"12px 16px",marginBottom:24,textAlign:"left"}}>
            <p style={{margin:"0 0 4px",fontWeight:700,fontSize:14,color:T.danger}}>Alert sent to nearest hospital</p>
            <p style={{margin:0,fontSize:13}}>{alertedHosp.name} · {alertedHosp.dist}</p>
          </div>
        )}

        <button
          onClick={stage==="idle" ? trigger : stage==="sent" ? reset : undefined}
          disabled={stage==="locating"||stage==="alerting"}
          style={{
            width:164, height:164, borderRadius:"50%",
            background: stage==="sent" ? T.dangerLight : (stage==="locating"||stage==="alerting") ? "#fca5a5" : T.danger,
            border: `6px solid ${stage==="sent" ? T.danger : "#fee2e2"}`,
            color: stage==="sent" ? T.danger : "#fff",
            fontSize:15, fontWeight:800,
            cursor: (stage==="locating"||stage==="alerting") ? "not-allowed" : "pointer",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", margin:"0 auto 20px",
            transition:"all 0.2s",
          }}
        >
          <HeartIcon size={32} color={stage==="sent" ? T.danger : "#fff"}/>
          <span style={{marginTop:8}}>
            {stage==="idle"     ? "SOS"
           : stage==="locating" ? "Locating…"
           : stage==="alerting" ? "Alerting…"
           :                      "Reset"}
          </span>
        </button>

        {stage==="idle" && <p style={{fontSize:12,color:T.textMuted}}>Tap to trigger emergency alert</p>}
        {stage==="sent" && <p style={{fontSize:12,color:T.textMuted}}>Tap Reset to dismiss</p>}
      </div>

      {log.length > 0 && (
        <div style={s.card}>
          <p style={s.sTitle}>Alert Log</p>
          {log.map((l,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:i<log.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:l.type==="ack"?T.accent:l.type==="err"?T.danger:T.primary,marginTop:5,flexShrink:0}}/>
              <div>
                <p style={{margin:0,fontSize:14}}>{l.msg}</p>
                <p style={{margin:"2px 0 0",fontSize:12,color:T.textMuted}}>{l.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ── Doctor Profile Setup ───────────────────────────────────────
// Backend: POST /api/doctor/profile
// Model: { specialization, hospital, experience, phone, availability }
function DoctorSetup({ token, onSaved }) {
  const [form, setForm] = useState({
    specialization: "",
    hospital: "",
    experience: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Load existing profile
  useEffect(() => {
    fetch(`${API_BASE}/doctor/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.doc) {
          setForm({
            specialization: d.doc.specialization || "",
            hospital:       d.doc.hospital || "",
            experience:     d.doc.experience?.toString() || "",
            phone:          d.doc.phone || "",
          });
        }
      })
      .catch(()=>{});
  }, [token]);

  const save = async () => {
    if (!form.specialization || !form.hospital) {
      setError("Specialization and hospital are required."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/doctor/profile`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          specialization: form.specialization,
          hospital:       form.hospital,
          experience:     parseInt(form.experience) || 0,
          phone:          form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved && onSaved(); }, 2000);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const specializations = [
    "General", "Cardiology", "Neurology", "Orthopedics",
    "Pediatrics", "Oncology", "Dermatology", "ENT",
    "Gynecology", "Psychiatry", "Radiology", "Surgery",
  ];

  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800}}>Doctor Profile Setup</h2>
        <p style={{margin:0,color:T.textMuted,fontSize:14}}>Complete your profile so patients can book appointments</p>
      </div>

      {saved && <div style={{background:T.accentLight,border:`1px solid ${T.accent}`,borderRadius:8,padding:"10px 16px",marginBottom:16,color:T.accent,fontSize:14,fontWeight:500}}>Profile saved successfully!</div>}
      {error && <div style={{background:T.dangerLight,border:`1px solid ${T.danger}`,borderRadius:8,padding:"10px 16px",marginBottom:16,color:T.danger,fontSize:14}}>{error}</div>}

      <div style={s.card}>
        <p style={{fontWeight:700,fontSize:14,marginBottom:16}}>Professional Information</p>
        <div style={s.g2}>
          <Field label="Specialization *">
            <select style={s.inp} value={form.specialization} onChange={e=>set("specialization",e.target.value)}>
              <option value="">Select specialization</option>
              {specializations.map(sp=>(
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </Field>
          <Field label="Experience (years)">
            <input style={s.inp} type="number" placeholder="e.g. 5" value={form.experience} onChange={e=>set("experience",e.target.value)}/>
          </Field>
        </div>
        <Field label="Hospital / Clinic Name *">
          <input style={s.inp} placeholder="e.g. Apollo Hospitals" value={form.hospital} onChange={e=>set("hospital",e.target.value)}/>
        </Field>
        <Field label="Phone">
          <input style={s.inp} placeholder="+91 98765 43210" value={form.phone} onChange={e=>set("phone",e.target.value)}/>
        </Field>
      </div>

      <button onClick={save} disabled={loading} style={{...s.btn("primary"),padding:"12px 24px",fontSize:15}}>
        {loading ? "Saving…" : "Save Profile"}
      </button>
    </div>
  );
}
// ── Book Appointment ───────────────────────────────────────────
// Backend: GET /api/doctor/list  POST /api/appointment/book
function BookAppointment({ token, onBack }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ appointmentDate:"", reason:"" });
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/doctor/list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setDoctors(d.doctors || []))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [token]);

  const book = async () => {
    if (!selected) { setError("Please select a doctor."); return; }
    if (!form.appointmentDate) { setError("Please select a date and time."); return; }
    setError(""); setBooking(true);
    try {
      const res = await fetch(`${API_BASE}/appointment/book`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          doctorId:        selected._id,
          appointmentDate: form.appointmentDate,
          reason:          form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      setBooked(true);
    } catch(e) {
      setError(e.message);
    } finally {
      setBooking(false);
    }
  };

  if (booked) return (
    <div style={{maxWidth:500,margin:"0 auto",padding:"32px 24px",textAlign:"center"}}>
      <div style={{...s.card,padding:40}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:T.accentLight,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 8px"}}>Appointment Booked!</h2>
        <p style={{color:T.textMuted,fontSize:14,margin:"0 0 8px"}}>
          With <strong>{selected?.user?.name}</strong>
        </p>
        <p style={{color:T.textMuted,fontSize:14,margin:"0 0 24px"}}>
          {new Date(form.appointmentDate).toLocaleString()}
        </p>
        <button onClick={onBack} style={s.btn("primary")}>Back to Home</button>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:800,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={onBack} style={{...s.btn("ghost"),padding:"6px 12px",fontSize:13,border:`1px solid ${T.border}`}}>← Back</button>
        <div>
          <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800}}>Book Appointment</h2>
          <p style={{margin:0,color:T.textMuted,fontSize:14}}>Select a doctor and choose a time</p>
        </div>
      </div>

      {error && <div style={{background:T.dangerLight,border:`1px solid ${T.danger}`,borderRadius:8,padding:"10px 16px",marginBottom:16,color:T.danger,fontSize:14}}>{error}</div>}

      {/* Step 1 — Select Doctor */}
      <div style={s.card}>
        <p style={s.sTitle}>Step 1 — Select a Doctor</p>
        {loading ? <Spinner/> : doctors.length===0 ? (
          <p style={{color:T.textMuted,fontSize:14}}>No doctors available.</p>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {doctors.map((d,i) => (
              <div key={i} onClick={()=>setSelected(d)} style={{
                display:"flex", alignItems:"center", gap:14, padding:"12px 16px",
                borderRadius:10, cursor:"pointer", transition:"all 0.15s",
                border: selected?._id===d._id
                  ? `2px solid ${T.primary}`
                  : `1px solid ${T.border}`,
                background: selected?._id===d._id ? T.primaryLight : T.surface,
              }}>
                <Avatar name={d.user?.name} size={44}/>
                <div style={{flex:1}}>
                  <p style={{margin:"0 0 2px",fontWeight:700,fontSize:15}}>{d.user?.name}</p>
                  <p style={{margin:"0 0 2px",fontSize:13,color:T.textMuted}}>
                    {d.specialization} · {d.hospital}
                  </p>
                  <p style={{margin:0,fontSize:12,color:T.textMuted}}>
                    {d.experience ? `${d.experience} years experience` : ""} {d.phone ? `· ${d.phone}` : ""}
                  </p>
                </div>
                {selected?._id===d._id && (
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 — Pick Date & Reason */}
      {selected && (
        <div style={s.card}>
          <p style={s.sTitle}>Step 2 — Choose Date & Time</p>
          <div style={s.g2}>
            <Field label="Appointment Date & Time *">
              <input
                style={s.inp}
                type="datetime-local"
                value={form.appointmentDate}
                min={new Date().toISOString().slice(0,16)}
                onChange={e=>setForm(f=>({...f,appointmentDate:e.target.value}))}
              />
            </Field>
            <Field label="Reason for Visit">
              <input
                style={s.inp}
                placeholder="e.g. Regular checkup"
                value={form.reason}
                onChange={e=>setForm(f=>({...f,reason:e.target.value}))}
              />
            </Field>
          </div>
          <button onClick={book} disabled={booking} style={{...s.btn("primary"),padding:"12px 24px",fontSize:15}}>
            {booking ? "Booking…" : "Confirm Appointment"}
          </button>
        </div>
      )}
    </div>
  );
}
// ── Doctor Dashboard ───────────────────────────────────────────
// Backend: GET /api/appointment/doctor
// Returns: { appointments: [{ patient: { user: { name }, age, bloodGroup }, appointmentDate, reason, status }] }
function DoctorDashboard({ token, userName }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/appointment/doctor`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setAppointments(d.appointments || []))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [token]);

  const statusColor = st => st==="scheduled"?"blue":st==="completed"?"green":"red";
  const scheduled = appointments.filter(a=>a.status==="scheduled").length;
  const completed  = appointments.filter(a=>a.status==="completed").length;

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE}/appointment/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setAppointments(a => a.map(x => x._id===id ? {...x,status} : x));
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800}}>Welcome, {userName}</h2>
        <p style={{margin:0,color:T.textMuted,fontSize:14}}>Your appointments and patients</p>
      </div>

      <div style={{...s.g3,marginBottom:24}}>
        {[
          {label:"Total Appointments", val:appointments.length, c:T.primary},
          {label:"Scheduled",          val:scheduled,           c:T.primary},
          {label:"Completed",          val:completed,           c:T.accent},
        ].map(st=>(
          <div key={st.label} style={{...s.stat,borderLeft:`4px solid ${st.c}`}}>
            <p style={{margin:"0 0 4px",fontSize:12,color:T.textMuted,fontWeight:500}}>{st.label}</p>
            <p style={{margin:0,fontSize:28,fontWeight:800,color:st.c}}>{st.val}</p>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <p style={s.sTitle}>Appointments</p>
        {loading ? <Spinner/> : appointments.length===0 ? (
          <p style={{color:T.textMuted,fontSize:14}}>No appointments yet.</p>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead>
              <tr>{["Patient","Blood Group","Date","Reason","Status","Action"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"8px 0",fontWeight:500,fontSize:12,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${T.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {appointments.map((a,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"12px 0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar name={a.patient?.user?.name} size={32}/>
                      <span style={{fontWeight:500}}>{a.patient?.user?.name || "Patient"}</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 0"}}>{a.patient?.bloodGroup || "—"}</td>
                  <td style={{padding:"12px 0",color:T.textMuted}}>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                  <td style={{padding:"12px 0"}}>{a.reason || "—"}</td>
                  <td style={{padding:"12px 0"}}><span style={s.badge(statusColor(a.status))}>{a.status}</span></td>
                  <td style={{padding:"12px 0"}}>
                    {a.status==="scheduled" && (
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>updateStatus(a._id,"completed")} style={{...s.btn("success"),padding:"4px 10px",fontSize:12}}>Done</button>
                        <button onClick={()=>updateStatus(a._id,"cancelled")} style={{...s.btn("ghost"),padding:"4px 10px",fontSize:12,border:`1px solid ${T.border}`}}>Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
// ── Hospital Setup Page ────────────────────────────────────────
function HospitalSetup({ token, onSaved }) {
  const [form, setForm] = useState({
    name:"", phone:"", address:"",
    latitude:"", longitude:"",
    emergencySupport: false,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    fetch(`${API_BASE}/hospital/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.hospital) {
          setForm({
            name:             d.hospital.name || "",
            phone:            d.hospital.phone || "",
            address:          d.hospital.address || "",
            latitude:         d.hospital.location?.latitude?.toString() || "",
            longitude:        d.hospital.location?.longitude?.toString() || "",
            emergencySupport: d.hospital.emergencySupport || false,
          });
        }
      })
      .catch(()=>{});
  }, [token]);

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        set("latitude",  pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
      },
      () => setError("Location access denied. Enter coordinates manually.")
    );
  };

  const save = async () => {
    if (!form.name || !form.latitude || !form.longitude) {
      setError("Name, latitude and longitude are required."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hospital/profile`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          name:             form.name,
          phone:            form.phone,
          address:          form.address,
          location: {
            latitude:  parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
          },
          emergencySupport: form.emergencySupport,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaved && onSaved(); }, 2000);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800}}>Hospital Profile Setup</h2>
        <p style={{margin:0,color:T.textMuted,fontSize:14}}>Fill in your hospital details so patients can find you</p>
      </div>

      {saved && <div style={{background:T.accentLight,border:`1px solid ${T.accent}`,borderRadius:8,padding:"10px 16px",marginBottom:16,color:T.accent,fontSize:14,fontWeight:500}}>Profile saved successfully!</div>}
      {error && <div style={{background:T.dangerLight,border:`1px solid ${T.danger}`,borderRadius:8,padding:"10px 16px",marginBottom:16,color:T.danger,fontSize:14}}>{error}</div>}

      <div style={s.card}>
        <p style={{fontWeight:700,fontSize:14,marginBottom:16}}>Basic Information</p>
        <Field label="Hospital Name *">
          <input style={s.inp} placeholder="e.g. Apollo Hospitals" value={form.name} onChange={e=>set("name",e.target.value)}/>
        </Field>
        <div style={s.g2}>
          <Field label="Phone">
            <input style={s.inp} placeholder="+91 80 1234 5678" value={form.phone} onChange={e=>set("phone",e.target.value)}/>
          </Field>
          <Field label="Emergency Support">
            <select style={s.inp} value={form.emergencySupport} onChange={e=>set("emergencySupport",e.target.value==="true")}>
              <option value="true">Yes — we have ER</option>
              <option value="false">No ER</option>
            </select>
          </Field>
        </div>
        <Field label="Address">
          <textarea style={{...s.inp,height:80,resize:"vertical"}} placeholder="Full hospital address" value={form.address} onChange={e=>set("address",e.target.value)}/>
        </Field>
      </div>

      <div style={s.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <p style={{fontWeight:700,fontSize:14,margin:0}}>Location Coordinates *</p>
          <button onClick={detectLocation} style={{...s.btn("success"),padding:"6px 14px",fontSize:13}}>Auto Detect Location</button>
        </div>
        <p style={{color:T.textMuted,fontSize:13,marginBottom:16}}>
          Used for distance calculation and SOS routing. Click Auto Detect or enter manually from Google Maps.
        </p>
        <div style={s.g2}>
          <Field label="Latitude *">
            <input style={s.inp} placeholder="e.g. 12.9716" value={form.latitude} onChange={e=>set("latitude",e.target.value)}/>
          </Field>
          <Field label="Longitude *">
            <input style={s.inp} placeholder="e.g. 77.5946" value={form.longitude} onChange={e=>set("longitude",e.target.value)}/>
          </Field>
        </div>
        {form.latitude && form.longitude && (
          <div style={{background:T.primaryLight,borderRadius:8,padding:"10px 14px",fontSize:13,color:T.primary}}>
            Location set: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
          </div>
        )}
      </div>

      <button onClick={save} disabled={loading} style={{...s.btn("primary"),padding:"12px 24px",fontSize:15}}>
        {loading ? "Saving…" : "Save Hospital Profile"}
      </button>
    </div>
  );
}
// ── Hospital Dashboard ─────────────────────────────────────────
// Backend: GET /api/hospital/profile  PATCH /api/hospital/resources
// Model: { name, resources: { totalBeds, availableBeds, icuBeds, icuAvailable, ventilators } }
function HospitalDashboard({ token, userName }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [res, setRes] = useState({ totalBeds:0, availableBeds:0, icuBeds:0, icuAvailable:0, ventilators:0 });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/hospital/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.hospital) {
          setProfile(d.hospital);
          setRes(d.hospital.resources || res);
        }
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [token]);

  const saveResources = async () => {
    try {
      await fetch(`${API_BASE}/hospital/resources`, {
        method: "PATCH",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ resources: res }),
      });
      setEditing(false);
      setSaved(true);
      setTimeout(()=>setSaved(false),3000);
    } catch(e){ console.error(e); }
  };

  if (loading) return <Spinner/>;

  const occ = profile?.resources?.totalBeds > 0
    ? Math.round(((profile.resources.totalBeds - profile.resources.availableBeds) / profile.resources.totalBeds) * 100)
    : 0;

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800}}>{profile?.name || userName}</h2>
        <p style={{margin:0,color:T.textMuted,fontSize:14}}>{profile?.address || "Hospital Admin Panel"}</p>
      </div>

      {saved && <div style={{background:T.accentLight,border:`1px solid ${T.accent}`,borderRadius:8,padding:"10px 16px",marginBottom:16,color:T.accent,fontSize:14,fontWeight:500}}>Resources updated!</div>}

      <div style={{...s.g4,marginBottom:24}}>
        {[
          {label:"Total Beds",     val:profile?.resources?.totalBeds     ?? 0},
          {label:"Available Beds", val:profile?.resources?.availableBeds ?? 0, color:T.accent},
          {label:"ICU Available",  val:profile?.resources?.icuAvailable  ?? 0, color:T.primary},
          {label:"Ventilators",    val:profile?.resources?.ventilators   ?? 0},
        ].map(st=>(
          <div key={st.label} style={{...s.stat,borderTop:`3px solid ${st.color||T.primary}`}}>
            <p style={{margin:"0 0 4px",fontSize:12,color:T.textMuted}}>{st.label}</p>
            <p style={{margin:0,fontSize:26,fontWeight:800,color:st.color||T.text}}>{st.val}</p>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <p style={{...s.sTitle,marginBottom:0}}>Update Resources</p>
          <button onClick={()=>setEditing(!editing)} style={s.btn(editing?"ghost":"primary")}>{editing?"Cancel":"Edit Resources"}</button>
        </div>

        {editing ? (
          <div>
            <div style={s.g2}>
              {[
                ["Total Beds","totalBeds"],
                ["Available Beds","availableBeds"],
                ["ICU Beds","icuBeds"],
                ["ICU Available","icuAvailable"],
                ["Ventilators","ventilators"],
              ].map(([label,key])=>(
                <Field key={key} label={label}>
                  <input type="number" style={s.inp} value={res[key]} onChange={e=>setRes(r=>({...r,[key]:parseInt(e.target.value)||0}))}/>
                </Field>
              ))}
            </div>
            <button onClick={saveResources} style={s.btn("primary")}>Save Resources</button>
          </div>
        ) : (
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
              <span style={{fontWeight:500}}>Bed Occupancy</span>
              <span style={{color:T.textMuted}}>{occ}%</span>
            </div>
            <div style={{height:10,background:T.bg,borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${occ}%`,background:occ>85?T.danger:occ>65?T.warning:T.accent,borderRadius:99,transition:"width 0.5s"}}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panic Dashboard (Hospital view) ───────────────────────────
// Backend: GET /api/hospital/panic/active
// PATCH /api/hospital/panic/:id/acknowledge
// PATCH /api/hospital/panic/:id/resolve
// Returns: { panics: [{ patient: { user: { name, phone } }, location, reason, status, createdAt }] }
function PanicDashboard({ token }) {
  const [panics, setPanics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/hospital/panic/active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setPanics(d.panics || []))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [token]);

  const acknowledge = async (id) => {
    try {
      await fetch(`${API_BASE}/hospital/panic/${id}/acknowledge`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPanics(p => p.map(x => x._id===id ? {...x,status:"acknowledged"} : x));
    } catch(e){ console.error(e); }
  };

  const resolve = async (id) => {
    try {
      await fetch(`${API_BASE}/hospital/panic/${id}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPanics(p => p.filter(x => x._id!==id));
    } catch(e){ console.error(e); }
  };

  const active = panics.filter(p=>p.status==="active").length;

  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
        <HeartIcon size={24} color={T.danger}/>
        <h2 style={{margin:0,fontSize:22,fontWeight:800,color:T.danger}}>Incoming Panic Alerts</h2>
        {active > 0 && <span style={{...s.badge("red"),marginLeft:8}}>{active} Active</span>}
      </div>

      <div style={{...s.g3,marginBottom:24}}>
        {[
          {label:"Active",   val:panics.filter(p=>p.status==="active").length,       danger:true},
          {label:"Acknowledged", val:panics.filter(p=>p.status==="acknowledged").length},
          {label:"Total",    val:panics.length},
        ].map(st=>(
          <div key={st.label} style={{...s.stat,borderLeft:`4px solid ${st.danger?T.danger:T.primary}`}}>
            <p style={{margin:"0 0 4px",fontSize:12,color:T.textMuted}}>{st.label}</p>
            <p style={{margin:0,fontSize:26,fontWeight:800,color:st.danger?T.danger:T.text}}>{st.val}</p>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <p style={s.sTitle}>Patient Alerts</p>
        {loading ? <Spinner/> : panics.length===0 ? (
          <p style={{color:T.textMuted,fontSize:14}}>No active panic alerts.</p>
        ) : panics.map((p,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",borderBottom:i<panics.length-1?`1px solid ${T.border}`:"none"}}>
            <div style={{width:12,height:12,borderRadius:"50%",flexShrink:0,background:p.status==="active"?T.danger:T.accent}}/>
            <div style={{flex:1}}>
              <p style={{margin:"0 0 2px",fontWeight:600,fontSize:15}}>{p.patient?.user?.name || "Patient"}</p>
              <p style={{margin:"0 0 2px",fontSize:13,color:T.textMuted}}>
                {p.location?.address || `${p.location?.latitude}, ${p.location?.longitude}`}
              </p>
              <p style={{margin:0,fontSize:12,color:T.textMuted}}>Reason: {p.reason}</p>
            </div>
            <div style={{textAlign:"right",marginRight:12}}>
              <p style={{margin:"0 0 4px",fontSize:12,color:T.textMuted}}>
                {new Date(p.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
              </p>
              <span style={s.badge(p.status==="active"?"red":"blue")}>{p.status}</span>
            </div>
            <div style={{display:"flex",gap:6}}>
              {p.status==="active" && (
                <button onClick={()=>acknowledge(p._id)} style={{...s.btn("primary"),padding:"6px 12px",fontSize:12}}>Acknowledge</button>
              )}
              {p.status==="acknowledged" && (
                <button onClick={()=>resolve(p._id)} style={{...s.btn("success"),padding:"6px 12px",fontSize:12}}>Resolve</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null);
  const [page, setPage] = useState("home");

  if (!auth) return <AuthPage onLogin={a=>{ setAuth(a); setPage("home"); }}/>;

  const navMap = {
    patient: [
      {id:"home",      label:"Home"},
      {id:"resources", label:"Hospital Resources"},
      {id:"panic",     label:"SOS Emergency"},
      {id:"profile",   label:"My Profile"},
      {id:"book",      label:"Book Appointment"},
    ],
    doctor: [
  {id:"home",  label:"Dashboard"},
  {id:"setup", label:"My Profile"},
],
    hospital: [
  {id:"home",  label:"Overview"},
  {id:"setup", label:"Hospital Setup"},
  {id:"panic", label:"Panic Alerts"},
],
    admin: [
      {id:"home", label:"Dashboard"},
    ],
  };

  const navItems = navMap[auth.role] || navMap.patient;

  const renderPage = () => {
    if (auth.role === "patient") {
      if (page==="home")      return <PatientHome      onNavigate={setPage} token={auth.token} userName={auth.name}/>;
      if (page==="resources") return <HospitalResources token={auth.token}/>;
      if (page==="panic")     return <PanicScreen       token={auth.token}/>;
      if (page==="profile")   return <PatientProfile    token={auth.token}/>;
      if (page==="book")      return <BookAppointment   token={auth.token} onBack={()=>setPage("home")}/>;
    }
    if (auth.role === "doctor") {
  if (page==="setup") return <DoctorSetup token={auth.token} onSaved={()=>setPage("home")}/>;
  return <DoctorDashboard token={auth.token} userName={auth.name}/>;
}
    if (auth.role === "hospital") {
  if (page==="panic") return <PanicDashboard    token={auth.token}/>;
  if (page==="setup") return <HospitalSetup     token={auth.token} onSaved={()=>setPage("home")}/>;
  return                      <HospitalDashboard token={auth.token} userName={auth.name}/>;
}
    return <PatientHome onNavigate={setPage} token={auth.token} userName={auth.name}/>;
  };

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet"/>
      <nav style={s.nav}>
        <div style={s.logo} onClick={()=>setPage("home")}><HeartIcon size={22}/> HealthBridge</div>
        <div style={{display:"flex",gap:4}}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:14,cursor:"pointer",background:page===n.id?T.primaryLight:"transparent",color:page===n.id?T.primary:T.textMuted,fontWeight:page===n.id?700:400}}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Avatar name={auth.name} size={32}/>
          <span style={{fontSize:14,fontWeight:500,color:T.text}}>{auth.name}</span>
          <button onClick={()=>{setAuth(null);setPage("home");}} style={{...s.btn("ghost"),padding:"6px 12px",fontSize:13,border:`1px solid ${T.border}`}}>Logout</button>
        </div>
      </nav>
      {renderPage()}
    </div>
  );
}
