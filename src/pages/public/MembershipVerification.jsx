
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

const formatDate = (timestamp) => {
  if (!timestamp) return "Not available";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

export default function MembershipVerification() {
  const [searchParams] = useSearchParams();
  const registrationId = searchParams.get("id");

  const [member, setMember] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    async function verifyMembership() {
      if (!registrationId) {
        setStatus("invalid");
        return;
      }

      try {
        // The QR code's id must be the Firestore registration document ID.
        const snapshot = await getDoc(
          doc(db, "registrations", registrationId)
        );

        if (!active) return;

        if (!snapshot.exists()) {
          setStatus("invalid");
          return;
        }

        const data = snapshot.data();

        // Only paid memberships are considered verified.
        if (data.paymentStatus !== "paid") {
          setMember(data);
          setStatus("pending");
          return;
        }

        setMember({
          name: data.applicantName || data.applicant?.fullName || "Member",
          membershipType: data.membershipType || "Member",
          membershipId:
            data.membershipId ||
            `${String(data.categoryId || "MEM").toUpperCase()}-${registrationId.slice(-8).toUpperCase()}`,
          categoryId: data.categoryId,
          createdAt: data.createdAt,
        });

        setStatus("verified");
      } catch (error) {
        console.error("Membership verification failed:", error);
        if (active) setStatus("error");
      }
    }

    verifyMembership();

    return () => {
      active = false;
    };
  }, [registrationId]);

  const isVerified = status === "verified";

  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#0b1d17]">
      <header className="bg-[#0b1d17] px-5 py-6 text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d9b648] font-black text-[#0b1d17]">
            ATH
          </div>
          <div>
            <h1 className="font-bold tracking-wide">
              AGRO TRADE HUB AFRICA
            </h1>
            <p className="text-sm text-white/65">
              Membership Verification Portal
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2b6558]">
            Official Member Records
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Membership Verification
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Confirm the authenticity and current payment status of an
            Agro Trade Hub Africa membership.
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xl shadow-[#0b1d17]/5">
          <div
            className={`px-6 py-5 text-white ${
              isVerified
                ? "bg-[#176b43]"
                : status === "pending" ||
                    status === "loading"
                  ? "bg-[#8b6713]"
                  : "bg-[#a52d2d]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl">
                {status === "loading"
                  ? "…"
                  : isVerified
                    ? "✓"
                    : status === "pending"
                      ? "!"
                      : "×"}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/75">
                  Verification Result
                </p>
                <h3 className="mt-1 text-xl font-bold">
                  {status === "loading" && "Checking membership..."}
                  {isVerified && "Verified Member"}
                  {status === "pending" && "Payment Not Verified"}
                  {status === "invalid" && "Invalid Membership"}
                  {status === "error" && "Verification Unavailable"}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {status === "loading" && (
              <div className="space-y-4 py-8">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dce9df] border-t-[#176b43]" />
                <p className="text-center text-sm text-gray-500">
                  Checking the official membership record.
                </p>
              </div>
            )}

            {isVerified && member && (
              <>
                <div className="mb-7 rounded-2xl border border-[#dce9df] bg-[#f4f7f1] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Member Name
                  </p>
                  <h4 className="mt-2 text-2xl font-bold">
                    {member.name}
                  </h4>
                  <p className="mt-2 text-sm text-[#2b6558]">
                    {member.membershipType}
                  </p>
                </div>

                <div className="space-y-5">
                  <Detail label="Membership ID" value={member.membershipId} />
                  <Detail
                    label="Membership Category"
                    value={member.membershipType}
                  />
                  <Detail
                    label="Registration Date"
                    value={formatDate(member.createdAt)}
                  />
                  <Detail label="Payment Status" value="Paid" green />
                  <Detail
                    label="Issuing Organization"
                    value="Agro Trade Hub Africa"
                  />
                </div>

                <div className="mt-8 rounded-xl border border-[#b8dfc6] bg-[#edf8f0] p-4 text-sm leading-6 text-[#176b43]">
                  This membership record exists in our system and its
                  payment status is confirmed as paid. This verification
                  does not independently confirm the holder's physical
                  identity.
                </div>
              </>
            )}

            {status === "pending" && (
              <div className="py-6 text-center">
                <p className="font-semibold">
                  This membership is not currently verified.
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Payment has not been confirmed in the official records.
                  Please contact Agro Trade Hub Africa for clarification.
                </p>
              </div>
            )}

            {status === "invalid" && (
              <div className="py-6 text-center">
                <p className="font-semibold">
                  No matching membership record was found.
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This QR code may be invalid or the membership record
                  may no longer be available.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="py-6 text-center">
                <p className="font-semibold">
                  We could not verify this membership right now.
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Please check your connection and try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-5 rounded-xl bg-[#0b1d17] px-5 py-3 text-sm font-semibold text-white hover:bg-[#143a30]"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-gray-500">
          Need assistance? Contact Agro Trade Hub Africa through its
          official communication channels.
        </p>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-sm font-semibold text-[#2b6558] hover:underline"
          >
            ← Back to Website
          </Link>
        </div>
      </main>

      <footer className="border-t border-black/5 px-5 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Agro Trade Hub Africa. Official
        Membership Verification.
      </footer>
    </div>
  );
}

function Detail({ label, value, green = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`max-w-[60%] break-words text-right text-sm font-semibold ${
          green ? "text-[#176b43]" : "text-[#0b1d17]"
        }`}
      >
        {value || "Not available"}
      </span>
    </div>
  );
}
