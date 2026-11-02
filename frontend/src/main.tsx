import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./recording.css";
import { Language, LANGUAGES, translations } from "./i18n";
type Obj = Record<string, any>;
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
let csrf = "";
async function api(path: string, body?: unknown, method?: string) {
  const target = `${API_BASE || ""}/api${path}`;
  const r = await fetch(target, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      "x-csrf-token": csrf,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
  });
  if (!r.ok) {
    let d;
    try {
      d = await r.json();
    } catch {}
    throw Error(
      typeof d?.detail === "string" ? d.detail : `Request failed (${r.status})`,
    );
  }
  return r.status === 204 ? null : r.json();
}
const domains = ["hospital", "transport", "bank"];
const emptyAnnotation = {
  translates: true,
  complete: true,
  variety: "",
  variant: "",
  hands_visible: true,
  face_visible: true,
  framing_issues: "",
  nonmanual_features: "",
  meaning_notes: "",
  segments: [],
  status: "approved",
};
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
function LangSwitcher({
  current,
  onChange,
}: {
  current: Language;
  onChange: (l: Language) => void;
}) {
  return (
    <div className="lang-switcher" role="group" aria-label="Language selection">
      {LANGUAGES.map((l) => (
        <button
          type="button"
          key={l.id}
          className={`lang-btn ${current === l.id ? "active" : ""}`}
          onClick={() => onChange(l.id)}
        >
          {l.nativeName}
        </button>
      ))}
    </div>
  );
}
function App() {
  const [user, setUser] = useState<Obj | null>(null),
    [loading, setLoading] = useState(true),
    [registering, setRegistering] = useState(false),
    [page, setPage] = useState("record"),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [lang, setLang] = useState<Language>(() => {
      const saved = localStorage.getItem("app_lang");
      return saved === "ta" || saved === "si" || saved === "en" ? saved : "en";
    });
  const changeLang = (l: Language) => {
    setLang(l);
    localStorage.setItem("app_lang", l);
  };
  const t = translations[lang];
  useEffect(() => {
    api("/auth/me")
      .then((u) => {
        csrf = u.csrf;
        setUser(u);
        setPage(u.role === "admin" ? "dashboard" : "record");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (loading)
    return (
      <main>
        <p>Loading your workspace…</p>
      </main>
    );
  if (!user)
    return (
      <div className="login">
        <aside>
          <span className="eyebrow">{t.workspace}</span>
          <h1>
            Meaning begins
            <br />
            with people.
          </h1>
          <p>{t.brandDesc}</p>
          <div className="scope">{t.scopeText}</div>
          <h2>{t.howItWorksTitle}</h2>
          <ol>
            <li>{t.step1}</li>
            <li>{t.step2}</li>
            <li>{t.step3}</li>
            <li>{t.step4}</li>
          </ol>
          <p className="small">{t.loginNotice}</p>
        </aside>
        <section>
          <div className="login-lang">
            <LangSwitcher current={lang} onChange={changeLang} />
          </div>
          <span className="brand">SIGN / COLLECT</span>
          <h2>{registering ? t.createTeacherAccount : t.welcomeBack}</h2>
          <p>{registering ? t.registerInstructions : t.loginInstructions}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              run(async () => {
                const credentials = Object.fromEntries(f);
                if (registering) await api("/auth/register", credentials);
                const u = await api("/auth/login", credentials);
                csrf = u.csrf;
                setUser(u);
                setPage(u.role === "admin" ? "dashboard" : "record");
              });
            }}
          >
            <Field label={t.contributorCodeLabel}>
              <input name="code" required autoComplete="username" />
            </Field>
            <Field label={t.passwordLabel}>
              <input
                name="password"
                type="password"
                required
                minLength={registering ? 12 : undefined}
                autoComplete="current-password"
              />
            </Field>
            <button>
              {registering ? t.registerBtn : t.loginBtn}
            </button>
          </form>
          <button
            className="quiet"
            type="button"
            onClick={() => {
              setRegistering(!registering);
              setError("");
            }}
          >
            {registering ? t.alreadyHaveAccount : t.registerAsTeacher}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <p className="small">{t.accessPrivateNotice}</p>
        </section>
      </div>
    );
  const isTeacher = user.role !== "admin";
  return (
    <>
      <header>
        <div>
          <span className="brand">SIGN / COLLECT</span>
          <span className="header-note">
            {isTeacher ? t.headerNote : "Research video workspace"}
          </span>
        </div>
        <div className="identity">
          {isTeacher && (
            <LangSwitcher current={lang} onChange={changeLang} />
          )}
          {user.code} <span className="pill">{user.role}</span>
          <button
            className="quiet"
            onClick={() =>
              run(async () => {
                await api("/auth/logout", {});
                setUser(null);
                csrf = "";
              })
            }
          >
            {isTeacher ? t.logOut : "Log out"}
          </button>
        </div>
      </header>
      <div className="shell">
        <nav aria-label="Workspace">
          <span className="eyebrow">{isTeacher ? t.workspace : "WORKSPACE"}</span>
          {(user.role === "admin"
            ? [
                ["dashboard", "Overview"],
                ["prompts", "Prompts & batches"],
                ["users", "Contributors"],
                ["review", "Dataset & export"],
                ["storage", "Google Drive"],
              ]
            : [
                ["record", t.navRecord],
                ["review", t.navReview],
              ]
          ).map(([id, label]) => (
            <button
              className={page === id ? "active" : ""}
              key={id}
              onClick={() => {
                setError("");
                setMessage("");
                setPage(id);
              }}
            >
              {label}
            </button>
          ))}
          <button
            className={page === "consent" ? "active" : ""}
            onClick={() => setPage("consent")}
          >
            {isTeacher ? t.navConsent : "Consent & withdrawal"}
          </button>
          <div className="nav-foot">
            {isTeacher ? t.humanReviewed : "HUMAN-REVIEWED DATA"}
            <br />
            <span>{isTeacher ? t.noAutomatedSigning : "No automated signing assessment"}</span>
          </div>
        </nav>
        <main>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
          {page === "dashboard" && <Dashboard run={run} notify={setMessage} />}
          {page === "prompts" && <Prompts run={run} notify={setMessage} />}
          {page === "users" && <Users run={run} notify={setMessage} />}
          {page === "consent" && (
            <Consent user={user} run={run} notify={setMessage} t={t} />
          )}
          {page === "record" && (
            <Recorder
              run={run}
              notify={setMessage}
              consentPage={() => setPage("consent")}
              lang={lang}
              t={t}
            />
          )}
          {page === "review" && (
            <Dataset user={user} run={run} notify={setMessage} lang={lang} t={t} />
          )}
          {page === "storage" && <Storage run={run} />}
        </main>
      </div>
    </>
  );
}
function Title({
  tag,
  title,
  description,
}: {
  tag: string;
  title: string;
  description: string;
}) {
  return (
    <div className="title">
      <span className="eyebrow">{tag}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function Pagination({
  total,
  page,
  pageSize = 10,
  onChange,
  itemLabel = "items",
}: {
  total: number;
  page: number;
  pageSize?: number;
  onChange: (newPage: number) => void;
  itemLabel?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  if (total <= pageSize && page === 1) {
    return (
      <div className="pagination-bar">
        <span className="pagination-info">
          Showing {total === 0 ? "0" : `${start}–${end}`} of {total} {itemLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> {itemLabel}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="secondary pagination-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ← Previous
        </button>
        <span className="pagination-page-badge">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="secondary pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function Dashboard({ run, notify }: { run: any; notify?: any }) {
  const [data, setData] = useState<Obj>({});
  const [batchPage, setBatchPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    run(async () => {
      const [p, b, t, u] = await Promise.all([
        api("/prompts"),
        api("/batches"),
        api("/takes"),
        api("/users"),
      ]);
      setData({ p, b, t, u });
    });
  }, []);

  async function downloadQuickZip() {
    setExporting(true);
    try {
      const r = await fetch(`${API_BASE}/api/exports/zip`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          purpose: "research",
          domain: "",
          batch_id: "",
          status: "approved",
          include_rejected: false,
          include_all_uploads: true,
        }),
      });
      if (!r.ok) throw Error((await r.json()).detail || "Export failed");
      const b = await r.blob();
      const link = document.createElement("a");
      const url = URL.createObjectURL(b);
      link.href = url;
      link.download = `sign-dataset-all-videos-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      notify?.("ZIP downloaded successfully. Includes all video recordings and metadata.");
    } finally {
      setExporting(false);
    }
  }

  const batches = data.b || [];
  const pageSize = 10;
  const paginatedBatches = batches.slice((batchPage - 1) * pageSize, batchPage * pageSize);

  return (
    <>
      <Title
        tag="ADMINISTRATOR"
        title="Collection overview"
        description="A clear view of what is assigned, recorded and ready for research."
      />

      {/* Admin Quick Export Bar */}
      <div className="admin-quick-export-bar">
        <div>
          <strong>📦 Video Dataset ZIP Download</strong>
          <p className="small" style={{ margin: "4px 0 0", color: "#365947" }}>
            Export all recorded sign videos with transcripts (Sinhala, Tamil, English) and manifest in one ZIP file.
          </p>
        </div>
        <button
          className="btn-download-zip"
          disabled={exporting}
          onClick={() => run(downloadQuickZip)}
        >
          {exporting ? "Preparing ZIP…" : "⬇️ Download All Videos (ZIP)"}
        </button>
      </div>

      <div className="stats">
        {[
          ["Prompt versions", data.p?.length],
          ["Recording batches", data.b?.length],
          [
            "Uploaded takes",
            data.t?.filter((t: Obj) => t.state === "uploaded").length,
          ],
          [
            "Research approved",
            data.t?.filter(
              (t: Obj) =>
                t.review_status === "approved" &&
                t.teacher_status === "approved" &&
                t.selected,
            ).length,
          ],
        ].map(([l, n]) => (
          <article key={l}>
            <span>{l}</span>
            <strong>{n ?? "—"}</strong>
          </article>
        ))}
      </div>
      <section className="panel">
        <h2>Batch completeness</h2>
        {batches.length ? (
          <>
            {paginatedBatches.map((b: Obj) => {
              const target = b.prompts.length * b.contributors.length;
              const count = (data.t || []).filter(
                (t: Obj) =>
                  t.batch_id === b.id &&
                  t.selected &&
                  t.teacher_status === "approved",
              ).length;
              return (
                <div className="list-row" key={b.id}>
                  <div>
                    <strong>{b.name}</strong>
                    <p>
                      {b.pilot
                        ? "Draft pilot · review required"
                        : "Approved prompt collection"}
                    </p>
                  </div>
                  <span>
                    {count} / {target} selected translations
                  </span>
                </div>
              );
            })}
            <Pagination
              total={batches.length}
              page={batchPage}
              pageSize={10}
              onChange={setBatchPage}
              itemLabel="batches"
            />
          </>
        ) : (
          <p>
            Create contributors, review prompts and assign your first batch.
          </p>
        )}
      </section>
      <section className="notice">
        <h3>Collect the translation, not an answer</h3>
        <p>
          The teacher signs the meaning of the displayed sentence. Hands,
          fingers, face, head and upper body should remain visible throughout.
        </p>
      </section>
    </>
  );
}
function Users({ run, notify }: { run: any; notify: any }) {
  const [users, setUsers] = useState<Obj[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const refresh = async () => setUsers(await api("/users"));
  useEffect(() => {
    run(refresh);
  }, []);
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);
  return (
    <>
      <Title
        tag="ADMINISTRATION"
        title="Contributors"
        description="Use contributor codes. Real names are not required."
      />
      <section className="panel">
        <h2>Create an account</h2>
        <form
          className="grid"
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget;
            const d = Object.fromEntries(new FormData(f));
            run(async () => {
              await api("/users", d);
              f.reset();
              await refresh();
              notify(
                "Account created. Share credentials securely outside this application.",
              );
            });
          }}
        >
          <Field label="Contributor code">
            <input name="code" required pattern="[A-Za-z0-9_-]+" />
          </Field>
          <Field label="Password · at least 12 characters">
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </Field>
          <Field label="Role">
            <select name="role">
              <option value="teacher">Teacher / contributor</option>
              <option value="admin">Research administrator</option>
            </select>
          </Field>
          <button>Create account</button>
        </form>
      </section>
      <section className="panel">
        <h2>Accounts</h2>
        {paginatedUsers.map((u) => (
          <div className="list-row" key={u.id}>
            <strong>{u.code}</strong>
            <span>
              {u.role} · {u.active ? "Active" : "Disabled"}
            </span>
          </div>
        ))}
        <Pagination
          total={users.length}
          page={page}
          pageSize={10}
          onChange={setPage}
          itemLabel="accounts"
        />
      </section>
    </>
  );
}
function Consent({
  user,
  run,
  notify,
  t = translations.en,
}: {
  user: Obj;
  run: any;
  notify: any;
  t?: typeof translations["en"];
}) {
  const [current, setCurrent] = useState<Obj | null>(null),
    [choices, setChoices] = useState<Obj>({
      recording: false,
      research: false,
      avatar: false,
      public: false,
    }),
    [affected, setAffected] = useState<Obj | null>(null),
    [confirm, setConfirm] = useState("");
  const load = async () => setCurrent(await api("/consent"));
  useEffect(() => {
    run(load);
  }, []);
  const isTeacher = user.role !== "admin";
  return (
    <>
      <Title
        tag={isTeacher ? t.consentEyebrow : "YOUR PERMISSIONS · VERSION 1.0"}
        title={isTeacher ? t.consentTitle : "Informed consent"}
        description={isTeacher ? t.consentDesc : "Choose separately how your signing recordings may be used."}
      />
      <section className="panel">
        <h2>{isTeacher ? t.beforeYouRecord : "Before you record"}</h2>
        <p>
          {isTeacher
            ? t.consentP1
            : "This study collects teachers’ translations of Tamil public-service sentences. Recording starts only when you press Start after a countdown. Audio is not collected."}
        </p>
        <p>
          {isTeacher
            ? t.consentP2
            : "Your hands, face, head and body may identify you. Contributor codes do not make videos anonymous. Facial expressions are signing features; the application does not infer emotions."}
        </p>
        <p>
          {isTeacher
            ? t.consentP3
            : "Authorised researchers can access recordings. When Google Drive is enabled, videos are stored privately in the research owner’s Google account. Future avatar use and public sharing are optional."}
        </p>
        <p>
          {isTeacher
            ? t.consentP4
            : "You can request withdrawal below. It blocks access and deletes stored recordings and annotations. Previously downloaded copies cannot be remotely erased; researchers must manage those copies and backup deletions separately."}
        </p>
        {current && (
          <p className="notice">
            {isTeacher
              ? t.latestConsentNotice(
                  new Date(current.created).toLocaleString(),
                  current.withdrawn ? t.statusWithdrawn : t.statusRecorded,
                  current.version,
                )
              : `Latest consent: ${new Date(current.created).toLocaleString()} · ${current.withdrawn ? "Withdrawn" : "Recorded"} · version ${current.version}`}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api("/consent", choices);
              await load();
              notify(
                isTeacher
                  ? t.consentSavedNotice
                  : "Consent preferences recorded. Start a new recording session to use them.",
              );
            });
          }}
        >
          {[
            ["recording", isTeacher ? t.permitRecording : "I permit video recording."],
            ["research", isTeacher ? t.permitResearch : "I permit research analysis of my recordings."],
            ["avatar", isTeacher ? t.permitAvatar : "I permit future avatar development using my recordings."],
            ["public", isTeacher ? t.permitPublic : "I permit public sharing of my recordings. Optional; disabled by default."],
          ].map(([key, label]) => (
            <Check
              key={key}
              label={label}
              value={choices[key]}
              onChange={(v) => setChoices({ ...choices, [key]: v })}
            />
          ))}
          <button>{isTeacher ? t.saveConsentBtn : "Save my consent choices"}</button>
        </form>
      </section>
      <section className="panel">
        <h2>{isTeacher ? t.withdrawSectionTitle : "Withdraw & delete"}</h2>
        <p>
          {isTeacher
            ? t.withdrawDesc
            : "Inspect affected records before confirming deletion. This action removes research videos and annotations."}
        </p>
        <button
          className="secondary"
          onClick={() =>
            run(async () => setAffected(await api("/withdrawal/" + user.id)))
          }
        >
          {isTeacher ? t.identifyAffectedBtn : "Identify affected records"}
        </button>
        {affected && (
          <>
            <p>
              {isTeacher
                ? t.affectedCountNotice(affected.takes.length, affected.annotation_count)
                : `${affected.takes.length} takes and ${affected.annotation_count} annotations are affected.`}
            </p>
            <Field label={isTeacher ? t.typeWithdrawConfirm : "Type WITHDRAW AND DELETE to confirm"}>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <button
              className="danger"
              disabled={confirm !== "WITHDRAW AND DELETE"}
              onClick={() =>
                run(async () => {
                  const r = await api("/withdrawal/" + user.id, {
                    confirmation: confirm,
                  });
                  notify(
                    isTeacher
                      ? t.withdrawSuccessNotice(r.deleted, r.deletion_pending.length)
                      : `Access blocked. ${r.deleted} files deleted; ${r.deletion_pending.length} deletions pending. Retry if any remain.`,
                  );
                  setAffected(null);
                  setConfirm("");
                  await load();
                })
              }
            >
              {isTeacher ? t.withdrawDeleteBtn : "Withdraw and delete"}
            </button>
          </>
        )}
      </section>
    </>
  );
}
function Prompts({ run, notify }: { run: any; notify: any }) {
  const [ps, setPs] = useState<Obj[]>([]),
    [bs, setBs] = useState<Obj[]>([]),
    [us, setUs] = useState<Obj[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [contributors, setContributors] = useState<string[]>([]),
    [edit, setEdit] = useState<Obj | null>(null),
    [csv, setCsv] = useState<File | null>(null),
    [preview, setPreview] = useState<Obj | null>(null),
    [promptPage, setPromptPage] = useState(1),
    [batchPage, setBatchPage] = useState(1);
  const pageSize = 10;
  const load = async () => {
    setPs(await api("/prompts"));
    setBs(await api("/batches"));
    setUs(await api("/users"));
  };
  useEffect(() => {
    run(load);
  }, []);
  const paginatedPs = ps.slice((promptPage - 1) * pageSize, promptPage * pageSize);
  const paginatedBs = bs.slice((batchPage - 1) * pageSize, batchPage * pageSize);
  const toggle = (id: string, list: string[], fn: any) =>
    fn(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  async function importCSV(save: boolean) {
    if (!csv) return;
    const f = new FormData();
    f.append("file", csv);
    const r = await fetch(`${API_BASE}/api/prompts/import?preview=${!save}`, {
      method: "POST",
      credentials: "include",
      headers: { "x-csrf-token": csrf },
      body: f,
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.detail || "Import failed");
    setPreview(d);
    if (d.saved) {
      notify(`Imported ${d.count} prompt versions.`);
      await load();
    }
  }
  return (
    <>
      <Title
        tag="RESEARCH MATERIALS"
        title="Prompts & batches"
        description="Prompt text is versioned. Existing recordings retain their original sentence."
      />
      <section className="panel">
        <h2>{edit ? "Create revised prompt version" : "Add a Tamil prompt"}</h2>
        <form
          key={edit?.id || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget;
            run(async () => {
              await api("/prompts", Object.fromEntries(new FormData(f)));
              setEdit(null);
              f.reset();
              await load();
              notify("Prompt version saved.");
            });
          }}
        >
          <div className="grid">
            <Field label="Stable prompt code">
              <input name="code" required defaultValue={edit?.code} />
            </Field>
            <Field label="Service domain">
              <select name="domain" defaultValue={edit?.domain}>
                {domains.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Tamil sentence · 3–10 whitespace-separated words">
              <textarea
                lang="ta"
                name="tamil"
                required
                defaultValue={edit?.tamil}
              />
            </Field>
            <Field label="English meaning · optional">
              <textarea name="english" defaultValue={edit?.english} />
            </Field>
            {[
              "intent",
              "action",
              "object",
              "negation",
              "quantity",
              "time",
              "location",
            ].map((k) => (
              <Field key={k} label={k}>
                <input name={k} defaultValue={edit?.[k]} />
              </Field>
            ))}
            <Field label="Status">
              <select name="status" defaultValue="draft">
                <option>draft</option>
                <option>approved</option>
                <option>archived</option>
              </select>
            </Field>
            <Field label="Researcher note for word-count exception">
              <input
                name="exception_note"
                defaultValue={edit?.exception_note}
              />
            </Field>
          </div>
          <div className="actions">
            <button>Save new version</button>
            {edit && (
              <button
                type="button"
                className="secondary"
                onClick={() => setEdit(null)}
              >
                Cancel revision
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>CSV import</h2>
        <p>
          UTF-8 CSV. Columns: code, tamil, english, domain, status, intent,
          action, object, negation, quantity, time, location, exception_note.
          Preview before committing.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            setCsv(e.target.files?.[0] || null);
            setPreview(null);
          }}
        />
        <div className="actions">
          <button
            className="secondary"
            disabled={!csv}
            onClick={() => run(() => importCSV(false))}
          >
            Validate / preview
          </button>
          <button
            disabled={!preview || !!preview.errors?.length || preview.saved}
            onClick={() => run(() => importCSV(true))}
          >
            Import validated rows
          </button>
        </div>
        {preview && <pre>{JSON.stringify(preview, null, 2)}</pre>}
      </section>
      <section className="panel">
        <h2>Select prompt versions for a batch</h2>
        {paginatedPs.map((p) => (
          <div className="prompt-row" key={p.id}>
            <input
              aria-label={"Select " + p.code + " version " + p.version}
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id, selected, setSelected)}
            />
            <div>
              <span className="pill">
                {p.code} · v{p.version} · {p.status}
              </span>
              <p lang="ta">{p.tamil}</p>
              <small>
                {p.domain} · {p.word_count} words{" "}
                {p.word_exception ? "· Word-count review required" : ""}
              </small>
            </div>
            <div>
              <button
                className="quiet"
                onClick={() => {
                  setEdit(p);
                  window.scrollTo(0, 0);
                }}
              >
                Revise
              </button>
              <button
                className="quiet"
                onClick={() =>
                  run(async () => {
                    await api(
                      "/prompts/" + p.id + "/status",
                      {
                        status:
                          p.status === "approved" ? "archived" : "approved",
                        exception_note: p.exception_note,
                      },
                      "PATCH",
                    );
                    await load();
                    notify("Prompt lifecycle status updated.");
                  })
                }
              >
                {p.status === "approved" ? "Archive" : "Approve"}
              </button>
            </div>
          </div>
        ))}
        {ps.length > 0 && (
          <Pagination
            total={ps.length}
            page={promptPage}
            pageSize={10}
            onChange={setPromptPage}
            itemLabel="prompts"
          />
        )}
        {!ps.length && (
          <p>
            No prompts yet. Import the supplied draft examples or create your
            own.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = e.currentTarget;
            const data = new FormData(f);
            run(async () => {
              await api("/batches", {
                name: data.get("name"),
                pilot: data.get("pilot") === "on",
                version_ids: selected,
                user_ids: contributors,
              });
              setSelected([]);
              setContributors([]);
              f.reset();
              await load();
              notify("Batch created and assigned.");
            });
          }}
        >
          <h3>Create assigned batch</h3>
          <Field label="Batch name">
            <input name="name" required />
          </Field>
          <label className="check">
            <input type="checkbox" name="pilot" />
            Explicit draft pilot — examples require researcher and sign-language
            review.
          </label>
          <p>Assign contributors:</p>
          {us
            .filter((u) => u.role === "teacher")
            .map((u) => (
              <Check
                key={u.id}
                label={u.code}
                value={contributors.includes(u.id)}
                onChange={() => toggle(u.id, contributors, setContributors)}
              />
            ))}
          <button disabled={!selected.length || !contributors.length}>
            Create batch · {selected.length} prompts
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Existing batches</h2>
        {paginatedBs.map((b) => (
          <div className="list-row" key={b.id}>
            <strong>{b.name}</strong>
            <span>
              {b.prompts.length} prompts · {b.contributors.length} contributors
              · {b.pilot ? "Draft pilot" : "Approved prompts"}
            </span>
          </div>
        ))}
        {bs.length > 0 && (
          <Pagination
            total={bs.length}
            page={batchPage}
            pageSize={10}
            onChange={setBatchPage}
            itemLabel="batches"
          />
        )}
      </section>
    </>
  );
}
function AnnotationForm({
  initial,
  onSave,
  busy = false,
  t,
}: {
  initial?: Obj;
  onSave: (d: Obj) => void;
  busy?: boolean;
  t?: typeof translations["en"];
}) {
  const [a, setA] = useState<Obj>({ ...emptyAnnotation, ...initial }),
    [segments, setSegments] = useState(
      JSON.stringify(initial?.segments || [], null, 2),
    ),
    [error, setError] = useState("");
  const tr = t || translations.en;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const seg = JSON.parse(segments);
          if (!Array.isArray(seg))
            throw Error("Segments must be a JSON array.");
          setError("");
          onSave({ ...a, segments: seg });
        } catch (e) {
          setError((e as Error).message);
        }
      }}
    >
      <h3>{tr.annotationTitle}</h3>
      <div className="grid">
        <Field label={tr.varietyLabel}>
          <input
            required
            placeholder={tr.varietyPlaceholder}
            value={a.variety}
            onChange={(e) => setA({ ...a, variety: e.target.value })}
          />
        </Field>
        <Field label={tr.variantLabel}>
          <input
            value={a.variant}
            onChange={(e) => setA({ ...a, variant: e.target.value })}
          />
        </Field>
      </div>
      {[
        ["translates", tr.checkTranslates],
        ["complete", tr.checkComplete],
        ["hands_visible", tr.checkHandsVisible],
        ["face_visible", tr.checkFaceVisible],
      ].map(([k, l]) => (
        <Check
          key={k}
          label={l}
          value={a[k]}
          onChange={(v) => setA({ ...a, [k]: v })}
        />
      ))}
      <div className="grid">
        {[
          ["framing_issues", tr.framingIssuesLabel],
          ["nonmanual_features", tr.nonmanualFeaturesLabel],
          ["meaning_notes", tr.meaningNotesLabel],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <textarea
              value={a[k]}
              onChange={(e) => setA({ ...a, [k]: e.target.value })}
            />
          </Field>
        ))}
        <Field label={tr.optionalSegmentsLabel}>
          <textarea
            value={segments}
            onChange={(e) => setSegments(e.target.value)}
          />
        </Field>
        <Field label={tr.decisionLabel}>
          <select
            value={a.status}
            onChange={(e) => setA({ ...a, status: e.target.value })}
          >
            <option value="approved">{tr.approveOption}</option>
            <option value="needs_review">{tr.needsReviewOption}</option>
            <option value="rejected">{tr.rejectOption}</option>
          </select>
        </Field>
      </div>
      {error && <p className="error">{error}</p>}
      <button disabled={busy}>
        {busy ? tr.saving : tr.saveReviewApprovalBtn}
      </button>
    </form>
  );
}
function Recorder({
  run,
  notify,
  consentPage,
  lang,
  t,
}: {
  run: any;
  notify: any;
  consentPage: () => void;
  lang: Language;
  t: typeof translations["en"];
}) {
  const [batches, setBatches] = useState<Obj[]>([]),
    [batchId, setBatchId] = useState(""),
    [domain, setDomain] = useState(""),
    [session, setSession] = useState(""),
    [sessionComplete, setSessionComplete] = useState(false),
    [index, setIndex] = useState(0),
    [state, setState] = useState("ready"),
    [count, setCount] = useState(0),
    [elapsed, setElapsed] = useState(0),
    [progress, setProgress] = useState(0),
    [mirror, setMirror] = useState(true),
    [camera, setCamera] = useState(false),
    [blob, setBlob] = useState<Blob | null>(null),
    [url, setUrl] = useState(""),
    [take, setTake] = useState(""),
    [consent, setConsent] = useState<Obj | null>(null),
    [saved, setSaved] = useState<Obj[]>([]),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [device, setDevice] = useState("");
  const preview = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    chunks = useRef<Blob[]>([]),
    timer = useRef<number | undefined>(undefined),
    countdown = useRef<number | undefined>(undefined),
    alive = useRef(true),
    key = useRef(crypto.randomUUID()),
    urlRef = useRef("");
  const batch = batches.find((b) => b.id === batchId);
  const prompts =
    batch?.prompts.filter((p: Obj) => !domain || p.domain === domain) || [];
  const prompt = prompts[index];
  const dirty = !!blob && state !== "saved";

  useEffect(() => {
    run(async () => {
      const assignedBatches = await api("/batches");
      setBatches(assignedBatches);
      if (assignedBatches.length) {
        const best = assignedBatches.reduce(
          (prev: any, cur: any) =>
            (cur.prompts?.length || 0) > (prev.prompts?.length || 0)
              ? cur
              : prev,
          assignedBatches[0],
        );
        setBatchId(best.id);
      }
      const c = await api("/consent");
      setConsent(c);
      setSaved(await api("/takes"));
    });
    return () => {
      alive.current = false;
      clearInterval(timer.current);
      clearInterval(countdown.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  useEffect(() => {
    if (
      batches.length > 0 &&
      (!batchId || !batches.some((b) => b.id === batchId))
    ) {
      const best = batches.reduce(
        (prev: any, cur: any) =>
          (cur.prompts?.length || 0) > (prev.prompts?.length || 0)
            ? cur
            : prev,
        batches[0],
      );
      setBatchId(best.id);
    }
  }, [batches, batchId]);

  useEffect(() => {
    if (consent?.recording && !camera && !stream.current) {
      openCamera().catch(() => {});
    }
  }, [consent]);

  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia)
      throw Error(
        "Camera access requires HTTPS or localhost and a supported browser.",
      );
    if (!window.MediaRecorder)
      throw Error(
        "This browser does not support video recording. Use a current supported browser.",
      );
    stream.current?.getTracks().forEach((t) => t.stop());
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          ...(device ? { deviceId: { exact: device } } : {}),
        },
      });
    } catch (e) {
      const n = (e as DOMException).name;
      if (n === "NotAllowedError")
        throw Error(
          "Camera permission denied. Allow camera access in browser settings, then retry.",
        );
      if (n === "NotFoundError")
        throw Error("No camera found. Connect a webcam and retry.");
      if (n === "OverconstrainedError")
        media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      else
        throw Error(
          "Camera could not be opened. Check whether another application is using it.",
        );
    }
    stream.current = media;
    if (preview.current) {
      preview.current.srcObject = media;
      preview.current.play().catch(() => {});
    }
    setCamera(true);
    try {
      const devList = await navigator.mediaDevices.enumerateDevices();
      setDevices(devList.filter((d) => d.kind === "videoinput"));
    } catch {}
  }

  function clearTake() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = "";
    setUrl("");
    setBlob(null);
    setTake("");
    setProgress(0);
    setElapsed(0);
    key.current = crypto.randomUUID();
    setState("ready");
  }

  async function retakeVideo() {
    if (take && state !== "saved") {
      try {
        await api(`/takes/${take}`, undefined, "DELETE");
      } catch {}
    }
    clearTake();
    if (preview.current && stream.current) {
      preview.current.srcObject = stream.current;
      preview.current.play().catch(() => {});
    }
    notify(t.takeDiscardedNotice);
  }

  async function changePrompt(nextIndex: number) {
    if (dirty) {
      const confirmDiscard = window.confirm(
        lang === "si"
          ? "ඔබ සතුව උඩුගත නොකළ පටිගත කිරීමක් ඇත. එය ඉවත් කර වෙනත් වාක්‍යයකට මාරු වීමට අවශ්‍යද?"
          : lang === "ta"
            ? "உங்களிடம் பதிவேற்றப்படாத வீடியோ உள்ளது. அதை நிராகரித்து அடுத்த வாக்கியத்திற்கு மாற விரும்புகிறீர்களா?"
            : "You have an unuploaded recording. Discard it and switch sentences?",
      );
      if (!confirmDiscard) return;
      if (take && state !== "saved") {
        try {
          await api(`/takes/${take}`, undefined, "DELETE");
        } catch {}
      }
    }
    clearTake();
    setIndex(nextIndex);
    if (preview.current && stream.current) {
      preview.current.srcObject = stream.current;
      preview.current.play().catch(() => {});
    }
  }

  async function start() {
    if (!prompt) throw Error("Select an assigned sentence first.");
    if (!stream.current || !stream.current.active) await openCamera();
    if (!stream.current) throw Error("Camera could not be opened.");
    if (preview.current && preview.current.srcObject !== stream.current) {
      preview.current.srcObject = stream.current;
      preview.current.play().catch(() => {});
    }
    let sid = session;
    if (!sid) {
      sid = (await api("/sessions", { batch_id: batchId })).id;
      setSession(sid);
    }
    const tRec = await api("/takes", {
      session_id: sid,
      version_id: prompt.id,
      key: key.current,
    });
    setTake(tRec.id);
    setCount(3);
    setState("countdown");
    let left = 3;
    countdown.current = window.setInterval(() => {
      left--;
      setCount(left);
      if (left === 0) {
        clearInterval(countdown.current);
        try {
          const types = [
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm",
            "video/mp4",
          ];
          const mime = types.find((tp) => MediaRecorder.isTypeSupported(tp));
          if (!mime) throw Error("No supported WebM or MP4 recording format.");
          const r = new MediaRecorder(stream.current!, {
            mimeType: mime,
            videoBitsPerSecond: 4000000,
          });
          recorder.current = r;
          chunks.current = [];
          r.ondataavailable = (e) => {
            if (e.data.size) chunks.current.push(e.data);
          };
          r.onstop = () => {
            clearInterval(timer.current);
            if (!alive.current) return;
            const b = new Blob(chunks.current, { type: r.mimeType });
            setBlob(b);
            urlRef.current = URL.createObjectURL(b);
            setUrl(urlRef.current);
            setState("review");
          };
          r.onerror = () => {
            clearInterval(timer.current);
            setState("error");
            notify("Recording failed. Please re-record this take.");
          };
          r.start(1000);
          setElapsed(0);
          setState("recording");
          timer.current = window.setInterval(
            () => setElapsed((v) => v + 1),
            1000,
          );
        } catch (e) {
          setState("ready");
          notify((e as Error).message);
        }
      }
    }, 1000);
  }

  async function uploadTake() {
    if (!blob || !take) return;
    setState("uploading");
    setProgress(0);
    try {
      await new Promise<void>((resolve, reject) => {
        const x = new XMLHttpRequest();
        x.withCredentials = true;
        x.open("POST", `${API_BASE}/api/takes/${take}/upload`);
        x.setRequestHeader("x-csrf-token", csrf);
        x.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 100));
        };
        x.onload = () => {
          if (x.status >= 200 && x.status < 300) resolve();
          else {
            let d;
            try {
              d = JSON.parse(x.responseText);
            } catch {}
            reject(
              Error(
                d?.detail ||
                  "Upload failed. Retry; your local recording is still available.",
              ),
            );
          }
        };
        x.onerror = () =>
          reject(Error("Connection interrupted. Retry this upload."));
        const f = new FormData();
        f.append("file", blob, "take");
        x.send(f);
      });
      const updatedSaved = await api("/takes");
      setSaved(updatedSaved);
      notify(t.serverConfirmedNotice);
      if (index < prompts.length - 1) {
        clearTake();
        setIndex((prev) => prev + 1);
        if (preview.current && stream.current) {
          preview.current.srcObject = stream.current;
          preview.current.play().catch(() => {});
        }
      } else {
        setState("saved");
        notify(t.allSentencesCompleted);
      }
    } catch (e) {
      setState("review");
      throw e;
    }
  }

  return (
    <>
      <Title
        tag={t.recorderEyebrow}
        title={t.recorderTitle}
        description={t.recorderDesc}
      />

      {/* Quick 1-click Consent Agreement if consent not yet granted */}
      {(!consent?.recording || consent?.withdrawn) && (
        <section className="panel notice consent-quick-banner" role="alert">
          <div className="consent-quick-content">
            <div>
              <h3>{t.quickConsentTitle}</h3>
              <p>{t.quickConsentDesc}</p>
            </div>
            <div className="consent-quick-actions">
              <button
                className="btn-agree"
                onClick={() =>
                  run(async () => {
                    await api("/consent", { recording: true, research: true });
                    const c = await api("/consent");
                    setConsent(c);
                    notify(t.consentSavedNotice);
                  })
                }
              >
                {t.quickConsentBtn}
              </button>
              <button className="secondary" onClick={consentPage}>
                {t.reviewConsentBtn}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Batch & Domain Selector Bar */}
      <section className="panel studio-meta-panel">
        <div className="grid">
          <Field label={t.assignedBatch}>
            <select
              value={batchId}
              disabled={!!session || dirty || sessionComplete}
              onChange={(e) => {
                setBatchId(e.target.value);
                setIndex(0);
                clearTake();
              }}
            >
              <option value="">{t.selectBatch}</option>
              {batches.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name} ({b.prompts?.length || 0} sentences)
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.serviceDomain}>
            <select
              value={domain}
              disabled={!!session || dirty || sessionComplete}
              onChange={(e) => {
                setDomain(e.target.value);
                setIndex(0);
                clearTake();
              }}
            >
              <option value="">{t.allAssignedDomains}</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d === "hospital"
                    ? t.domainHospital
                    : d === "transport"
                      ? t.domainTransport
                      : t.domainBank}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {batch && (
          <div className="batch-status-row">
            <span className="pill">{batch.name}</span>
            <span className="batch-upload-info">
              {t.videosUploadedForBatch(
                saved.filter(
                  (st) => st.batch_id === batchId && st.state === "uploaded",
                ).length,
              )}
            </span>
            {session && !sessionComplete && (
              <button
                className="secondary complete-btn"
                disabled={
                  ["recording", "countdown", "uploading"].includes(state) ||
                  dirty
                }
                onClick={() =>
                  run(async () => {
                    await api(`/sessions/${session}/complete`, {});
                    setSessionComplete(true);
                    notify(t.collectionCompletedNotification);
                  })
                }
              >
                {t.completeCollectionBtn}
              </button>
            )}
          </div>
        )}

        {sessionComplete && (
          <div className="notice" role="status" style={{ marginTop: 16 }}>
            <strong>{t.collectionCompletedTitle}</strong>
            <p>{t.collectionCompletedDesc}</p>
            <button
              className="secondary"
              onClick={() => {
                setSession("");
                setSessionComplete(false);
                setIndex(0);
                clearTake();
              }}
            >
              {t.startAnotherCollectionBtn}
            </button>
          </div>
        )}

        {batch?.pilot && (
          <p className="notice" style={{ marginTop: 14 }}>
            {t.pilotDraftNotice}
          </p>
        )}
      </section>

      {/* If no sentences in batch */}
      {!prompts.length && (
        <section className="panel notice" role="status">
          <h2>{t.noSentencesAssignedTitle}</h2>
          <p>{t.noSentencesAssignedDesc}</p>
        </section>
      )}

      {/* The Sign Recording Studio */}
      {prompt && (
        <div className="studio-container">
          {/* Sentence / Prompt Card (TOP) */}
          <section className="panel prompt-card studio-prompt-card">
            <div className="section-heading">
              <div className="prompt-header-badges">
                <span className="pill domain-badge">
                  {prompt.domain === "hospital"
                    ? t.domainHospital
                    : prompt.domain === "transport"
                      ? t.domainTransport
                      : t.domainBank}
                </span>
                <span className="prompt-code-pill">
                  {prompt.code} · v{prompt.version}
                </span>
              </div>
              <div className="prompt-progress-counter">
                <strong>{t.sentenceCount(index + 1, prompts.length)}</strong>
                <span className="progress-uploaded-badge">
                  {
                    saved.filter(
                      (st) =>
                        st.batch_id === batchId && st.state === "uploaded",
                    ).length
                  }{" "}
                  {t.uploadedCount}
                </span>
              </div>
            </div>

            <h3 className="sign-instruction-heading">{t.signThisSentence}</h3>

            {/* Multilingual prompt display for Sinhala, Tamil, English */}
            <div className="prompt-translations studio-translations">
              {/* Primary sentence in teacher's chosen language */}
              <div className="prompt-line primary-prompt-line">
                <span
                  className={`prompt-lang-badge ${lang === "si" ? "badge-si" : lang === "ta" ? "badge-ta" : "badge-en"}`}
                >
                  {lang === "si"
                    ? "සිංහල"
                    : lang === "ta"
                      ? "தமிழ்"
                      : "English"}
                </span>
                <p
                  className="prompt-text large-sentence"
                  lang={lang === "si" ? "si" : lang === "ta" ? "ta" : "en"}
                >
                  {lang === "si"
                    ? prompt.sinhala || prompt.tamil
                    : lang === "ta"
                      ? prompt.tamil
                      : prompt.english || prompt.tamil}
                </p>
              </div>

              {/* Secondary cross-language references */}
              {lang !== "ta" && prompt.tamil && (
                <div className="prompt-line">
                  <span className="prompt-lang-badge badge-ta">தமிழ்</span>
                  <p className="prompt-text" lang="ta">
                    {prompt.tamil}
                  </p>
                </div>
              )}
              {lang !== "si" && prompt.sinhala && (
                <div className="prompt-line">
                  <span className="prompt-lang-badge badge-si">සිංහල</span>
                  <p className="prompt-text" lang="si">
                    {prompt.sinhala}
                  </p>
                </div>
              )}
              {lang !== "en" && prompt.english && (
                <div className="prompt-line">
                  <span className="prompt-lang-badge badge-en">English</span>
                  <p className="prompt-text" lang="en">
                    {prompt.english}
                  </p>
                </div>
              )}
            </div>

            <div className="framing-notice-pill">
              <span>ℹ️ {t.framingReminder}</span>
            </div>
          </section>

          {/* Video & Controls Area */}
          <section className="panel studio-camera-card">
            {/* If currently in Review mode (Video recorded, waiting for teacher check) */}
            {state === "review" && url ? (
              <div className="review-studio-box">
                <div className="review-header">
                  <div>
                    <h3 className="review-title">{t.reviewTitle}</h3>
                    <p className="review-subtext">{t.reviewSubtext}</p>
                  </div>
                  <span className="pill">{t.audioOff}</span>
                </div>

                {/* Recorded Video Player */}
                <div className="review-player-wrapper">
                  <video
                    className="playback review-player"
                    src={url}
                    controls
                    autoPlay
                    playsInline
                  />
                </div>

                {/* The Two Main Action Buttons: Upload & Next vs Re-record */}
                <div className="review-decision-actions">
                  <button
                    className="btn-upload-next"
                    onClick={() => run(uploadTake)}
                  >
                    {t.uploadAndNextBtn}
                  </button>
                  <button
                    className="btn-rerecord"
                    onClick={() => run(retakeVideo)}
                  >
                    {t.rerecordBtn}
                  </button>
                </div>
                <p className="small note-center">{t.takeLinkedNote}</p>
              </div>
            ) : (
              /* Otherwise: Live Camera Recording View */
              <div className="live-camera-view">
                <div className="section-heading">
                  <h2>{t.cameraFramingTitle}</h2>
                  <span className="pill">{t.audioOff}</span>
                </div>

                <div className="camera studio-camera">
                  <video
                    ref={preview}
                    autoPlay
                    muted
                    playsInline
                    className={mirror ? "mirror" : ""}
                  />
                  {!camera && (
                    <div className="camera-offline-msg">
                      <span>{t.cameraPlaceholder}</span>
                      <button
                        className="secondary"
                        style={{ marginTop: 12 }}
                        onClick={() => run(openCamera)}
                      >
                        {t.previewCameraOptional}
                      </button>
                    </div>
                  )}

                  {/* Big Countdown Overlay */}
                  {state === "countdown" && (
                    <div className="countdown-overlay">
                      <span className="countdown-number">{count}</span>
                      <p>{t.statusCountdown(count)}</p>
                    </div>
                  )}

                  {/* Flashing Recording Overlay */}
                  {state === "recording" && (
                    <div className="recording-pill-overlay">
                      <span className="rec-dot">● RECORDING</span>
                      <span className="rec-timer">{elapsed}s</span>
                    </div>
                  )}
                </div>

                {/* Live Action Buttons */}
                <div className="studio-actions-row">
                  {["ready", "error"].includes(state) && (
                    <button
                      className="btn-start-record"
                      onClick={() => run(start)}
                    >
                      {t.startRecordingBtn}
                    </button>
                  )}

                  {state === "countdown" && (
                    <button
                      className="secondary btn-cancel-countdown"
                      onClick={() =>
                        run(async () => {
                          clearInterval(countdown.current);
                          if (take)
                            await api(`/takes/${take}`, undefined, "DELETE");
                          clearTake();
                        })
                      }
                    >
                      {t.cancelCountdownBtn}
                    </button>
                  )}

                  {state === "recording" && (
                    <button
                      className="danger btn-stop-record"
                      onClick={() => recorder.current?.stop()}
                    >
                      {t.stopRecordingBtn}
                    </button>
                  )}

                  {state === "uploading" && (
                    <div className="uploading-progress-box">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span>{t.statusUploading(progress)}</span>
                    </div>
                  )}

                  {/* Camera auxiliary controls */}
                  <div className="camera-aux-controls">
                    {camera ? (
                      <button
                        className="quiet"
                        disabled={[
                          "recording",
                          "countdown",
                          "uploading",
                        ].includes(state)}
                        onClick={() => run(openCamera)}
                      >
                        {t.restartCamera}
                      </button>
                    ) : (
                      <button className="quiet" onClick={() => run(openCamera)}>
                        {t.previewCameraOptional}
                      </button>
                    )}

                    {devices.length > 1 && (
                      <select
                        aria-label="Camera"
                        value={device}
                        onChange={(e) => setDevice(e.target.value)}
                        disabled={[
                          "recording",
                          "countdown",
                          "uploading",
                        ].includes(state)}
                      >
                        <option value="">{t.defaultCamera}</option>
                        {devices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || "Camera"}
                          </option>
                        ))}
                      </select>
                    )}

                    <Check
                      label={t.mirrorPreviewOnly}
                      value={mirror}
                      onChange={setMirror}
                    />
                  </div>
                </div>

                {state === "recording" && elapsed >= 540 && (
                  <p className="notice">{t.maxDurationNotice}</p>
                )}
              </div>
            )}

            {/* Sentence Navigation Row (Previous / Next) */}
            <div className="studio-nav-footer">
              <button
                className="secondary btn-prev"
                disabled={
                  index === 0 ||
                  dirty ||
                  ["countdown", "recording", "uploading"].includes(state)
                }
                onClick={() => changePrompt(index - 1)}
              >
                {t.prevSentenceBtn}
              </button>
              <span className="nav-index-text">
                {index + 1} / {prompts.length}
              </span>
              <button
                className="secondary btn-next"
                disabled={
                  index >= prompts.length - 1 ||
                  dirty ||
                  ["countdown", "recording", "uploading"].includes(state)
                }
                onClick={() => changePrompt(index + 1)}
              >
                {t.nextSentenceBtn}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function Dataset({
  user,
  run,
  notify,
  lang = "en",
  t = translations.en,
}: {
  user: Obj;
  run: any;
  notify: any;
  lang?: Language;
  t?: typeof translations["en"];
}) {
  const [ts, setTs] = useState<Obj[]>([]),
    [bs, setBs] = useState<Obj[]>([]),
    [domain, setDomain] = useState(""),
    [batch, setBatch] = useState(""),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState<Obj | null>(null),
    [purpose, setPurpose] = useState("research"),
    [rejected, setRejected] = useState(false),
    [allUploads, setAllUploads] = useState(true),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(1);
  const pageSize = 10;
  const isTeacher = user.role !== "admin";
  const load = async () => {
    setTs(await api("/takes"));
    setBs(await api("/batches"));
  };
  useEffect(() => {
    run(load);
  }, []);
  const filters = {
    purpose,
    domain,
    batch_id: batch,
    status: status === "rejected" ? "rejected" : "approved",
    include_rejected: rejected,
    include_all_uploads: allUploads,
  };
  async function download(kind: string) {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/exports/${kind}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(filters),
      });
      if (!r.ok) throw Error((await r.json()).detail || "Export failed");
      const b = await r.blob();
      const link = document.createElement("a");
      const url = URL.createObjectURL(b);
      link.href = url;
      link.download = kind === "zip" ? "sign-dataset.zip" : "metadata." + kind;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      notify(
        "Export downloaded. Store this copy privately and apply future withdrawals.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function downloadAllZip() {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/exports/zip`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          purpose: "research",
          domain: "",
          batch_id: "",
          status: "approved",
          include_rejected: false,
          include_all_uploads: true,
        }),
      });
      if (!r.ok) throw Error((await r.json()).detail || "Export failed");
      const b = await r.blob();
      const link = document.createElement("a");
      const url = URL.createObjectURL(b);
      link.href = url;
      link.download = `sign-dataset-all-videos-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      notify("ZIP downloaded successfully. Includes all video recordings and metadata.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = ts.filter(
    (t) =>
      (!domain || t.prompt.domain === domain) &&
      (!batch || t.batch_id === batch) &&
      (!status || t.review_status === status || t.teacher_status === status),
  );
  const paginatedTakes = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <Title
        tag={isTeacher ? t.myRecordingsEyebrow : "DATASET WORKSPACE"}
        title={isTeacher ? t.myRecordingsTitle : "Review recordings"}
        description={
          isTeacher
            ? t.myRecordingsDesc
            : "Selected takes, original prompt versions and human review decisions stay linked."
        }
      />

      {/* Admin Quick Export Bar */}
      {user.role === "admin" && (
        <div className="admin-quick-export-bar">
          <div>
            <strong>📦 Video Dataset ZIP Download</strong>
            <p className="small" style={{ margin: "4px 0 0", color: "#365947" }}>
              Download all recorded videos (.webm/.mp4) with complete transcripts and metadata manifest in one ZIP file.
            </p>
          </div>
          <button
            className="btn-download-zip"
            disabled={busy}
            onClick={() => run(downloadAllZip)}
          >
            {busy ? "Preparing ZIP…" : "⬇️ Download All Videos (ZIP)"}
          </button>
        </div>
      )}

      <section className="panel">
        <div className="grid">
          <Field label={isTeacher ? t.filterDomain : "Domain"}>
            <select
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{isTeacher ? t.allDomains : "All domains"}</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {isTeacher
                    ? (d === "hospital" ? t.domainHospital : d === "transport" ? t.domainTransport : t.domainBank)
                    : d}
                </option>
              ))}
            </select>
          </Field>
          <Field label={isTeacher ? t.filterBatch : "Batch"}>
            <select
              value={batch}
              onChange={(e) => {
                setBatch(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{isTeacher ? t.allBatches : "All batches"}</option>
              {bs.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={isTeacher ? t.filterStatus : "Review status"}>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{isTeacher ? t.allStatuses : "All statuses"}</option>
              <option value="approved">{isTeacher ? t.statusApproved : "Approved"}</option>
              <option value="rejected">{isTeacher ? t.statusRejected : "Rejected"}</option>
              <option value="pending">{isTeacher ? t.statusPending : "Pending"}</option>
              <option value="needs_review">{isTeacher ? t.statusNeedsReview : "Needs review"}</option>
            </select>
          </Field>
        </div>
        {paginatedTakes.map((takeItem) => (
          <button
            className="take-row"
            key={takeItem.id}
            onClick={() => setSelected(takeItem)}
          >
            <div>
              <strong>
                {takeItem.prompt.code} · v{takeItem.prompt.version} · {takeItem.contributor_code}
              </strong>
              {isTeacher && lang === "si" && takeItem.prompt.sinhala ? (
                <p lang="si">{takeItem.prompt.sinhala}</p>
              ) : isTeacher && lang === "en" && takeItem.prompt.english ? (
                <p>{takeItem.prompt.english}</p>
              ) : (
                <p lang="ta">{takeItem.prompt.tamil}</p>
              )}
              <small>
                {takeItem.id.slice(0, 8)} · {takeItem.state} ·{" "}
                {Math.round(takeItem.properties.duration || 0)}s ·{" "}
                {takeItem.session_completed
                  ? (isTeacher ? t.collectionCompletedBadge : "collection completed")
                  : (isTeacher ? t.collectionInProgressBadge : "collection in progress")}
              </small>
            </div>
            <div>
              <span className="pill">
                {takeItem.selected
                  ? (isTeacher ? t.selectedTakeBadge : "Selected take")
                  : (isTeacher ? t.otherTakeBadge : "Other take")}
              </span>
              <p>
                {isTeacher ? t.teacherReviewLabel : "Teacher:"} {takeItem.teacher_status}
                <br />
                {isTeacher ? t.researchReviewLabel : "Research:"} {takeItem.review_status}
              </p>
            </div>
          </button>
        ))}
        {filtered.length > 0 && (
          <Pagination
            total={filtered.length}
            page={page}
            pageSize={10}
            onChange={setPage}
            itemLabel={isTeacher ? t.myRecordingsTitle : "recordings"}
          />
        )}
        {!filtered.length && (
          <p>{isTeacher ? t.noRecordingsMatch : "No recordings match these filters."}</p>
        )}
      </section>
      {selected && (
        <section className="panel">
          <h2>
            {selected.prompt.code} · original version {selected.prompt.version}
          </h2>
          <div className="prompt-translations">
            {isTeacher && lang === "si" ? (
              <>
                {selected.prompt.sinhala && (
                  <div className="prompt-line">
                    <span className="prompt-lang-badge badge-si">සිංහල</span>
                    <p className="prompt-text large-sentence" lang="si">{selected.prompt.sinhala}</p>
                  </div>
                )}
                <div className="prompt-line">
                  <span className="prompt-lang-badge badge-ta">தமிழ்</span>
                  <p className="prompt-text" lang="ta">{selected.prompt.tamil}</p>
                </div>
              </>
            ) : isTeacher && lang === "en" ? (
              <>
                {selected.prompt.english && (
                  <div className="prompt-line">
                    <span className="prompt-lang-badge badge-en">English</span>
                    <p className="prompt-text large-sentence">{selected.prompt.english}</p>
                  </div>
                )}
                <div className="prompt-line">
                  <span className="prompt-lang-badge badge-ta">தமிழ்</span>
                  <p className="prompt-text" lang="ta">{selected.prompt.tamil}</p>
                </div>
              </>
            ) : (
              <>
                <div className="prompt-line">
                  <span className="prompt-lang-badge badge-ta">தமிழ்</span>
                  <p className="prompt-text large-sentence" lang="ta">{selected.prompt.tamil}</p>
                </div>
                {selected.prompt.sinhala && (
                  <div className="prompt-line">
                    <span className="prompt-lang-badge badge-si">සිංහල</span>
                    <p className="prompt-text" lang="si">{selected.prompt.sinhala}</p>
                  </div>
                )}
              </>
            )}
            {selected.prompt.english && lang !== "en" && (
              <div className="prompt-line">
                <span className="prompt-lang-badge badge-en">English</span>
                <p className="prompt-text">{selected.prompt.english}</p>
              </div>
            )}
          </div>
          {selected.state === "uploaded" ? (
            <>
              <video
                controls
                className="playback"
                crossOrigin="use-credentials"
                src={`${API_BASE}/api/takes/${selected.id}/video`}
              />
              <div style={{ display: "flex", gap: "12px", alignItems: "center", margin: "10px 0 16px", flexWrap: "wrap" }}>
                <a
                  href={`${API_BASE}/api/takes/${selected.id}/video`}
                  download={`recording-${selected.prompt.code}-${selected.id.slice(0, 8)}.webm`}
                  className="secondary button-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  ⬇️ Download this video
                </a>
              </div>
              <p className="small">
                {isTeacher ? t.savedStreamNote : "Saved stream · no preview mirroring"}
              </p>
              <AnnotationForm
                key={selected.id}
                initial={selected.annotation || undefined}
                t={isTeacher ? t : undefined}
                onSave={(a) =>
                  run(async () => {
                    await api("/takes/" + selected.id + "/review", a);
                    await load();
                    setSelected(null);
                    notify(isTeacher ? t.reviewRecordedNotice : "Review recorded.");
                  })
                }
              />
            </>
          ) : (
            <p>{isTeacher ? t.videoUnavailable : "Video unavailable:"} {selected.state}</p>
          )}
        </section>
      )}
      {user.role === "admin" && (
        <section className="panel">
          <h2>Export eligible recordings</h2>
          <p>
            Default: selected takes with both teacher and research approval.
            Original and current consent must permit the chosen use. Every ZIP
            includes the original prompt text as its transcript.
          </p>
          <Field label="Permitted export purpose">
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="research">Research analysis</option>
              <option value="avatar">Avatar development</option>
              <option value="public">Public sharing</option>
            </select>
          </Field>
          <Check
            label="Include every uploaded recording allowed by consent, including those awaiting review"
            value={allUploads}
            onChange={setAllUploads}
          />
          {status === "rejected" && (
            <Check
              label="Explicitly include rejected takes permitted by consent"
              value={rejected}
              onChange={setRejected}
            />
          )}
          <div className="actions">
            <button
              className="secondary"
              onClick={() =>
                run(async () => {
                  const r = await api("/exports/preview", filters);
                  notify(
                    `${r.eligible_count} recordings eligible for this export.`,
                  );
                })
              }
            >
              Check eligibility
            </button>
            {["csv", "json", "zip"].map((k) => (
              <button
                disabled={busy}
                key={k}
                onClick={() => run(() => download(k))}
              >
                {busy ? "Preparing…" : "Download " + k.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="small">
            Packages contain videos, metadata and schema manifest. Consent
            records and credentials are excluded.
          </p>
        </section>
      )}
    </>
  );
}
function Storage({ run }: { run: any }) {
  const [s, setS] = useState<Obj | null>(null);
  useEffect(() => {
    run(async () => setS(await api("/storage")));
  }, []);
  return (
    <>
      <Title
        tag="PRIVATE STORAGE"
        title="Google Drive connection"
        description="Connect the research owner’s account. Contributors do not need access to the Drive folder."
      />
      <section className="panel">
        <h2>Storage status</h2>
        <p>
          Active backend: <strong>{s?.backend || "…"}</strong>
        </p>
        <p>
          Google Drive:{" "}
          <strong>{s?.drive_connected ? "Connected" : "Not connected"}</strong>
        </p>
        <p>
          The application creates its own private folder using the limited
          drive.file scope. It does not make your videos public.
        </p>
        <button
          onClick={() =>
            run(async () => {
              const r = await api("/storage/drive/connect", {});
              window.location.assign(r.url);
            })
          }
        >
          {s?.drive_connected
            ? "Reconnect Google Drive"
            : "Connect Google Drive"}
        </button>
        {!s?.oauth_configured && (
          <p className="notice">
            Google OAuth credentials are not configured yet. Follow
            docs/GOOGLE_DRIVE.md. Never enter a Google password into this
            application.
          </p>
        )}
        <p>
          To use Drive for new recordings, set STORAGE_BACKEND=drive on the
          backend and restart. Existing recordings retain their original storage
          location.
        </p>
        <p className="small">
          Keep the database private: it contains the Google refresh token. This
          prototype requires disk encryption and restricted server access.
        </p>
      </section>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
