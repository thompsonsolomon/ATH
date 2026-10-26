
import "./index.css";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import Programs from "./pages/public/Programs";
import Gallery from "./pages/public/Galery";
import ContactUS from "./pages/public/ContactUS";
import Membership from "./pages/public/Membership";
import MembershipSuccess from "./pages/public/MembershipSuccess";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import MembershipVerification from "./pages/public/MembershipVerification";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/contact" element={<ContactUS />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/membership-success" element={<MembershipSuccess />}/>
      <Route path="/admin" element={<AdminDashboard />} />

<Route
  path="/verify-membership"
  element={<MembershipVerification />}
/>

    </Routes>
  );
}
