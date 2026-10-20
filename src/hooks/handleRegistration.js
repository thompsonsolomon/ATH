import {
  initializeApp,
  getApps,
} from "firebase/app";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// --------------------------------------------------
// FIREBASE CONFIGURATION
// --------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const db = getFirestore(app);

// --------------------------------------------------
// ENVIRONMENT VARIABLES
// --------------------------------------------------

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const BACKEND_URL =
  import.meta.env.VITE_REGISTRATION_FUNCTION_URL;

// --------------------------------------------------
// MEMBERSHIP FEES — AMOUNTS IN KOBO
// --------------------------------------------------

const FEES = {
  farmer: 300000,
  "cooperative-new": 5000000,
  "cooperative-old": 2500000,
  partner: 20000000,
  investor: 50000000,
};

const MEMBERSHIP_NAMES = {
  farmer: "Farmer Membership",
  "cooperative-new": "New Cooperative Membership",
  "cooperative-old": "Existing Cooperative Membership",
  partner: "Partnership Membership",
  investor: "Investor Membership",
};

// --------------------------------------------------
// FORM HELPERS
// --------------------------------------------------

function getEmail(values) {
  const entry = Object.entries(values).find(
    ([key, value]) =>
      /email/i.test(key) &&
      typeof value === "string" &&
      value.trim() !== ""
  );

  return String(
    values.email ||
    values.emailAddress ||
    values["email-address"] ||
    entry?.[1] ||
    ""
  ).trim();
}

function getApplicantName(values) {
  return (
    values.fullName ||
    values.full_name ||
    values.name ||
    [values.firstName, values.lastName]
      .filter(Boolean)
      .join(" ") ||
    [values.first_name, values.last_name]
      .filter(Boolean)
      .join(" ") ||
    ""
  ).trim();
}

// --------------------------------------------------
// CLOUDINARY FILE UPLOAD
// --------------------------------------------------

async function uploadFile(file) {
  if (!(file instanceof File)) {
    return file;
  }

  const body = new FormData();

  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.message ||
      `Failed to upload ${file.name}.`
    );
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    name: file.name,
    format: result.format,
    resourceType: result.resource_type,
  };
}

async function uploadValues(values) {
  const uploaded = {};

  for (const [key, value] of Object.entries(values)) {
    if (value instanceof FileList) {
      uploaded[key] = await Promise.all(
        Array.from(value).map(uploadFile)
      );
    } else if (value instanceof File) {
      uploaded[key] = await uploadFile(value);
    } else {
      uploaded[key] = value;
    }
  }

  return uploaded;
}

// --------------------------------------------------
// MAIN REGISTRATION HANDLER
// --------------------------------------------------

export async function handleRegistration({
  category,
  values,
  onStatus,
}) {
  if (!category?.id || !values) {
    throw new Error("Registration details are missing.");
  }

  if (category.id === "sponsor") {
    throw new Error(
      "Please contact Agro Trade Hub to discuss sponsorship."
    );
  }

  const amount = FEES[category.id];

  if (!amount) {
    throw new Error(
      `No registration fee is configured for "${category.id}".`
    );
  }

  const email = getEmail(values);
  const applicantName = getApplicantName(values);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Registration form values:", values);

    throw new Error(
      "Please provide a valid email address in the registration form."
    );
  }

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_UPLOAD_PRESET ||
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !BACKEND_URL
  ) {
    throw new Error(
      "Configuration is incomplete. Check your frontend .env file."
    );
  }

  // 1. Upload applicant documents to Cloudinary.
  onStatus?.("Uploading your documents...");

  const applicant = await uploadValues(values);

  // 2. Create a pending registration in Firestore.
  onStatus?.("Saving your registration...");

  const registrationRef = await addDoc(
    collection(db, "registrations"),
    {
      applicant,
      applicantName,
      email,
      categoryId: category.id,
      membershipType: MEMBERSHIP_NAMES[category.id],
      amount,
      currency: "NGN",
      paymentStatus: "pending",
      paymentReference: null,
      documentStatus: "not_generated",
      createdAt: serverTimestamp(),
    }
  );

  // 3. Redirect to the backend to initiate Paystack.
  onStatus?.("Redirecting to secure payment...");

const paymentUrl = new URL(
  `/api/payment/${encodeURIComponent(registrationRef.id)}`,
  BACKEND_URL
);


  paymentUrl.searchParams.set("email", email);
  paymentUrl.searchParams.set("category", category.id);

  window.location.assign(paymentUrl.toString());

  return {
    success: true,
    redirected: true,
    registrationId: registrationRef.id,
  };
}

export { FEES, MEMBERSHIP_NAMES };
