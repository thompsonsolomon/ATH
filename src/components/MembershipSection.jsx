
import {  useState } from "react";
import {
  ArrowRight,  CheckCircle2, Sprout, Users,
  Building2, Handshake, Wallet, ShieldCheck, 
} from "lucide-react";
import RegistrationWizard from "./RegistrationWizard";
import { benefits, categories } from "../services/data";


export default function Membership() {
  const [activeCategory, setActiveCategory] = useState(null);
  const selected = categories.find(category => category.id === activeCategory);

  function chooseCategory(id) {
    setActiveCategory(id);
    requestAnimationFrame(() => {
      document.getElementById("register")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-[#17372b]">
      <section className="relative overflow-hidden bg-[#0c3025]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#a5c86c]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_.8fr] lg:gap-16 lg:px-12 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[.17em] text-[#d9e8a9]">
              <Sprout size={15} /> Membership
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Membership built for how you work the land.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">Join a network connecting farmers, cooperatives, agribusinesses and investors with practical support and agricultural opportunities.</p>
            <a href="#membership-options" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#dce9ae] px-6 py-3 text-sm font-semibold text-[#163a2a] hover:bg-white">Explore membership <ArrowRight size={18} /></a>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
            <p className="text-sm text-white/60">Grow with a stronger network</p>
            {[
              [Sprout, "Farmers", "Practical support for individual growers and smallholders."],
              [Users, "Cooperatives", "Stronger connections for organised farmer groups."],
              [Handshake, "Partners and investors", "Opportunities across the agricultural value chain."],
            ].map(([Icon, title, description]) => (
              <div key={title} className="mt-6 flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dce9ae]/10 text-[#dce9ae]"><Icon size={21} /></div>
                <div><h2 className="font-semibold text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-white/60">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#39815a]">Find your place</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Who can join Agro Trade Hub?</h2>
          <p className="mt-4 max-w-2xl leading-7 text-gray-600">We bring people across the agricultural value chain together to improve access to resources, knowledge, markets and opportunities.</p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [Sprout, "Farmers", "Smallholders and commercial growers of rice, maize, yam, plantain, cassava, cocoa and other crops."],
              [Users, "Cooperatives", "Registered societies and farmer groups coordinating on behalf of their members."],
              [Building2, "Agribusinesses", "Processors, input suppliers, logistics providers and commercial partners."],
            ].map(([Icon, title, description]) => (
              <article key={title} className="rounded-2xl border border-gray-200 p-6 transition hover:-translate-y-1 hover:border-[#b5cdb7] hover:shadow-lg sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4e5] text-[#267653]"><Icon size={23} /></div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f7f0] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#39815a]">Your membership</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">More than a membership card.</h2><p className="mt-4 max-w-xl leading-7 text-gray-600">Become part of a network designed to connect agricultural communities with practical support and new opportunities.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map(benefit => <div key={benefit} className="flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-white p-4"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#39815a]" /><p className="text-sm leading-6 text-gray-700">{benefit}</p></div>)}
          </div>
        </div>
      </section>

      <section id="membership-options" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#39815a]">Choose your pathway</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Membership categories</h2><p className="mt-4 leading-7 text-gray-600">Choose the category that best describes you or your organisation to view its application steps.</p></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ id, name, description, fee, icon: Icon, steps }, index) => (
              <article key={id} className={`flex flex-col rounded-3xl border p-6 sm:p-7 ${index === 3 ? "border-[#276e4a] bg-[#10382a] text-white" : "border-gray-200 bg-white"}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 3 ? "bg-white/10 text-[#dce9ae]" : "bg-[#edf4e5] text-[#267653]"}`}><Icon size={23} /></div>
                <h3 className="mt-5 text-xl font-semibold">{name}</h3>
                <p className={`mt-3 flex-1 text-sm leading-7 ${index === 3 ? "text-white/70" : "text-gray-600"}`}>{description}</p>
                <div className={`mt-6 border-t pt-5 ${index === 3 ? "border-white/15" : "border-gray-100"}`}><p className="text-xs uppercase tracking-wider opacity-60">Registration fee</p><p className="mt-1 text-2xl font-semibold">{fee}</p><p className="mt-2 text-xs opacity-60">{steps.length + 1} short steps, including review</p></div>
                <button type="button" onClick={() => chooseCategory(id)} className={`mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${index === 3 ? "bg-[#dce9ae] text-[#17372b] hover:bg-white" : "bg-[#176b45] text-white hover:bg-[#105438]"}`}>Apply now <ArrowRight size={17} /></button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-gray-200">
          <div className="flex items-center gap-3 bg-[#0d3025] p-6 text-white sm:p-8"><Wallet className="text-[#dce9ae]" size={24} /><div><h2 className="text-xl font-semibold sm:text-2xl">Registration fees</h2><p className="mt-1 text-sm text-white/60">Published registration fee schedule</p></div></div>
          {[
            ["Farmer membership", "₦3,000"],
            ["New cooperative / group registration", "₦50,000"],
            ["Cooperative revalidation", "₦25,000"],
            ["Partner membership", "₦200,000"],
            ["Investor membership", "₦500,000 – ₦10,000,000+"],
            ["Sponsor membership", "Contact us"],
          ].map(([label, amount]) => <div key={label} className="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 last:border-0 sm:flex-row sm:justify-between sm:gap-4 sm:px-8"><span className="text-sm text-gray-600">{label}</span><span className="font-semibold">{amount}</span></div>)}
        </div>
      </section>

      <section id="register" className="scroll-mt-20 bg-[#f5f7f0] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#39815a]">Take the next step</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Start your membership application.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-gray-600">Select a membership type. We'll guide you through the form one short section at a time.</p>

          <div className="mt-7 rounded-2xl border border-[#dce6c9] bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3"><ShieldCheck size={22} className="mt-0.5 shrink-0 text-[#267653]" /><div><h3 className="font-semibold">Before you register</h3><p className="mt-2 text-sm leading-7 text-gray-600">Have your information and supporting documents ready. Paid registrations must be connected to the existing backend and Paystack before applications can be submitted.</p><a href="mailto:agrotradehubs@gmail.com?subject=Membership%20payment%20and%20refund%20policy" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#267653] hover:underline">Request the payment and refund policy <ArrowRight size={15} /></a></div></div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ id, name, fee, icon: Icon }) => (
              <button type="button" key={id} onClick={() => chooseCategory(id)} aria-pressed={activeCategory === id} className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-left transition sm:p-5 ${activeCategory === id ? "border-[#267653] ring-2 ring-[#267653]/15" : "border-gray-200 hover:border-[#9dbca4]"}`}>
                <span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4e5] text-[#267653]"><Icon size={20} /></span><span className="min-w-0"><span className="block text-sm font-semibold">{name}</span><span className="mt-1 block text-xs text-gray-500">{fee}</span></span></span>
                <ArrowRight size={18} className="shrink-0 text-gray-400" />
              </button>
            ))}
          </div>

          {selected && <div className="mt-8"><RegistrationWizard key={selected.id} category={selected} onClose={() => setActiveCategory(null)} /></div>}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 sm:p-9 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf4e5] text-[#267653]"><Users size={24} /></div><div><h2 className="text-2xl font-semibold">Our members</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-gray-600">Meet the Agro Trade Hub community and discover people and organisations working together across agriculture.</p></div></div>
          <a href="mailto:agrotradehubs@gmail.com?subject=Agro%20Trade%20Hub%20Membership" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#176b45] px-6 py-3 text-sm font-semibold text-white hover:bg-[#105438]">Contact our team <ArrowRight size={17} /></a>
        </div>
      </section>
    </main>
  );
}
