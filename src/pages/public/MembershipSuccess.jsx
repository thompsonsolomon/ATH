
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { db } from "../../services/firebase";

const MEMBERSHIP_PREFIXES = {
  farmer: "FRM",
  "cooperative-new": "NCOOP",
  "cooperative-old": "COOP",
  partner: "PTR",
  investor: "INV",
};

function getApplicantName(applicant = {}) {
  return (
    applicant.fullName ||
    applicant.full_name ||
    applicant.name ||
    [applicant.firstName, applicant.lastName].filter(Boolean).join(" ") ||
    [applicant.first_name, applicant.last_name].filter(Boolean).join(" ") ||
    "Member"
  );
}

function getMembershipId(registrationId, category) {
  const prefix = MEMBERSHIP_PREFIXES[category] || "ATH";
  const suffix = registrationId.slice(-8).toUpperCase();
  return `${prefix}-${suffix}`;
}

function formatAmount(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0) / 100);
}

export default function MembershipSuccess() {
  const [registration, setRegistration] = useState(null);
  const [membershipId, setMembershipId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");

  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  const registrationId = params.get("registrationId");
  const reference = params.get("reference");

  useEffect(() => {
    let cancelled = false;

    async function loadRegistration() {
      if (paymentStatus !== "success" || !registrationId || !reference) {
        setError(
          paymentStatus === "failed"
            ? "Your payment could not be verified. Please contact Agro Trade Hub Africa for assistance."
            : "We couldn't confirm this payment. Please use the payment link again or contact support."
        );
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "registrations", registrationId));

        if (!snapshot.exists()) {
          throw new Error("Registration not found.");
        }

        const data = snapshot.data();

        // Ensure the payment reference belongs to this registration.
        // The server must verify the reference with Paystack.
        if (
          data.paymentReference &&
          data.paymentReference !== reference
        ) {
          throw new Error("The payment reference does not match this registration.");
        }

        if (cancelled) return;

        setRegistration(data);
        setMembershipId(getMembershipId(registrationId, data.categoryId));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your registration.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRegistration();

    return () => {
      cancelled = true;
    };
  }, [paymentStatus, registrationId, reference]);

  async function downloadCertificate() {
    if (!registration || !membershipId) return;

    setDownloading("certificate");

    try {
      const name = getApplicantName(registration.applicant);
      const pdf = new jsPDF("landscape", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();

      pdf.setFillColor(11, 29, 23);
      pdf.rect(0, 0, width, height, "F");

      pdf.setDrawColor(217, 182, 72);
      pdf.setLineWidth(1.2);
      pdf.rect(10, 10, width - 20, height - 20);

      pdf.setTextColor(217, 182, 72);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("AGRO TRADE HUB AFRICA", width / 2, 30, {
        align: "center",
      });

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(29);
      pdf.text("MEMBERSHIP CERTIFICATE", width / 2, 54, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.text("This is to certify that", width / 2, 75, {
        align: "center",
      });

      pdf.setTextColor(217, 182, 72);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(25);
      pdf.text(name, width / 2, 91, {
        align: "center",
        maxWidth: width - 50,
      });

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(
        `has been registered as a ${registration.membershipType || "member"} of Agro Trade Hub Africa.`,
        width / 2,
        106,
        { align: "center", maxWidth: width - 45 }
      );

      pdf.setFontSize(11);
      pdf.text(`Membership ID: ${membershipId}`, width / 2, 124, {
        align: "center",
      });

      pdf.text(
        `Date issued: ${new Date().toLocaleDateString("en-NG")}`,
        width / 2,
        134,
        { align: "center" }
      );

      pdf.setTextColor(217, 182, 72);
      pdf.setFontSize(9);
      pdf.text(
        "Connecting Farmers, Cooperatives & Agribusiness",
        width / 2,
        height - 23,
        { align: "center" }
      );

      pdf.save(`ATH-Membership-Certificate-${membershipId}.pdf`);
    } catch (err) {
      alert("Could not generate the certificate. Please try again.");
      console.error(err);
    } finally {
      setDownloading("");
    }
  }


  console.log(registration)

  async function downloadFarmerIdCard() {
    if (!registration || registration.categoryId !== "farmer") return;

    setDownloading("id");

    try {
      const name =
        registration.name ||
        registration["business-name"] ||
        getApplicantName(registration.applicant);

      const memberId =
        registration.membershipId ||
        registration.documents?.farmerIdCard?.membershipId ||
        membershipId;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [86, 54],
      });

      const width = 86;
      const height = 54;

      const verificationUrl = new URL(
        "/verify-membership",
        window.location.origin
      );

      // Use the actual Firestore document ID for verification.
      verificationUrl.searchParams.set("id", registrationId);

      const qrCode = await QRCode.toDataURL(
        verificationUrl.toString(),
        {
          width: 300,
          margin: 1,
          errorCorrectionLevel: "H",
        }
      );

      // Card background
      pdf.setFillColor(244, 247, 241);
      pdf.rect(0, 0, width, height, "F");

      // Dark green header
      pdf.setFillColor(11, 61, 51);
      pdf.rect(0, 0, width, 12, "F");

      // Organisation name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(200, 234, 128);
      pdf.text("AGRO TRADE HUB AFRICA", width / 2, 5.2, {
        align: "center",
      });

      // Card title
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(255, 255, 255);
      pdf.text("OFFICIAL FARMER MEMBERSHIP ID", width / 2, 9.3, {
        align: "center",
      });

      // Photo area
      const photoX = 4;
      const photoY = 17;
      const photoW = 22;
      const photoH = 25;

      pdf.setFillColor(222, 232, 225);
      pdf.rect(photoX, photoY, photoW, photoH, "F");

      // Use a saved applicant photo if one exists.
      const photoUrl =
        registration.applicant?.["passport-photo"]?.[0]?.url ||
        registration.applicant?.passportPhoto?.[0]?.url ||
        registration.photoURL ||
        registration.passportPhotoUrl ||
        registration.passportPhoto ||
        registration["passport-photo"]?.[0]?.url ||
        registration.documents?.passportPhoto?.url ||
        "";

      let photoAdded = false;

      if (typeof photoUrl === "string" && photoUrl.startsWith("http")) {
        try {
          const response = await fetch(photoUrl);

          if (!response.ok) {
            throw new Error("Could not load member photo");
          }

          const blob = await response.blob();

          const photoData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const format = String(photoData).startsWith("data:image/png")
            ? "PNG"
            : "JPEG";

          pdf.addImage(
            photoData,
            format,
            photoX,
            photoY,
            photoW,
            photoH,
            undefined,
            "FAST"
          );

          photoAdded = true;
        } catch (photoError) {
          console.warn("Member photo could not be loaded:", photoError);
        }
      }

      // Fallback when no photo is saved or the image cannot load.
      if (!photoAdded) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6);
        pdf.setTextColor(79, 99, 87);
        pdf.text("PHOTO", photoX + photoW / 2, photoY + photoH / 2, {
          align: "center",
        });
      }

      // Member name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(11, 61, 51);

      pdf.text(name.toUpperCase(), 30, 19.8, {
        maxWidth: 51,
      });

      // Membership category
      pdf.setFontSize(7.5);
      pdf.setTextColor(32, 148, 107);
      pdf.text("FARMER MEMBER", 30, 25.8);

      // Membership ID label
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.3);
      pdf.setTextColor(79, 79, 79);
      pdf.text("MEMBERSHIP ID", 30, 31.3);

      // Actual membership ID from Firestore
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.2);
      pdf.setTextColor(11, 29, 23);
      pdf.text(memberId, 30, 35.2, {
        maxWidth: 34,
      });

      // State
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.3);
      pdf.setTextColor(79, 79, 79);
      pdf.text("STATE", 30, 41);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(11, 29, 23);
      pdf.text(registration.applicant.state || "N/A", 40, 41);

      // QR code on the right
      pdf.addImage(qrCode, "PNG", 66, 23, 15, 15);

      // Footer
      pdf.setFillColor(11, 61, 51);
      pdf.rect(0, 47, width, 7, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.8);
      pdf.setTextColor(255, 255, 255);

      pdf.text(
        "Registered Farmer Member • Agro Trade Hub Africa",
        width / 2,
        51.3,
        { align: "center" }
      );

      pdf.save(`ATH-Farmer-ID-${memberId}.pdf`);
    } catch (err) {
      console.error("Farmer ID generation failed:", err);
      alert("Could not generate the ID card. Please try again.");
    } finally {
      setDownloading("");
    }
  }


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f1] px-5">
        <p className="text-sm text-[#143a30]">Loading your membership...</p>
      </main>
    );
  }

  if (error || !registration) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7f1] px-5 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
            !
          </div>
          <h1 className="text-2xl font-bold text-[#0b1d17]">
            We couldn't confirm your payment
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">{error}</p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-lg bg-[#143a30] px-5 py-3 text-sm font-semibold text-white hover:bg-[#245342]"
          >
            Return to homepage
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f1] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2b6558]">
            Agro Trade Hub Africa
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0b1d17] sm:text-4xl">
            Welcome to the community!
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
            Your payment was verified by our payment server. Your membership
            details are below.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">Membership ID</p>
              <p className="mt-1 text-2xl font-bold tracking-wide text-[#143a30]">
                {membershipId}
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Payment verified
            </span>
          </div>

          <div className="grid gap-5 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Member name</p>
              <p className="mt-1 font-semibold text-gray-900">
                {getApplicantName(registration.applicant)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Membership type</p>
              <p className="mt-1 font-semibold text-gray-900">
                {registration.membershipType || "Membership"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Registration email</p>
              <p className="mt-1 break-all font-medium text-gray-900">
                {registration.email || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Registration fee</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatAmount(registration.amount)}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500">Payment reference</p>
              <p className="mt-1 break-all font-mono text-xs text-gray-700">
                {reference}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-bold text-[#0b1d17]">
              Your membership documents
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Download and save your documents for your records.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={downloadCertificate}
                disabled={Boolean(downloading)}
                className="flex items-center justify-center gap-3 rounded-xl bg-[#143a30] px-5 py-4 text-left text-white transition hover:bg-[#245342] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="text-xl">↓</span>
                <span>
                  <span className="block text-sm font-semibold">
                    {downloading === "certificate"
                      ? "Preparing PDF..."
                      : "Download certificate"}
                  </span>
                  <span className="mt-1 block text-xs text-white/70">
                    PDF document
                  </span>
                </span>
              </button>

              {registration.categoryId === "farmer" && (
                <button
                  type="button"
                  onClick={downloadFarmerIdCard}
                  disabled={Boolean(downloading)}
                  className="flex items-center justify-center gap-3 rounded-xl border border-[#dce7df] bg-white px-5 py-4 text-left text-[#143a30] transition hover:bg-[#f7faf7] disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="text-xl">↓</span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {downloading === "id"
                        ? "Preparing ID card..."
                        : "Download farmer ID card"}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PDF with QR code
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-gray-500">
          Keep your membership ID safe. For assistance, contact Agro Trade Hub
          Africa through the official website.
        </p>
      </div>
    </main>
  );
}
