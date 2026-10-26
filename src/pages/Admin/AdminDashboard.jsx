
import { useMemo, useState } from "react";

import {
 signInWithEmailAndPassword,
 signOut,
} from "firebase/auth";
import {
 collection,
 getDocs,
 query,
 orderBy,
} from "firebase/firestore";
import { auth, db } from "../../services/firebase";


const TYPES = {
 farmer: "Farmer",
 "cooperative-new": "New Cooperative",
 "cooperative-old": "Existing Cooperative",
 partner: "Partner",
 investor: "Investor",
 sponsor: "Sponsor",
};

const PREFIXES = {
 farmer: "FRM",
 "cooperative-new": "NCOOP",
 "cooperative-old": "COOP",
 partner: "PTR",
 investor: "INV",
 sponsor: "SPN",
};

function getName(data = {}) {
 return (
  data.applicantName ||
  data.applicant?.fullName ||
  data.applicant?.full_name ||
  data.applicant?.name ||
  [
   data.applicant?.firstName,
   data.applicant?.lastName,
  ].filter(Boolean).join(" ") ||
  [
   data.applicant?.first_name,
   data.applicant?.last_name,
  ].filter(Boolean).join(" ") ||
  "Unnamed applicant"
 );
}

function getMembershipId(id, category) {
 return `${PREFIXES[category] || "ATH"}-${id.slice(-8).toUpperCase()}`;
}

function getPaymentStatus(record) {
 const status = String(record.paymentStatus || "").toLowerCase();

 if (["paid", "success", "successful"].includes(status)) return "Paid";
 if (status === "completed") return "Completed";
 return "Pending";
}

function money(amount) {
 return new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
 }).format(Number(amount || 0) / 100);
}

function dateText(value) {
 if (!value) return "—";
 const date = value?.toDate ? value.toDate() : new Date(value);
 return Number.isNaN(date.getTime())
  ? "—"
  : date.toLocaleDateString("en-NG", {
   day: "numeric",
   month: "short",
   year: "numeric",
  });
}

function Status({ value }) {
 const styles = {
  Paid: "bg-emerald-50 text-emerald-700",
  Completed: "bg-green-100 text-green-800",
  Pending: "bg-amber-50 text-amber-700",
 };

 return (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[value] || styles.Pending}`}>
   {value}
  </span>
 );
}

export default function AdminDashboard() {
 const [user, setUser] = useState(auth.currentUser);
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [records, setRecords] = useState([]);
 const [selected, setSelected] = useState(null);
 const [search, setSearch] = useState("");
 const [typeFilter, setTypeFilter] = useState("all");
 const [statusFilter, setStatusFilter] = useState("all");
 const [loading, setLoading] = useState(false);
 const [loginError, setLoginError] = useState("");
 const [pageError, setPageError] = useState("");
 const [showPassword, setShowPassword] = useState(false);

 async function loadRecords() {
  setLoading(true);
  setPageError("");

  try {
   const registrationsQuery = query(
    collection(db, "registrations"),
    orderBy("createdAt", "desc")
   );

   const snapshot = await getDocs(registrationsQuery);
   const data = snapshot.docs
   console.log(data)
   setRecords(
    snapshot.docs.map((item) => ({
     id: item.id,
     ...item.data(),
    }))
   );
  } catch (error) {
   console.error(error);
   setPageError(
    "Could not load registrations. Check your Firebase connection and Firestore security rules."
   );
  } finally {
   setLoading(false);
  }
 }

 async function handleLogin(event) {
  event.preventDefault();
  setLoading(true);
  setLoginError("");

  try {
   const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
   );

   setUser(credential.user);
   await loadRecords();
  } catch (error) {
   console.error(error);
   setLoginError(
    error.code === "auth/invalid-credential"
     ? "Incorrect email or password."
     : error.code === "auth/too-many-requests"
      ? "Too many attempts. Please try again later."
      : "Unable to sign in. Check your credentials and Firebase settings."
   );
  } finally {
   setLoading(false);
  }
 }

 async function handleLogout() {
  await signOut(auth);
  setUser(null);
  setRecords([]);
  setSelected(null);
 }

 const filteredRecords = useMemo(() => {
  return records.filter((record) => {
   const name = getName(record);
   const category = record.categoryId || "";
   const memberId = getMembershipId(record.id, category);
   const paymentStatus = getPaymentStatus(record);
   const haystack = [
    name,
    record.email,
    memberId,
    record.paymentReference,
    category,
   ].join(" ").toLowerCase();

   const matchesSearch = haystack.includes(search.toLowerCase());
   const matchesType = typeFilter === "all" || category === typeFilter;
   const matchesStatus =
    statusFilter === "all" ||
    paymentStatus.toLowerCase() === statusFilter;

   return matchesSearch && matchesType && matchesStatus;
  });
 }, [records, search, typeFilter, statusFilter]);

 const countType = (type) =>
  records.filter((record) => record.categoryId === type).length;

 const paidCount = records.filter(
  (record) => getPaymentStatus(record) === "Paid"
 ).length;

 const pendingCount = records.filter(
  (record) => getPaymentStatus(record) === "Pending"
 ).length;

 const completedCount = records.filter(
  (record) =>
   ["Paid", "Completed"].includes(getPaymentStatus(record))
 ).length;

 function exportCSV() {
  const columns = [
   "Applicant",
   "Email",
   "Membership Type",
   "Membership ID",
   "Payment Status",
   "Amount (NGN)",
   "Payment Reference",
   "Registration Date",
  ];

  const rows = filteredRecords.map((record) => [
   getName(record),
   record.email || "",
   TYPES[record.categoryId] || record.membershipType || record.categoryId,
   getMembershipId(record.id, record.categoryId),
   getPaymentStatus(record),
   Number(record.amount || 0) / 100,
   record.paymentReference || "",
   dateText(record.createdAt),
  ]);

  const csv = [columns, ...rows]
   .map((row) =>
    row.map((value) =>
     `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")
   )
   .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
   type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ATH-registration-records.csv";
  link.click();
  URL.revokeObjectURL(url);
 }

 if (!user) {
  return (
   <main className="flex min-h-screen bg-[#f4f7f1] text-[#0b1d17]">
    <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-[#0b2b20] p-12 text-white lg:flex">
     <div>
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#d9b648] text-xl font-black text-[#0b2b20]">
       ATH
      </div>
      <p className="mt-5 text-xs font-bold tracking-[0.22em] text-[#d9b648]">
       AGRO TRADE HUB AFRICA
      </p>
      <h1 className="mt-8 max-w-md text-5xl font-bold leading-tight">
       Growing connections. Building agriculture.
      </h1>
      <p className="mt-5 max-w-sm leading-7 text-white/70">
       Manage registrations, review membership records and keep your
       agribusiness community organised.
      </p>
     </div>

     <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
      <p className="text-sm font-semibold">Administrator access</p>
      <p className="mt-2 text-sm leading-6 text-white/65">
       Sign in with your authorised admin account to access membership
       records.
      </p>
     </div>

     <p className="text-xs text-white/45">
      © {new Date().getFullYear()} Agro Trade Hub Africa
     </p>
    </aside>

    <section className="flex flex-1 items-center justify-center px-5 py-12">
     <form
      onSubmit={handleLogin}
      className="w-full max-w-md"
     >
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-xl bg-[#143a30] text-lg font-black text-white lg:hidden">
       ATH
      </div>

      <p className="text-xs font-bold tracking-[0.2em] text-[#2b6558]">
       ADMINISTRATION
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight">
       Welcome back
      </h2>
      <p className="mt-3 text-sm leading-6 text-gray-500">
       Sign in to manage Agro Trade Hub Africa memberships.
      </p>

      <label className="mt-8 block text-sm font-semibold" htmlFor="adminEmail">
       Administrator email
      </label>
      <input
       id="adminEmail"
       type="email"
       autoComplete="username"
       required
       value={email}
       onChange={(event) => setEmail(event.target.value)}
       placeholder="admin@example.com"
       className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#2b6558] focus:ring-4 focus:ring-[#2b6558]/10"
      />

      <label className="mt-5 block text-sm font-semibold" htmlFor="adminPassword">
       Password
      </label>
      <div className="relative mt-2">
       <input
        id="adminPassword"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Enter your password"
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-20 outline-none transition focus:border-[#2b6558] focus:ring-4 focus:ring-[#2b6558]/10"
       />
       <button
        type="button"
        onClick={() => setShowPassword((value) => !value)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#2b6558]"
       >
        {showPassword ? "Hide" : "Show"}
       </button>
      </div>

      {loginError && (
       <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {loginError}
       </p>
      )}

      <button
       disabled={loading}
       className="mt-6 w-full rounded-xl bg-[#143a30] px-5 py-3.5 font-semibold text-white transition hover:bg-[#245342] disabled:opacity-60"
      >
       {loading ? "Signing in..." : "Access dashboard"}
      </button>

      <p className="mt-6 text-center text-xs leading-5 text-gray-400">
       Restricted to authorised administrators.
      </p>
     </form>
    </section>
   </main>
  );
 }

 return (
  <div className="min-h-screen bg-[#f4f7f1] text-[#14251d]">
   <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b2b20] text-white">
    <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
     <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d9b648] font-black text-[#0b2b20]">
       ATH
      </div>
      <div>
       <p className="text-sm font-bold">AGRO TRADE HUB AFRICA</p>
       <p className="mt-0.5 text-xs text-white/60">Administration</p>
      </div>
     </div>

     <div className="flex items-center gap-4">
      <span className="hidden max-w-52 truncate text-sm text-white/75 sm:block">
       {user.email}
      </span>
      <button
       onClick={handleLogout}
       className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
      >
       Logout
      </button>
     </div>
    </div>
   </header>

   <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
     <div>
      <p className="text-xs font-bold tracking-[0.2em] text-[#2b6558]">
       AGRO TRADE HUB AFRICA
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
       Membership dashboard
      </h1>
      <p className="mt-2 text-sm text-gray-500">
       Manage and review membership registrations.
      </p>
     </div>

     <div className="flex flex-wrap gap-3">
      <button
       onClick={loadRecords}
       disabled={loading}
       className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
      >
       {loading ? "Refreshing..." : "↻ Refresh"}
      </button>
      <button
       onClick={exportCSV}
       className="rounded-xl bg-[#143a30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245342]"
      >
       ↓ Export CSV
      </button>
     </div>
    </div>

    {pageError && (
     <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
      {pageError}
     </div>
    )}

    <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
     {[
      { label: "Total registrations", value: records.length, icon: "▦", color: "bg-white" },
      { label: "Paid registrations", value: paidCount, icon: "✓", color: "bg-emerald-50" },
      { label: "Pending payment", value: pendingCount, icon: "◷", color: "bg-amber-50" },
      { label: "Completed", value: completedCount, icon: "↗", color: "bg-[#e9f3ed]" },
     ].map((stat) => (
      <article key={stat.label} className={`rounded-2xl border border-gray-100 ${stat.color} p-5 shadow-sm`}>
       <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{stat.label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#2b6558] shadow-sm">
         {stat.icon}
        </span>
       </div>
       <p className="mt-4 text-3xl font-bold tracking-tight">
        {stat.value.toLocaleString()}
       </p>
      </article>
     ))}
    </section>

    <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
     {Object.entries(TYPES).map(([key, label]) => (
      <button
       key={key}
       onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
       className={`rounded-xl border p-4 text-left transition ${typeFilter === key
         ? "border-[#2b6558] bg-[#e9f3ed]"
         : "border-gray-100 bg-white hover:border-gray-300"
        }`}
      >
       <p className="text-xs text-gray-500">{label}</p>
       <p className="mt-2 text-xl font-bold">{countType(key)}</p>
      </button>
     ))}
    </section>

    <section className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
     <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
      <div>
       <h2 className="text-lg font-bold">Registration records</h2>
       <p className="mt-1 text-sm text-gray-500">
        Search, filter and inspect membership applications.
       </p>
      </div>
      <span className="rounded-full bg-[#e9f3ed] px-3 py-1.5 text-xs font-semibold text-[#245342]">
       {filteredRecords.length} records
      </span>
     </div>

     <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_220px_190px]">
      <input
       type="search"
       value={search}
       onChange={(event) => setSearch(event.target.value)}
       placeholder="Search name, email, membership ID..."
       className="min-w-0 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2b6558]"
      />

      <select
       value={typeFilter}
       onChange={(event) => setTypeFilter(event.target.value)}
       className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2b6558]"
      >
       <option value="all">All membership types</option>
       {Object.entries(TYPES).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
       ))}
      </select>

      <select
       value={statusFilter}
       onChange={(event) => setStatusFilter(event.target.value)}
       className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2b6558]"
      >
       <option value="all">All payment statuses</option>
       <option value="paid">Paid</option>
       <option value="completed">Completed</option>
       <option value="pending">Pending</option>
      </select>
     </div>

     <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left text-sm">
       <thead className="bg-[#f8faf7] text-xs uppercase tracking-wide text-gray-500">
        <tr>
         {["Applicant", "Membership type", "Email", "Membership ID", "Amount", "Payment", "Date", "Action"].map((heading) => (
          <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>
         ))}
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-100">
        {loading && records.length === 0 ? (
         <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-500">Loading registrations...</td></tr>
        ) : filteredRecords.length === 0 ? (
         <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-500">No registrations found.</td></tr>
        ) : filteredRecords.map((record) => {
         const category = record.categoryId || "";
         const memberId = getMembershipId(record.id, category);

         return (
          <tr key={record.id} className="transition hover:bg-[#fbfcfa]">
           <td className="px-5 py-4">
            <p className="font-semibold text-gray-900">{getName(record)}</p>
            <p className="mt-1 text-xs text-gray-400">{record.id}</p>
           </td>
           <td className="px-5 py-4">
            <span className="rounded-full bg-[#e9f3ed] px-2.5 py-1 text-xs font-medium text-[#245342]">
             {TYPES[category] || record.membershipType || category || "—"}
            </span>
           </td>
           <td className="px-5 py-4 text-gray-600">{record.email || "—"}</td>
           <td className="px-5 py-4 font-mono text-xs">{memberId}</td>
           <td className="px-5 py-4 whitespace-nowrap">{money(record.amount)}</td>
           <td className="px-5 py-4"><Status value={getPaymentStatus(record)} /></td>
           <td className="px-5 py-4 whitespace-nowrap text-gray-500">{dateText(record.createdAt)}</td>
           <td className="px-5 py-4">
            <button
             onClick={() => setSelected(record)}
             className="rounded-lg border border-[#b8d1c3] px-3 py-1.5 text-xs font-semibold text-[#245342] hover:bg-[#e9f3ed]"
            >
             View details
            </button>
           </td>
          </tr>
         );
        })}
       </tbody>
      </table>
     </div>

     <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
      Showing {filteredRecords.length} of {records.length} registrations
     </div>
    </section>
   </main>

   {selected && (
    <div
     className="fixed inset-0 z-40 flex items-center justify-center bg-[#071a12]/60 p-4"
     onMouseDown={(event) => {
      if (event.target === event.currentTarget) setSelected(null);
     }}
    >
     <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <header className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white p-5 sm:p-6">
       <div>
        <p className="text-xs font-bold tracking-[0.18em] text-[#2b6558]">
         REGISTRATION DETAILS
        </p>
        <h2 className="mt-2 text-xl font-bold">
         {getName(selected)}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
         {getMembershipId(selected.id, selected.categoryId)}
        </p>
       </div>
       <button
        onClick={() => setSelected(null)}
        aria-label="Close details"
        className="rounded-lg px-3 py-1 text-2xl text-gray-400 hover:bg-gray-100"
       >
        ×
       </button>
      </header>

      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
       {[
        ["Full name", getName(selected)],
        ["Email", selected.email || "—"],
        ["Membership type", TYPES[selected.categoryId] || selected.membershipType || "—"],
        ["Payment status", getPaymentStatus(selected)],
        ["Amount", money(selected.amount)],
        ["Registration date", dateText(selected.createdAt)],
        ["Payment reference", selected.paymentReference || "—"],
        ["Document status", selected.documentStatus || "Not generated"],
       ].map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-xl bg-[#f8faf7] p-4">
         <p className="text-xs text-gray-500">{label}</p>
         <p className="mt-2 break-words text-sm font-semibold text-gray-900">{value}</p>
        </div>
       ))}
      </div>

      <div className="border-t border-gray-100 p-5 sm:p-6">
       <h3 className="font-bold">Uploaded documents</h3>
       <p className="mt-1 text-sm text-gray-500">
        Files are shown when their Cloudinary URLs are saved in the registration.
       </p>

       <div className="mt-4 space-y-2">
        {Object.entries(selected.applicant || {})
         .filter(([, value]) =>
          value &&
          typeof value === "object" &&
          typeof value.url === "string" &&
          /^https?:\/\//i.test(value.url)
         )
         .map(([key, file]) => (
          <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
           <div className="min-w-0">
            <p className="break-words text-sm font-semibold">
             {file.name || key.replace(/[-_]/g, " ")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
             {file.format || "Uploaded file"}
            </p>
           </div>
           <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-[#143a30] px-3 py-2 text-xs font-semibold text-white hover:bg-[#245342]"
           >
            Open file ↗
           </a>
          </div>
         ))}

        {!Object.values(selected.applicant || {}).some(
         (value) =>
          value &&
          typeof value === "object" &&
          typeof value.url === "string" &&
          /^https?:\/\//i.test(value.url)
        ) && (
          <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
           No uploaded documents found for this registration.
          </p>
         )}
       </div>
      </div>

      <footer className="flex justify-end border-t border-gray-100 p-5">
       <button
        onClick={() => setSelected(null)}
        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
       >
        Close
       </button>
      </footer>
     </section>
    </div>
   )}
  </div>
 );
}