/* eslint-disable react-refresh/only-export-components */
import { useRef, useState } from "react";
import {
  ArrowRight, ArrowLeft, Check, 
  FileText, Upload,
  X, UserRound, MapPin, BriefcaseBusiness, ClipboardCheck,
} from "lucide-react";
import { handleRegistration } from "../hooks/handleRegistration";


function Field({ config, value, onChange }) {
  const [label, name, type = "text", required = false, extra, accept, multiple, hint, min, step] = config;
  const options = type === "select" ? extra : null;
  const placeholder = type !== "select" && type !== "file" ? extra : undefined;
  const fileNames = value && type === "file"
    ? Array.from(value).map(file => file.name).join(", ")
    : "";

  const common = {
    name,
    required,
    className: "mt-2 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#267653] focus:ring-4 focus:ring-[#267653]/10",
    onChange: event => onChange(name, type === "file" ? event.target.files : event.target.value),
    ...(type === "number" && min ? { min } : {}),
    ...(type === "number" && step ? { step } : {}),
  };

  return (
    <label className="block min-w-0 text-sm font-medium text-gray-700">
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      {hint && <span className="mt-1 block text-xs font-normal leading-relaxed text-gray-500">{hint}</span>}
      {options ? (
        <select {...common} value={value || ""}>
          <option value="">Select an option</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea {...common} rows={4} placeholder={placeholder} value={value || ""} />
      ) : type === "file" ? (
        <span className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 transition hover:border-[#267653]">
          <Upload size={20} className="shrink-0 text-[#267653]" />
          <span className="min-w-0 flex-1 break-words text-sm text-gray-600">
            {fileNames || `Choose file${multiple ? "(s)" : ""}`}
          </span>
          <input {...common} type="file" accept={accept} multiple={multiple} className="sr-only" />
        </span>
      ) : (
        <input {...common} type={type} placeholder={placeholder} value={value || ""} />
      )}
    </label>
  );
}

function Progress({ current, total }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium text-gray-500">
        <span>Step {current + 1} of {total}</span>
        <span>{Math.round(((current + 1) / total) * 100)}% complete</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: total }, (_, index) => (
          <div key={index} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= current ? "bg-[#267653]" : "bg-gray-200"}`} />
        ))}
      </div>
    </div>
  );
}

function RegistrationWizard({ category, onClose }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);
  const review = step === category.steps.length;
  const activeStep = category.steps[step];

  function updateValue(name, value) {
    setValues(previous => ({ ...previous, [name]: value }));
    setError("");
  }


function validateCurrentStep() {
  const controls = Array.from(
    formRef.current.querySelectorAll(
      "input, select, textarea"
    )
  ).filter((control) => {
    return (
      control.closest("[data-step-field]") &&
      !control.disabled
    );
  });

  for (const control of controls) {
    if (!control.checkValidity()) {
      control.reportValidity();
      return false;
    }

    if (control.type === "file" && control.files?.length) {
      let maxSize = Infinity;

      if (control.name === "passport-photo" || control.name === "logo") {
        maxSize = 5 * 1024 * 1024;
      } else if (control.name === "identity-document") {
        maxSize = 10 * 1024 * 1024;
      }

      for (const file of control.files) {
        if (file.size > maxSize) {
          setError(
            `${file.name} exceeds the allowed ${
              maxSize / 1024 / 1024
            } MB file size.`
          );
          return false;
        }
      }
    }
  }

  setError("");
  return true;
}


  function nextStep(event) {
    event.preventDefault();
    if (!validateCurrentStep()) return;
    setError("");
    setStep(current => current + 1);
  }

 
async function submitApplication(event) {
  event.preventDefault();

  setError("");

  if (category.id === "sponsor") {
    setSubmitted(true);
    setError(
      "Sponsor applications require a discussion with our team. Please use the contact link below to arrange sponsorship."
    );
    return;
  }

  try {
    setSubmitted(false);

    await handleRegistration({
      category,
      values, // Replace with your actual form state variable.
      onStatus: (message) => {
        console.log(message);
        // Optional: setStatus(message) if you have a status state.
      },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    setError(
      error.message || "Registration failed. Please try again."
    );
  }
}
  const icons = [UserRound, MapPin, BriefcaseBusiness, Upload, ClipboardCheck];
  const StepIcon = review ? ClipboardCheck : icons[step] || FileText;

  return (
    <section id="registration-form" className="scroll-mt-24 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-900/5">
      <header className="flex items-start justify-between gap-4 bg-[#0d3025] p-5 text-white sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d7e7a5]">Membership application</p>
          <h3 className="mt-2 text-xl font-semibold sm:text-2xl">{category.name}</h3>
          <p className="mt-2 text-sm text-white/70">Registration fee: {category.fee}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close form" className="rounded-full border border-white/20 p-2 hover:bg-white/10">
          <X size={19} />
        </button>
      </header>

      <form ref={formRef} noValidate onSubmit={review ? submitApplication : nextStep} className="p-5 sm:p-8">
        <Progress current={step} total={category.steps.length + 1} />

        <div className="mt-7 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4e5] text-[#267653]">
            <StepIcon size={21} />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#17372b]">
              {review ? "Review your application" : activeStep.title}
            </h4>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {review ? "Check your details before proceeding." : activeStep.subtitle}
            </p>
          </div>
        </div>

        {!review ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {activeStep.fields.map(config => (
              <div key={config[1]} className={config[2] === "textarea" || config[2] === "file" ? "sm:col-span-2" : ""} data-step-field>
                <Field config={config} value={values[config[1]]} onChange={updateValue} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            {category.steps.map(section => (
              <div key={section.title} className="rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="font-semibold text-[#17372b]">{section.title}</h5>
                  <button type="button" onClick={() => setStep(category.steps.indexOf(section))} className="text-sm font-semibold text-[#267653] hover:underline">Edit</button>
                </div>
                <div className="mt-4 divide-y divide-gray-100">
                  {section.fields.map(config => {
                    const [, name, type] = config;
                    const value = values[name];
                    const display = type === "file" && value
                      ? Array.from(value).map(file => file.name).join(", ")
                      : value || "Not provided";
                    return (
                      <div key={name} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-5">
                        <span className="text-sm text-gray-500">{config[0]}</span>
                        <span className="break-words text-sm font-medium text-gray-800 sm:max-w-[60%] sm:text-right">{display}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="rounded-2xl bg-[#f5f7f0] p-4">
              <p className="font-semibold text-[#17372b]">Registration fee</p>
              <p className="mt-1 text-xl font-semibold">{category.fee}</p>
              <p className="mt-2 text-xs leading-5 text-gray-500">Review the applicable payment and refund terms before paying.</p>
            </div>
          </div>
        )}

        {error && (
          <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {error}
            {category.id === "sponsor" && (
              <a className="mt-2 block font-semibold underline" href="mailto:agrotradehubs@gmail.com?subject=Sponsorship%20enquiry">Contact Agro Trade Hub</a>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => step === 0 ? onClose() : (setStep(current => current - 1), setError(""))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ArrowLeft size={17} /> {step === 0 ? "Cancel" : "Previous"}
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            {category.downloads.map((url, index) => (
              <a key={url} href={url} download className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <FileText size={17} /> {category.downloadNames[index]}
              </a>
            ))}
            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176b45] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#105438]">
              {review ? (category.id === "sponsor" ? "Contact our team" : "Proceed to Pay") : "Save and continue"}
              {review ? <Check size={17} /> : <ArrowRight size={17} />}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default RegistrationWizard
