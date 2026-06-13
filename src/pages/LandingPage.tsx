import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Coffee, 
  MonitorSmartphone, 
  LayoutDashboard, 
  ChefHat, 
  TerminalSquare,
  ArrowRight
} from "lucide-react";

const mainModules = [
  {
    title: "POS Terminal",
    description: "Waiter interface for taking orders, managing tables, and processing payments.",
    icon: MonitorSmartphone,
    to: "/pos/login",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Admin Dashboard",
    description: "Management portal for products, analytics, staff, and overall restaurant settings.",
    icon: LayoutDashboard,
    to: "/login",
    color: "from-amber-600 to-orange-600",
    bgLight: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Kitchen Display",
    description: "Real-time KDS board for chefs to view, prepare, and manage incoming orders.",
    icon: ChefHat,
    to: "/kitchen",
    color: "from-rose-500 to-red-600",
    bgLight: "bg-rose-50",
    iconColor: "text-rose-600",
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF6EE] to-[#F5ECD9] font-sans selection:bg-[#C8813A] selection:text-white flex flex-col">
      {/* Header / Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 text-[#5C4A32]"
        >
          <div className="bg-[#C8813A] p-2 rounded-xl text-white shadow-lg shadow-amber-900/20">
            <Coffee size={28} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black tracking-tight">Odoo Cafe POS</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link 
            to="/dev" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 hover:bg-white border border-[#E2D9C8] text-[#7A6650] font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <TerminalSquare size={18} />
            <span>Developer Routes</span>
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col justify-center relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-[#5C4A32] mb-6 tracking-tight leading-[1.1]"
          >
            Next-Gen Restaurant <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8813A] to-[#A0622A]">
              Management OS
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[#7A6650] leading-relaxed font-medium"
          >
            A unified point-of-sale platform designed specifically for cafes and restaurants. 
            Seamlessly connect your front-of-house staff, kitchen team, and management.
          </motion.p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {mainModules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link to={module.to} className="block group h-full">
                <div className="bg-white rounded-3xl p-8 border border-[#E2D9C8] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(200,129,58,0.2)] transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                  
                  {/* Decorative background glow */}
                  <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${module.color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="flex-1 relative z-10">
                    <div className={`w-16 h-16 rounded-2xl ${module.bgLight} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                      <module.icon className={module.iconColor} size={32} strokeWidth={2} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-[#5C4A32] mb-3 group-hover:text-[#C8813A] transition-colors">
                      {module.title}
                    </h2>
                    
                    <p className="text-[#7A6650] leading-relaxed font-medium">
                      {module.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-[#C8813A] font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 relative z-10">
                    Enter Portal <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-[#7A6650] font-medium opacity-80 mt-auto">
        <p>© 2026 Odoo Cafe POS. Built for high-performance hospitality.</p>
      </footer>

      {/* Background ambient shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#C8813A]/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#A0622A]/5 blur-[120px]" />
      </div>
    </div>
  );
}
