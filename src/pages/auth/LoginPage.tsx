import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Admin form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Waiter form state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setHasError(false);

    let valid = true;
    if (!email) {
      setEmailError("Email or Username is required");
      valid = false;
    }
    if (!password || password.length < 5) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    if (!valid) {
      triggerErrorShake();
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      const data = await res.json();
      login(data.token, data.user.role === "admin" ? "admin" : "waiter");
      navigate("/admin/products");
    } catch {
      toast.error("Invalid credentials");
      triggerErrorShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaiterLogin = async (e: FormEvent) => {
    e.preventDefault();
    setPinError("");
    setHasError(false);

    if (!pin || pin.length < 4) {
      setPinError("PIN must be at least 4 digits");
      triggerErrorShake();
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        throw new Error("Invalid PIN");
      }
      const data = await res.json();
      login(data.token, "waiter");
      navigate("/pos/floor");
    } catch {
      toast.error("Invalid PIN");
      triggerErrorShake();
    } finally {
      setIsLoading(false);
    }
  };

  const triggerErrorShake = () => {
    setHasError(true);
    setTimeout(() => setHasError(false), 500); // reset after animation
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast("Contact your admin", { icon: "ℹ️" });
  };

  // Staggering inputs animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 font-sans text-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={hasError ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        transition={
          hasError 
            ? { duration: 0.4 } 
            : { type: "spring", bounce: 0.3, duration: 0.8 }
        }
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl shadow-amber-900/5 border border-amber-900/10 p-8"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4"
          >
            <span className="text-2xl text-amber-800 font-bold">☕</span>
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-amber-950">Odoo Cafe POS</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <Tabs defaultValue="waiter" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-xl bg-[#FDFBF7] p-1 border border-amber-900/5">
            <TabsTrigger value="waiter" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm">Waiter</TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="waiter">
            <motion.form 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleWaiterLogin} 
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="pin">PIN Code</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className={`h-12 text-center text-xl tracking-[0.5em] ${pinError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  maxLength={4}
                  autoComplete="off"
                />
                {pinError && <p className="text-sm text-red-500 mt-1">{pinError}</p>}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 mt-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-base"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                </Button>
              </motion.div>
            </motion.form>
          </TabsContent>

          <TabsContent value="admin">
            <motion.form 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleAdminLogin} 
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email">Username or Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-11 ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" onClick={handleForgotPassword} className="text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-11 ${passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-11 mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login as Admin"}
                </Button>
              </motion.div>
            </motion.form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
