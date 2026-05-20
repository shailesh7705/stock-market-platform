import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { registerUser } from "../services/authService";
 
function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
 
  async function handleSignup(e) {
    e.preventDefault();
    try {
      await registerUser({ name, email, password });
      alert("Registration Successful");
    } catch (error) {
      console.log(error);
      alert("Signup Failed");
    }
  }
 
  return (
    <div className="text-white">
 
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Create Account</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Start tracking stocks with realtime intelligence.
        </p>
      </div>
 
      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-5">
 
        {/* Full Name */}
        <div>
          <label className="block mb-2 text-sm text-gray-300">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl
                       px-5 py-4 outline-none focus:border-green-500 transition-all"
          />
        </div>
 
        {/* Email */}
        <div>
          <label className="block mb-2 text-sm text-gray-300">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl
                       px-5 py-4 outline-none focus:border-green-500 transition-all"
          />
        </div>
 
        {/* Password */}
        <div>
          <label className="block mb-2 text-sm text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-2xl
                         px-5 py-4 outline-none focus:border-green-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2
                         text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
 
        {/* Submit — pt-6 gives breathing room above button */}
        <div className="pt-6">
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-600
                       font-semibold transition-all shadow-lg shadow-green-500/20"
          >
            Create Account
          </button>
        </div>
 
      </form>
    </div>
  );
}
 
export default Signup;