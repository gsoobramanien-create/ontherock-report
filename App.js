import { useState, useEffect, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const MOODS = ["😄","😊","😐","😢","😴"];
const MOOD_LABELS = ["Great!","Happy","Okay","Upset","Tired"];
const MEALS = ["Breakfast","Snack","Lunch"];
const MEAL_OPTIONS = ["All eaten 🌟","Most eaten","Half eaten","Little eaten","Not eaten"];
const NAP_OPTIONS = ["Slept well","Short nap","Restless","No nap"];
const ACTIVITY_LIST = [
  "Painting 🎨","Singing 🎵","Story time 📚","Playground 🛝",
  "Building blocks 🧱","Dancing 💃","Sensory play 🌈","Water play 💧",
];
const DIAPER_OPTIONS = ["1 time","2 times","3 times","4+ times"];
const CHILD_AVATARS = ["🧒","👦","👧","🐣","🌟","🦁","🐸","🦊","🐧","🐨","🌈","🍓"];

const blankReport = (childName = "", teacherName = "") => ({
  childName,
  date: new Date().toISOString().split("T")[0],
  teacherName,
  mood: 1,
  meals: { Breakfast: "", Snack: "", Lunch: "" },
  nap: "",
  napStart: "",
  napEnd: "",
  diaperChanges: "",
  activities: [],
  milestone: "",
  note: "",
  healthNote: "",
});

const today = () => new Date().toISOString().split("T")[0];

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};

// ─── Storage helpers (localStorage) ──────────────────────────────────────────
const STORAGE_KEYS = { roster: "otr_roster", reports: "otr_reports", teacher: "otr_teacher" };

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // view: "home" | "roster" | "report" | "preview" | "history"
  const [view, setView] = useState("home");
  const [roster, setRoster] = useState(() => load(STORAGE_KEYS.roster, []));
  const [reports, setReports] = useState(() => load(STORAGE_KEYS.reports, {}));
  const [teacherName, setTeacherName] = useState(() => load(STORAGE_KEYS.teacher, ""));
  const [activeChild, setActiveChild] = useState(null); // child object
  const [reportStep, setReportStep] = useState(0); // 0-2
  const [draft, setDraft] = useState(null);
  const [historyChild, setHistoryChild] = useState(null);

  // Roster editor
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("🧒");
  const [editingTeacher, setEditingTeacher] = useState(false);
  const [tempTeacher, setTempTeacher] = useState("");

  useEffect(() => { save(STORAGE_KEYS.roster, roster); }, [roster]);
  useEffect(() => { save(STORAGE_KEYS.reports, reports); }, [reports]);
  useEffect(() => { save(STORAGE_KEYS.teacher, teacherName); }, [teacherName]);

  // ── Roster helpers ──────────────────────────────────────────────────────────
  const addChild = () => {
    if (!newName.trim()) return;
    const child = { id: Date.now().toString(), name: newName.trim(), avatar: newAvatar };
    setRoster(r => [...r, child]);
    setNewName("");
    setNewAvatar("🧒");
  };
  const removeChild = (id) => setRoster(r => r.filter(c => c.id !== id));

  // ── Report key by child + date ──────────────────────────────────────────────
  const reportKey = (childId, date) => `${childId}__${date}`;

  const hasReport = (childId, date = today()) => !!reports[reportKey(childId, date)];

  const startReport = (child) => {
    const key = reportKey(child.id, today());
    const existing = reports[key];
    setDraft(existing || blankReport(child.name, teacherName));
    setActiveChild(child);
    setReportStep(0);
    setView("report");
  };

  const saveReport = () => {
    const key = reportKey(activeChild.id, draft.date);
    setReports(prev => ({ ...prev, [key]: { ...draft, childId: activeChild.id } }));
    setView("preview");
  };

  const openHistory = (child) => {
    setHistoryChild(child);
    setView("history");
  };

  // ── Draft helpers ───────────────────────────────────────────────────────────
  const setD = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));
  const setMeal = (meal, val) => setDraft(prev => ({ ...prev, meals: { ...prev.meals, [meal]: val } }));
  const toggleActivity = (a) => setDraft(prev => ({
    ...prev,
    activities: prev.activities.includes(a)
      ? prev.activities.filter(x => x !== a)
      : [...prev.activities, a],
  }));

  // ── WhatsApp send ──────────────────────────────────────────────────────────
  const sendWhatsApp = (type, d = draft) => {
    const mood = MOOD_LABELS[d.mood];
    const meals = Object.entries(d.meals).map(([m,v]) => `${m}: ${v||"—"}`).join(" | ");
    const nap = d.nap ? `${d.nap}${d.napStart ? ` (${d.napStart}–${d.napEnd})` : ""}` : "—";
    const activities = d.activities.length ? d.activities.join(", ") : "—";
    const text =
      `🪨 *On The Rock – Daily Report*\n` +
      `👶 *${d.childName}*  |  📅 ${formatDate(d.date)}\n\n` +
      `😊 *Mood:* ${mood}\n` +
      `🍽️ *Meals:* ${meals}\n` +
      `💤 *Nap:* ${nap}\n` +
      `🧷 *Diapers:* ${d.diaperChanges || "—"}\n` +
      `🎨 *Activities:* ${activities}\n` +
      (d.milestone ? `⭐ *Milestone:* ${d.milestone}\n` : "") +
      (d.note ? `📝 *Note:* ${d.note}\n` : "") +
      (d.healthNote ? `🏥 *Health:* ${d.healthNote}\n` : "") +
      `\n👩‍🏫 ${d.teacherName || "Teacher"} 💛`;
    if (type === "image") {
      alert("📸 Screenshot this preview screen, then share the photo on WhatsApp.\n\nOpening WhatsApp with text summary as backup.");
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ── Stats for home dashboard ────────────────────────────────────────────────
  const todayDone = roster.filter(c => hasReport(c.id, today())).length;

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── HOME ────────────────────────────────────────────────────────────────────
  if (view === "home") return (
    <div style={S.app}>
      <div style={S.homeHeader}>
        <div style={S.homeLogo}>🪨</div>
        <h1 style={S.homeTitle}>On The Rock</h1>
        <p style={S.homeSub}>Daily Report Card</p>
        {/* Teacher name */}
        <div style={S.teacherBar}>
          {editingTeacher ? (
            <div style={S.teacherEdit}>
              <input style={S.teacherInput} value={tempTeacher}
                onChange={e => setTempTeacher(e.target.value)}
                placeholder="Enter teacher name" autoFocus />
              <button style={S.teacherSave} onClick={() => {
                setTeacherName(tempTeacher); setEditingTeacher(false);
              }}>✓</button>
            </div>
          ) : (
            <button style={S.teacherBtn} onClick={() => {
              setTempTeacher(teacherName); setEditingTeacher(true);
            }}>
              👩‍🏫 {teacherName || "Set teacher name"} ✏️
            </button>
          )}
        </div>
      </div>

      {/* Daily progress */}
      <div style={S.progressCard}>
        <div style={S.progressTop}>
          <span style={S.progressLabel}>Today's Progress</span>
          <span style={S.progressCount}>{todayDone}/{roster.length}</span>
        </div>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: roster.length ? `${(todayDone/roster.length)*100}%` : "0%" }} />
        </div>
        <div style={S.progressSub}>{formatDate(today())}</div>
      </div>

      {/* Children list */}
      <div style={S.sectionHeader}>
        <span style={S.sectionLabel}>👶 Class Roster ({roster.length})</span>
        <button style={S.rosterBtn} onClick={() => setView("roster")}>Manage</button>
      </div>

      {roster.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 48 }}>👶</div>
          <p style={S.emptyText}>No children yet.<br/>Add your class roster to get started!</p>
          <button style={S.addFirstBtn} onClick={() => setView("roster")}>+ Add Children</button>
        </div>
      ) : (
        <div style={S.childList}>
          {roster.map(child => {
            const done = hasReport(child.id, today());
            return (
              <div key={child.id} style={{ ...S.childCard, ...(done ? S.childCardDone : {}) }}>
                <div style={S.childAvatar}>{child.avatar}</div>
                <div style={S.childInfo}>
                  <div style={S.childName}>{child.name}</div>
                  <div style={S.childStatus}>
                    {done ? "✅ Report done today" : "⏳ Report pending"}
                  </div>
                </div>
                <div style={S.childActions}>
                  <button style={{ ...S.actionBtn, ...(done ? S.actionBtnEdit : S.actionBtnNew) }}
                    onClick={() => startReport(child)}>
                    {done ? "✏️ Edit" : "📝 Fill"}
                  </button>
                  {done && (
                    <button style={S.actionBtnSend} onClick={() => {
                      const key = reportKey(child.id, today());
                      const r = reports[key];
                      if (r) { setDraft(r); setActiveChild(child); setView("preview"); }
                    }}>📤</button>
                  )}
                  <button style={S.actionBtnHistory} onClick={() => openHistory(child)}>📋</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── ROSTER MANAGER ──────────────────────────────────────────────────────────
  if (view === "roster") return (
    <div style={S.app}>
      <div style={S.screenHeader}>
        <button style={S.backBtn} onClick={() => setView("home")}>← Back</button>
        <h2 style={S.screenTitle}>👶 Class Roster</h2>
        <span style={S.stepBadge}>{roster.length} children</span>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Add New Child</div>
        <div style={S.avatarPicker}>
          {CHILD_AVATARS.map(a => (
            <button key={a} style={{ ...S.avatarBtn, ...(newAvatar === a ? S.avatarBtnActive : {}) }}
              onClick={() => setNewAvatar(a)}>{a}</button>
          ))}
        </div>
        <input style={S.input} placeholder="Child's full name"
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addChild()} />
        <button style={S.addBtn} onClick={addChild}>+ Add to Roster</button>
      </div>

      {roster.length > 0 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Current Roster</div>
          {roster.map(child => (
            <div key={child.id} style={S.rosterRow}>
              <span style={S.rosterAvatar}>{child.avatar}</span>
              <span style={S.rosterName}>{child.name}</span>
              <button style={S.removeBtn} onClick={() => removeChild(child.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── REPORT FORM (3 steps) ───────────────────────────────────────────────────
  if (view === "report" && draft) {
    const child = activeChild;
    const steps = [
      // Step 0: Mood & basic
      <div key="step0" style={S.screen}>
        <div style={S.screenHeader}>
          <button style={S.backBtn} onClick={() => setView("home")}>← Home</button>
          <h2 style={S.screenTitle}>{child.avatar} {child.name}</h2>
          <span style={S.stepBadge}>1 of 3</span>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>📅 Date</div>
          <input style={S.input} type="date" value={draft.date}
            onChange={e => setD("date", e.target.value)} />
          <div style={{ ...S.sectionTitle, marginTop: 14 }}>👩‍🏫 Teacher</div>
          <input style={S.input} placeholder="Teacher's name" value={draft.teacherName}
            onChange={e => setD("teacherName", e.target.value)} />
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>😊 How was {child.name.split(" ")[0]}'s mood? {MOODS[draft.mood]}</div>
          <div style={S.moodRow}>
            {MOODS.map((m, i) => (
              <button key={i} onClick={() => setD("mood", i)}
                style={{ ...S.moodBtn, ...(draft.mood === i ? S.moodBtnActive : {}) }}>
                <span style={S.moodEmoji}>{m}</span>
                <span style={S.moodLabel}>{MOOD_LABELS[i]}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={S.footer}>
          <button style={S.nextBtn} onClick={() => setReportStep(1)}>Next: Meals & Nap →</button>
        </div>
      </div>,

      // Step 1: Meals, nap, diapers
      <div key="step1" style={S.screen}>
        <div style={S.screenHeader}>
          <button style={S.backBtn} onClick={() => setReportStep(0)}>← Back</button>
          <h2 style={S.screenTitle}>🍽️ Meals & Rest</h2>
          <span style={S.stepBadge}>2 of 3</span>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>🥣 Meal Intake</div>
          {MEALS.map(meal => (
            <div key={meal} style={S.mealRow}>
              <span style={S.mealLabel}>{meal}</span>
              <div style={S.mealOptions}>
                {MEAL_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setMeal(meal, opt)}
                    style={{ ...S.chipBtn, ...(draft.meals[meal] === opt ? S.chipActive : {}) }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>💤 Nap Time</div>
          <div style={S.chipRow}>
            {NAP_OPTIONS.map(o => (
              <button key={o} onClick={() => setD("nap", o)}
                style={{ ...S.chipBtn, ...(draft.nap === o ? S.chipActive : {}) }}>{o}</button>
            ))}
          </div>
          <div style={S.timeRow}>
            <div style={S.timeField}>
              <label style={S.label}>Nap Start</label>
              <input style={S.input} type="time" value={draft.napStart}
                onChange={e => setD("napStart", e.target.value)} />
            </div>
            <div style={S.timeField}>
              <label style={S.label}>Nap End</label>
              <input style={S.input} type="time" value={draft.napEnd}
                onChange={e => setD("napEnd", e.target.value)} />
            </div>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>🧷 Diaper Changes</div>
          <div style={S.chipRow}>
            {DIAPER_OPTIONS.map(o => (
              <button key={o} onClick={() => setD("diaperChanges", o)}
                style={{ ...S.chipBtn, ...(draft.diaperChanges === o ? S.chipActive : {}) }}>{o}</button>
            ))}
          </div>
        </div>
        <div style={S.footer}>
          <button style={S.nextBtn} onClick={() => setReportStep(2)}>Next: Activities & Notes →</button>
        </div>
      </div>,

      // Step 2: Activities & notes
      <div key="step2" style={S.screen}>
        <div style={S.screenHeader}>
          <button style={S.backBtn} onClick={() => setReportStep(1)}>← Back</button>
          <h2 style={S.screenTitle}>🎨 Activities & Notes</h2>
          <span style={S.stepBadge}>3 of 3</span>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>🎯 Today's Activities</div>
          <div style={S.activityGrid}>
            {ACTIVITY_LIST.map(a => (
              <button key={a} onClick={() => toggleActivity(a)}
                style={{ ...S.activityBtn, ...(draft.activities.includes(a) ? S.activityActive : {}) }}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>⭐ Milestone / Fun Moment</div>
          <input style={S.input} placeholder="e.g. Said first full sentence!"
            value={draft.milestone} onChange={e => setD("milestone", e.target.value)} />
          <div style={{ ...S.sectionTitle, marginTop: 14 }}>📝 Teacher's Note</div>
          <textarea style={S.textarea} placeholder="Personal note to parents..."
            value={draft.note} onChange={e => setD("note", e.target.value)} rows={3} />
          <div style={{ ...S.sectionTitle, marginTop: 14 }}>🏥 Health Note (optional)</div>
          <textarea style={S.textarea} placeholder="Medications, observations..."
            value={draft.healthNote} onChange={e => setD("healthNote", e.target.value)} rows={2} />
        </div>
        <div style={S.footer}>
          <button style={{ ...S.nextBtn, background: "linear-gradient(135deg,#f7971e,#ffd200)" }}
            onClick={saveReport}>💾 Save & Preview →</button>
        </div>
      </div>,
    ];
    return (
      <div style={S.app}>
        <div style={S.progressDots}>
          {[0,1,2].map(i => (
            <div key={i} style={{ ...S.dot, ...(reportStep === i ? S.dotActive : reportStep > i ? S.dotDone : {}) }} />
          ))}
        </div>
        {steps[reportStep]}
      </div>
    );
  }

  // ── PREVIEW & SEND ──────────────────────────────────────────────────────────
  if (view === "preview" && draft) {
    const d = draft;
    return (
      <div style={S.app}>
        <div style={S.screenHeader}>
          <button style={S.backBtn} onClick={() => setView("home")}>← Home</button>
          <h2 style={S.screenTitle}>📋 Report Preview</h2>
          <button style={S.backBtn} onClick={() => { setReportStep(2); setView("report"); }}>Edit ✏️</button>
        </div>

        <div style={S.reportCard}>
          <div style={S.reportHeader}>
            <div style={S.reportEmoji}>
              {activeChild?.avatar || "🧒"}
            </div>
            <div>
              <div style={S.reportName}>{d.childName}</div>
              <div style={S.reportDate}>{formatDate(d.date)}</div>
              <div style={S.reportTeacher}>👩‍🏫 {d.teacherName || "Teacher"}</div>
            </div>
          </div>
          <div style={S.reportDivider} />
          <div style={S.reportRow}>
            <div style={S.reportBlock}>
              <div style={S.reportBlockTitle}>Mood</div>
              <div style={S.reportBig}>{MOODS[d.mood]} {MOOD_LABELS[d.mood]}</div>
            </div>
            <div style={S.reportBlock}>
              <div style={S.reportBlockTitle}>Diapers</div>
              <div style={S.reportBig}>{d.diaperChanges || "—"}</div>
            </div>
          </div>
          <div style={S.reportSection}>
            <div style={S.reportSectionTitle}>🍽️ Meals</div>
            <div style={S.reportMealGrid}>
              {MEALS.map(m => (
                <div key={m} style={S.reportMealItem}>
                  <span style={S.reportMealName}>{m}</span>
                  <span style={S.reportMealVal}>{d.meals[m] || "—"}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={S.reportSection}>
            <div style={S.reportSectionTitle}>💤 Nap</div>
            <span style={S.reportPill}>{d.nap || "—"}</span>
            {d.napStart && <span style={S.reportPill}>{d.napStart} – {d.napEnd}</span>}
          </div>
          {d.activities.length > 0 && (
            <div style={S.reportSection}>
              <div style={S.reportSectionTitle}>🎨 Activities</div>
              <div style={S.reportActivities}>
                {d.activities.map(a => <span key={a} style={S.reportActivityTag}>{a}</span>)}
              </div>
            </div>
          )}
          {d.milestone && (
            <div style={S.reportMilestone}>
              <span style={{ fontSize: 18 }}>⭐</span>
              <span style={S.reportMilestoneText}>{d.milestone}</span>
            </div>
          )}
          {d.note && (
            <div style={S.reportNote}>
              <div style={S.reportSectionTitle}>📝 Teacher's Note</div>
              <p style={S.reportNoteText}>{d.note}</p>
            </div>
          )}
          {d.healthNote && (
            <div style={{ ...S.reportNote, borderLeftColor: "#ff8c69" }}>
              <div style={S.reportSectionTitle}>🏥 Health Note</div>
              <p style={S.reportNoteText}>{d.healthNote}</p>
            </div>
          )}
          <div style={S.reportFooter}>On The Rock Kindergarten 🪨 Made with love</div>
        </div>

        {/* SEND BUTTONS */}
        <div style={S.sendSection}>
          <div style={S.sendTitle}>📤 Share with Parents</div>
          <button style={S.whatsappImgBtn} onClick={() => sendWhatsApp("image", d)}>
            <span style={S.btnIcon}>📸</span>
            <div>
              <div style={S.btnLabel}>Send as Image via WhatsApp</div>
              <div style={S.btnSub}>Screenshot & share as photo</div>
            </div>
          </button>
          <button style={S.whatsappPdfBtn} onClick={() => sendWhatsApp("pdf", d)}>
            <span style={S.btnIcon}>📄</span>
            <div>
              <div style={S.btnLabel}>Send as Text via WhatsApp</div>
              <div style={S.btnSub}>Pre-formatted report message</div>
            </div>
          </button>
          <button style={S.newReportBtn} onClick={() => setView("home")}>
            🏠 Back to Class Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── HISTORY ─────────────────────────────────────────────────────────────────
  if (view === "history" && historyChild) {
    const childReports = Object.entries(reports)
      .filter(([key]) => key.startsWith(historyChild.id + "__"))
      .map(([key, val]) => ({ key, date: key.split("__")[1], ...val }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div style={S.app}>
        <div style={S.screenHeader}>
          <button style={S.backBtn} onClick={() => setView("home")}>← Home</button>
          <h2 style={S.screenTitle}>{historyChild.avatar} {historyChild.name}</h2>
          <span style={S.stepBadge}>{childReports.length} reports</span>
        </div>

        {childReports.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 48 }}>📋</div>
            <p style={S.emptyText}>No reports saved yet for {historyChild.name.split(" ")[0]}.</p>
          </div>
        ) : (
          <div style={S.historyList}>
            {childReports.map(r => (
              <div key={r.key} style={S.historyCard}>
                <div style={S.historyTop}>
                  <div>
                    <div style={S.historyDate}>{formatDate(r.date)}</div>
                    <div style={S.historyMood}>{MOODS[r.mood]} {MOOD_LABELS[r.mood]}</div>
                  </div>
                  <div style={S.historyActions}>
                    <button style={S.histViewBtn} onClick={() => {
                      setDraft(r); setActiveChild(historyChild); setView("preview");
                    }}>View 👁</button>
                    <button style={S.hisSendBtn} onClick={() => sendWhatsApp("pdf", r)}>
                      📤
                    </button>
                  </div>
                </div>
                <div style={S.historyDetails}>
                  {MEALS.map(m => r.meals[m] && (
                    <span key={m} style={S.historyTag}>{m}: {r.meals[m]}</span>
                  ))}
                  {r.nap && <span style={S.historyTag}>💤 {r.nap}</span>}
                </div>
                {r.milestone && <div style={S.historyMilestone}>⭐ {r.milestone}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "'Nunito', 'Quicksand', 'Poppins', sans-serif",
    background: "linear-gradient(160deg,#fff9f0 0%,#fef0f5 50%,#f0f7ff 100%)",
    minHeight: "100vh",
    maxWidth: 480,
    margin: "0 auto",
    paddingBottom: 32,
  },
  // Home header
  homeHeader: {
    background: "linear-gradient(135deg,#f7971e 0%,#ffd200 60%,#ff6fa8 100%)",
    padding: "36px 24px 28px",
    textAlign: "center",
    borderRadius: "0 0 32px 32px",
    marginBottom: 16,
    boxShadow: "0 8px 32px rgba(247,151,30,0.25)",
  },
  homeLogo: { fontSize: 52, marginBottom: 4 },
  homeTitle: { margin: 0, fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" },
  homeSub: { margin: "4px 0 12px", fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600 },
  teacherBar: { marginTop: 8 },
  teacherBtn: {
    background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.5)",
    borderRadius: 20, padding: "6px 16px", color: "#fff",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  teacherEdit: { display: "flex", gap: 8, justifyContent: "center" },
  teacherInput: {
    border: "none", borderRadius: 12, padding: "6px 12px", fontSize: 14,
    fontFamily: "inherit", outline: "none", width: 180,
  },
  teacherSave: {
    background: "#fff", border: "none", borderRadius: 12,
    padding: "6px 14px", fontWeight: 800, color: "#f7971e", cursor: "pointer",
  },
  // Progress card
  progressCard: {
    background: "#fff", borderRadius: 18, margin: "0 16px 14px",
    padding: "16px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
  },
  progressTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: 800, color: "#888" },
  progressCount: { fontSize: 22, fontWeight: 900, color: "#f7971e" },
  progressTrack: { background: "#f0f0f0", borderRadius: 8, height: 10, overflow: "hidden" },
  progressFill: {
    height: "100%", background: "linear-gradient(90deg,#f7971e,#a8e6cf)",
    borderRadius: 8, transition: "width 0.4s ease",
  },
  progressSub: { fontSize: 12, color: "#bbb", marginTop: 6 },
  // Section header
  sectionHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 16px 8px",
  },
  sectionLabel: { fontSize: 14, fontWeight: 800, color: "#555" },
  rosterBtn: {
    background: "linear-gradient(135deg,#f7971e,#ffd200)",
    border: "none", borderRadius: 12, padding: "5px 14px",
    fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer",
  },
  // Child cards
  childList: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 },
  childCard: {
    background: "#fff", borderRadius: 18, padding: "14px 16px",
    display: "flex", alignItems: "center", gap: 12,
    boxShadow: "0 3px 16px rgba(0,0,0,0.07)",
    border: "2px solid transparent",
  },
  childCardDone: { border: "2px solid #a8e6cf", background: "#f9fffe" },
  childAvatar: { fontSize: 36, width: 48, textAlign: "center" },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: 800, color: "#2d2d2d" },
  childStatus: { fontSize: 12, color: "#aaa", marginTop: 2 },
  childActions: { display: "flex", gap: 6, alignItems: "center" },
  actionBtn: {
    border: "none", borderRadius: 12, padding: "7px 12px",
    fontSize: 13, fontWeight: 800, cursor: "pointer",
  },
  actionBtnNew: { background: "linear-gradient(135deg,#f7971e,#ff6fa8)", color: "#fff" },
  actionBtnEdit: { background: "linear-gradient(135deg,#a8e6cf,#7ec8a4)", color: "#1a5c40" },
  actionBtnSend: {
    background: "linear-gradient(135deg,#25d366,#128c7e)",
    border: "none", borderRadius: 12, padding: "7px 10px",
    fontSize: 14, cursor: "pointer",
  },
  actionBtnHistory: {
    background: "#f4f4f4", border: "none", borderRadius: 12,
    padding: "7px 10px", fontSize: 14, cursor: "pointer",
  },
  // Empty state
  emptyState: {
    textAlign: "center", padding: "40px 24px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  emptyText: { fontSize: 15, color: "#aaa", lineHeight: 1.6, margin: 0 },
  addFirstBtn: {
    background: "linear-gradient(135deg,#f7971e,#ffd200)",
    border: "none", borderRadius: 18, padding: "14px 28px",
    fontSize: 15, fontWeight: 800, color: "#fff", cursor: "pointer",
    marginTop: 8,
  },
  // Roster manager
  avatarPicker: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  avatarBtn: {
    fontSize: 22, width: 42, height: 42, borderRadius: 12,
    border: "2px solid #f0e8ff", background: "#fafafa", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  avatarBtnActive: {
    border: "2px solid #f7971e", background: "#fff9ee",
    boxShadow: "0 2px 10px rgba(247,151,30,0.3)",
  },
  addBtn: {
    width: "100%", marginTop: 10, background: "linear-gradient(135deg,#f7971e,#ffd200)",
    border: "none", borderRadius: 14, padding: "12px", fontSize: 15,
    fontWeight: 800, color: "#fff", cursor: "pointer",
  },
  rosterRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 0", borderBottom: "1px solid #f5f5f5",
  },
  rosterAvatar: { fontSize: 28 },
  rosterName: { flex: 1, fontSize: 15, fontWeight: 700, color: "#2d2d2d" },
  removeBtn: {
    background: "#fff0f0", border: "none", borderRadius: 10,
    padding: "4px 10px", color: "#e05555", fontWeight: 800,
    cursor: "pointer", fontSize: 13,
  },
  // Screen common
  screen: { display: "flex", flexDirection: "column", minHeight: "calc(100vh - 34px)" },
  screenHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px 8px",
  },
  backBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#f7971e", fontWeight: 700, fontSize: 14, padding: 0,
  },
  screenTitle: { margin: 0, fontSize: 17, fontWeight: 800, color: "#2d2d2d" },
  stepBadge: {
    background: "linear-gradient(135deg,#f7971e,#ffd200)",
    color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700,
  },
  progressDots: { display: "flex", justifyContent: "center", gap: 8, padding: "12px 0 0" },
  dot: { width: 10, height: 10, borderRadius: "50%", background: "#ddd", transition: "all 0.3s" },
  dotActive: { background: "#f7971e", transform: "scale(1.3)" },
  dotDone: { background: "#a8e6cf" },
  card: {
    background: "#fff", borderRadius: 20, margin: "8px 16px",
    padding: "18px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
  },
  label: {
    display: "block", fontSize: 12, fontWeight: 700, color: "#888",
    marginBottom: 5, marginTop: 10, textTransform: "uppercase", letterSpacing: 0.5,
  },
  input: {
    width: "100%", boxSizing: "border-box", border: "2px solid #f0e8ff",
    borderRadius: 12, padding: "11px 14px", fontSize: 15,
    fontFamily: "inherit", color: "#2d2d2d", background: "#fafafa", outline: "none",
  },
  textarea: {
    width: "100%", boxSizing: "border-box", border: "2px solid #f0e8ff",
    borderRadius: 12, padding: "11px 14px", fontSize: 15,
    fontFamily: "inherit", color: "#2d2d2d", background: "#fafafa",
    outline: "none", resize: "vertical",
  },
  sectionTitle: { fontSize: 14, fontWeight: 800, color: "#555", marginBottom: 10 },
  moodRow: { display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" },
  moodBtn: {
    flex: 1, minWidth: 52, display: "flex", flexDirection: "column",
    alignItems: "center", padding: "8px 4px", borderRadius: 14,
    border: "2px solid #f0e8ff", background: "#fafafa", cursor: "pointer", transition: "all 0.2s",
  },
  moodBtnActive: {
    border: "2px solid #f7971e", background: "linear-gradient(135deg,#fff9ee,#fff3d0)",
    transform: "scale(1.08)", boxShadow: "0 4px 12px rgba(247,151,30,0.3)",
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 10, fontWeight: 700, color: "#888", marginTop: 2 },
  mealRow: { marginBottom: 12 },
  mealLabel: { fontSize: 13, fontWeight: 700, color: "#999", display: "block", marginBottom: 6 },
  mealOptions: { display: "flex", flexWrap: "wrap", gap: 6 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  chipBtn: {
    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    border: "2px solid #f0e8ff", background: "#fafafa", cursor: "pointer", color: "#666",
  },
  chipActive: {
    background: "linear-gradient(135deg,#a8e6cf,#dcedc1)",
    border: "2px solid #76c893", color: "#2d6a4f",
    boxShadow: "0 2px 8px rgba(118,200,147,0.3)",
  },
  timeRow: { display: "flex", gap: 12, marginTop: 10 },
  timeField: { flex: 1 },
  activityGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  activityBtn: {
    padding: "10px 8px", borderRadius: 14, fontSize: 13, fontWeight: 700,
    border: "2px solid #f0e8ff", background: "#fafafa", cursor: "pointer",
    color: "#555", textAlign: "left",
  },
  activityActive: {
    background: "linear-gradient(135deg,#ffecd2,#fcb69f)",
    border: "2px solid #f7971e", color: "#8b3a00",
    boxShadow: "0 2px 8px rgba(247,151,30,0.25)",
  },
  footer: { marginTop: "auto", padding: "16px 16px 0" },
  nextBtn: {
    background: "linear-gradient(135deg,#f7971e,#ff6fa8)",
    color: "#fff", border: "none", borderRadius: 18,
    padding: "16px 24px", fontSize: 16, fontWeight: 800,
    cursor: "pointer", boxShadow: "0 6px 24px rgba(247,151,30,0.4)",
    width: "100%",
  },
  // Report preview
  reportCard: {
    background: "#fff", borderRadius: 20, margin: "8px 16px",
    padding: "20px 18px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
  },
  reportHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 12 },
  reportEmoji: {
    fontSize: 40, background: "linear-gradient(135deg,#fff0fa,#fff9ee)",
    borderRadius: 16, width: 64, height: 64, display: "flex",
    alignItems: "center", justifyContent: "center", border: "2px solid #ffe0f0",
  },
  reportName: { fontSize: 20, fontWeight: 900, color: "#2d2d2d" },
  reportDate: { fontSize: 12, color: "#aaa", marginTop: 2 },
  reportTeacher: { fontSize: 12, color: "#f7971e", fontWeight: 700, marginTop: 2 },
  reportDivider: {
    height: 2, background: "linear-gradient(90deg,#ffd200,#ff6fa8,#a8e6cf)",
    borderRadius: 2, margin: "12px 0",
  },
  reportRow: { display: "flex", gap: 12, marginBottom: 12 },
  reportBlock: {
    flex: 1, background: "linear-gradient(135deg,#fff9ee,#fff0fa)",
    borderRadius: 14, padding: "12px 14px", border: "1.5px solid #ffe0c0",
  },
  reportBlockTitle: { fontSize: 10, fontWeight: 800, color: "#aaa", textTransform: "uppercase", marginBottom: 4 },
  reportBig: { fontSize: 16, fontWeight: 800, color: "#2d2d2d" },
  reportSection: { marginBottom: 10 },
  reportSectionTitle: { fontSize: 12, fontWeight: 800, color: "#888", marginBottom: 5 },
  reportMealGrid: { display: "flex", gap: 8 },
  reportMealItem: {
    flex: 1, background: "#f8f8f8", borderRadius: 10, padding: "7px 9px",
    display: "flex", flexDirection: "column", gap: 2,
  },
  reportMealName: { fontSize: 9, fontWeight: 800, color: "#bbb", textTransform: "uppercase" },
  reportMealVal: { fontSize: 11, fontWeight: 700, color: "#2d2d2d" },
  reportPill: {
    display: "inline-block", background: "linear-gradient(135deg,#d4f1f9,#c9f0e8)",
    borderRadius: 20, padding: "3px 10px", fontSize: 12,
    fontWeight: 700, color: "#2d7a6a", marginRight: 6,
  },
  reportActivities: { display: "flex", flexWrap: "wrap", gap: 5 },
  reportActivityTag: {
    background: "linear-gradient(135deg,#ffecd2,#fcb69f)",
    borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700, color: "#8b3a00",
  },
  reportMilestone: {
    display: "flex", alignItems: "center", gap: 8,
    background: "linear-gradient(135deg,#fffde7,#fff9c4)",
    borderRadius: 12, padding: "10px 12px", marginBottom: 10,
    border: "1.5px solid #ffd200",
  },
  reportMilestoneText: { fontSize: 13, fontWeight: 700, color: "#7a5800" },
  reportNote: {
    borderLeft: "4px solid #a8e6cf", padding: "7px 11px",
    marginBottom: 8, background: "#f9fffe", borderRadius: "0 10px 10px 0",
  },
  reportNoteText: { margin: 0, fontSize: 13, color: "#444", lineHeight: 1.5 },
  reportFooter: {
    textAlign: "center", fontSize: 11, color: "#ccc",
    marginTop: 10, paddingTop: 10, borderTop: "1px dashed #eee",
  },
  // Send section
  sendSection: { padding: "10px 16px 8px" },
  sendTitle: { fontSize: 15, fontWeight: 800, color: "#2d2d2d", marginBottom: 10, textAlign: "center" },
  whatsappImgBtn: {
    width: "100%", display: "flex", alignItems: "center", gap: 14,
    background: "linear-gradient(135deg,#25d366,#128c7e)",
    border: "none", borderRadius: 18, padding: "14px 18px",
    cursor: "pointer", marginBottom: 10, boxShadow: "0 6px 20px rgba(37,211,102,0.3)",
    textAlign: "left",
  },
  whatsappPdfBtn: {
    width: "100%", display: "flex", alignItems: "center", gap: 14,
    background: "linear-gradient(135deg,#1da1f2,#075e54)",
    border: "none", borderRadius: 18, padding: "14px 18px",
    cursor: "pointer", marginBottom: 10, boxShadow: "0 6px 20px rgba(29,161,242,0.25)",
    textAlign: "left",
  },
  btnIcon: { fontSize: 26 },
  btnLabel: { fontSize: 14, fontWeight: 800, color: "#fff" },
  btnSub: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  newReportBtn: {
    width: "100%", background: "none", border: "2px dashed #f7971e",
    borderRadius: 18, padding: "13px", fontSize: 14, fontWeight: 800,
    color: "#f7971e", cursor: "pointer",
  },
  // History
  historyList: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 },
  historyCard: {
    background: "#fff", borderRadius: 18, padding: "14px 16px",
    boxShadow: "0 3px 16px rgba(0,0,0,0.07)",
  },
  historyTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  historyDate: { fontSize: 14, fontWeight: 800, color: "#2d2d2d" },
  historyMood: { fontSize: 13, color: "#888", marginTop: 2 },
  historyActions: { display: "flex", gap: 6 },
  histViewBtn: {
    background: "linear-gradient(135deg,#f7971e,#ffd200)",
    border: "none", borderRadius: 12, padding: "6px 12px",
    fontSize: 12, fontWeight: 800, color: "#fff", cursor: "pointer",
  },
  hisSendBtn: {
    background: "linear-gradient(135deg,#25d366,#128c7e)",
    border: "none", borderRadius: 12, padding: "6px 10px",
    fontSize: 14, cursor: "pointer",
  },
  historyDetails: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  historyTag: {
    background: "#f4f4f4", borderRadius: 20, padding: "3px 10px",
    fontSize: 11, fontWeight: 700, color: "#666",
  },
  historyMilestone: {
    fontSize: 12, color: "#b8860b", fontWeight: 700,
    background: "#fffde7", borderRadius: 8, padding: "4px 10px", marginTop: 4,
    display: "inline-block",
  },
};
