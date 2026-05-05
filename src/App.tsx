import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Moon, 
  Shield, 
  Smile, 
  User, 
  Zap,
  ChevronDown,
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Plus,
  Minus,
  Brain,
  Wind,
  BookOpen,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  LogOut,
  Loader2
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { createUserProfile, saveMessage, getChatHistory, saveMood } from './services/dataService';
import { chatWithAI } from './services/geminiService';

// --- Types ---
type Page = 'home' | 'login' | 'signup' | 'loading';

// --- Components ---

const Navbar = ({ 
  user, 
  onOpenChat, 
  onNavigate 
}: { 
  user: FirebaseUser | null; 
  onOpenChat: () => void; 
  onNavigate: (page: Page) => void 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = () => {
    signOut(auth);
    onNavigate('home');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-4 shadow-sm' : 'py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 cursor-pointer outline-none">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Heart className="w-6 h-6 text-brand-text fill-brand-lavender" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">MindEase AI</span>
        </button>
        <div className="hidden md:flex items-center gap-8 text-brand-text font-medium text-sm lg:text-base">
          <a href="#about" onClick={(e) => { e.preventDefault(); onNavigate('home'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-brand-text-light transition-colors">About</a>
          <a href="#features" onClick={(e) => { e.preventDefault(); onNavigate('home'); setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="hover:text-brand-text-light transition-colors">Features</a>
          
          {user ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white">
                <div className="w-6 h-6 rounded-full bg-brand-lavender grid place-items-center text-[10px] font-bold">
                  {user.displayName?.[0] || 'U'}
                </div>
                <span className="text-sm font-bold">{user.displayName || 'User'}</span>
              </div>
              <button 
                onClick={handleSignOut}
                className="hover:text-brand-text-light transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => onNavigate('login')} className="hover:text-brand-text-light transition-colors cursor-pointer">Sign In</button>
          )}
          
          <div className="flex items-center gap-4">
            {!user && (
              <button 
                onClick={() => onNavigate('signup')}
                className="bg-white/50 border border-brand-text/10 px-6 py-2 rounded-full font-semibold hover:bg-white transition-all active:scale-95 cursor-pointer"
              >
                Get Started
              </button>
            )}
            <button 
              onClick={onOpenChat}
              className="bg-brand-text text-white px-6 py-2 rounded-full font-semibold hover:bg-neutral-800 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const AuthLayout = ({ title, subtitle, children, onToggle, toggleText, toggleAction }: { 
  title: string; 
  subtitle: string; 
  children: React.ReactNode;
  onToggle: () => void;
  toggleText: string;
  toggleAction: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="min-h-[80vh] flex items-center justify-center px-6 pt-32 pb-20"
  >
    <div className="glass w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-lavender rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-mint rounded-full blur-3xl opacity-50"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
            <Heart className="w-8 h-8 text-brand-text fill-brand-lavender" />
          </div>
          <h2 className="heading-md mb-2">{title}</h2>
          <p className="text-brand-text-light">{subtitle}</p>
        </div>
        
        {children}
        
        <div className="mt-8 text-center text-sm text-brand-text-light">
          {toggleText}{" "}
          <button onClick={onToggle} className="text-brand-text font-bold hover:underline cursor-pointer">
            {toggleAction}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const LoginForm = ({ onNavigate }: { onNavigate: (page: Page) => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onNavigate('home');
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Authentication Provider Disabled: Go to Firebase Console > Authentication > Sign-in method and enable "Email/Password".');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup Blocked: Please allow popups for this site to sign in with Google.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Continue your wellness journey"
      onToggle={() => onNavigate('signup')}
      toggleText="Don't have an account?"
      toggleAction="Sign Up"
    >
      <form className="space-y-4" onSubmit={handleLogin}>
        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">{error}</div>}
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-light opacity-50" />
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-white/50 border border-white/50 rounded-2xl py-3 px-12 focus:outline-none focus:ring-2 focus:ring-brand-lavender transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between px-1">
            <label className="text-sm font-semibold">Password</label>
            <button type="button" className="text-xs text-brand-text-light hover:text-brand-text">Forgot password?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-light opacity-50" />
            <input 
              required
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/50 border border-white/50 rounded-2xl py-3 px-12 focus:outline-none focus:ring-2 focus:ring-brand-lavender transition-all"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-light hover:text-brand-text cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <button 
          disabled={loading}
          className="w-full bg-brand-text text-white py-4 rounded-2xl font-bold mt-4 shadow-lg hover:bg-neutral-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-brand-text/5"></div>
          <span className="flex-shrink mx-4 text-xs text-brand-text-light uppercase tracking-widest font-bold">Or continue with</span>
          <div className="flex-grow border-t border-brand-text/5"></div>
        </div>
        
        <button 
          type="button"
          onClick={async () => {
            setLoading(true);
            try {
              const provider = new GoogleAuthProvider();
              const result = await signInWithPopup(auth, provider);
              await createUserProfile(result.user.uid, result.user.email || '', result.user.displayName || 'User');
              onNavigate('home');
            } catch (err: any) {
              console.error("Google Login Error:", err);
              if (err.code === 'auth/operation-not-allowed') {
                setError('Google Provider Disabled: Go to Firebase Console > Authentication > Sign-in method and enable "Google".');
              } else if (err.code === 'auth/popup-blocked') {
                setError('Popup Blocked: Please allow popups for this site to sign in with Google.');
              } else {
                setError(err.message);
              }
            } finally {
              setLoading(false);
            }
          }}
          className="w-full bg-white border border-brand-text/5 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all cursor-pointer"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
          Google
        </button>
      </form>
    </AuthLayout>
  );
};

const SignUpForm = ({ onNavigate }: { onNavigate: (page: Page) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile in Auth and local Firestore
      await updateProfile(user, { displayName: name });
      await createUserProfile(user.uid, user.email || '', name);
      
      // Force sync state for UI
      onNavigate('home');
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Registration Disabled: Go to Firebase Console > Authentication > Sign-in method and enable "Email/Password".');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup Blocked: Please allow popups for this site to sign in with Google.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Join MindEase" 
      subtitle="Start your journey to mental clarity"
      onToggle={() => onNavigate('login')}
      toggleText="Already have an account?"
      toggleAction="Sign In"
    >
      <form className="space-y-4" onSubmit={handleSignUp}>
        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">{error}</div>}
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-light opacity-50" />
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-white/50 border border-white/50 rounded-2xl py-3 px-12 focus:outline-none focus:ring-2 focus:ring-brand-lavender transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-light opacity-50" />
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-white/50 border border-white/50 rounded-2xl py-3 px-12 focus:outline-none focus:ring-2 focus:ring-brand-lavender transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-light opacity-50" />
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full bg-white/50 border border-white/50 rounded-2xl py-3 px-12 focus:outline-none focus:ring-2 focus:ring-brand-lavender transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-start gap-2 py-2">
          <input type="checkbox" className="mt-1 accent-brand-text" required />
          <p className="text-xs text-brand-text-light">
            I agree to the <span className="font-bold underline cursor-pointer">Terms of Service</span> and <span className="font-bold underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
        
        <button 
          disabled={loading}
          className="w-full bg-brand-text text-white py-4 rounded-2xl font-bold mt-2 shadow-lg hover:bg-neutral-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-brand-text/5"></div>
          <span className="flex-shrink mx-4 text-xs text-brand-text-light uppercase tracking-widest font-bold">Or continue with</span>
          <div className="flex-grow border-t border-brand-text/5"></div>
        </div>
        
        <button 
          type="button"
          onClick={async () => {
            setLoading(true);
            try {
              const provider = new GoogleAuthProvider();
              const result = await signInWithPopup(auth, provider);
              await createUserProfile(result.user.uid, result.user.email || '', result.user.displayName || 'User');
              onNavigate('home');
            } catch (err: any) {
              console.error("Google SignUp Error:", err);
              if (err.code === 'auth/operation-not-allowed') {
                setError('Google Provider Disabled: Go to Firebase Console > Authentication > Sign-in method and enable "Google".');
              } else if (err.code === 'auth/popup-blocked') {
                setError('Popup Blocked: Please allow popups for this site to sign in with Google.');
              } else {
                setError(err.message);
              }
            } finally {
              setLoading(false);
            }
          }}
          className="w-full bg-white border border-brand-text/5 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all cursor-pointer"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
          Google
        </button>
      </form>
    </AuthLayout>
  );
};

const Hero = ({ user, onOpenChat, onNavigate }: { user: FirebaseUser | null; onOpenChat: () => void; onNavigate: (p: Page) => void }) => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden flex flex-col items-center">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/50 border border-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span>24/7 AI Emotional Support</span>
          </div>
          <h1 className="heading-lg mb-6">
            Your Safe Space for <br />
            <span className="text-white drop-shadow-sm font-bold">Mental Wellness</span> Support
          </h1>
          <p className="body-text mb-8 max-w-lg">
            Experience compassionate, judgment-free emotional support anytime, anywhere. MindEase AI helps you navigate stress, anxiety, and daily challenges with science-backed conversations.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => user ? onOpenChat() : onNavigate('login')}
              className="bg-brand-text text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-neutral-800 transition-all shadow-xl active:scale-95 cursor-pointer"
            >
              {user ? 'Start Chat with AI' : 'Sign In to Start Chat'}
            </button>
            <button className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all hover:bg-white/30 border border-white/50 cursor-pointer">
              Explore Exercises
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-brand-lavender grid place-items-center overflow-hidden">
                  <img 
                    src={`https://i.pravatar.cc/100?u=${i + 10}`} 
                    alt="User" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-brand-text-light">
              <span className="text-brand-text font-bold">10,000+</span> users finding peace daily
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative z-10 w-full aspect-square rounded-[4rem] overflow-hidden shadow-2xl animate-float">
            <img 
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000&h=1000" 
              alt="Serene Scene" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/30 to-transparent"></div>
          </div>
          
          <div className="absolute top-1/4 -right-12 glass p-4 rounded-2xl shadow-lg z-20 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs font-bold">Privacy Guaranteed</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ... Rest of the sections (About, Features, HowItWorks, Testimonials, FAQ, Footer) stay similar ...
// (I will omit repetitive code for brevity but ensure they are included in the final file)

const About = () => (
    <section id="about" className="section-padding bg-white/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1 relative">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-64 rounded-3xl overflow-hidden shadow-lg">
                  <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=600" className="w-full h-full object-cover" alt="Yoga" referrerPolicy="no-referrer" />
                </div>
                <div className="h-40 rounded-3xl overflow-hidden shadow-lg bg-brand-lavender grid place-items-center p-6">
                  <Brain className="w-12 h-12 text-brand-text opacity-40" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-40 rounded-3xl overflow-hidden shadow-lg bg-brand-mint grid place-items-center p-6">
                  <Smile className="w-12 h-12 text-brand-text opacity-40" />
                </div>
                <div className="h-64 rounded-3xl overflow-hidden shadow-lg">
                  <img src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=400&h=600" className="w-full h-full object-cover" alt="Meditation" referrerPolicy="no-referrer" />
                </div>
              </div>
           </div>
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="heading-md mb-6 uppercase tracking-wider text-sm opacity-60">How We Help</h2>
          <h3 className="heading-lg mb-8">Compassionate Support for Your Digital Journey</h3>
          <p className="body-text mb-8">
            Life can be overwhelming, but you don't have to navigate it alone. MindEase AI is designed to be your constant companion, providing a non-judgmental space to vent, reflect, and grow.
          </p>
          <div className="space-y-6">
            {[
              { title: "Manage Stress", desc: "Proven strategies and conversations to lower cortisol levels." },
              { title: "Overcome Anxiety", desc: "CBT-based techniques to quiet the racing mind." },
              { title: "Daily Reflection", desc: "Prompts that help you understand your emotional patterns." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <span className="font-display font-bold text-lg">{idx + 1}</span>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">{item.title}</h4>
                  <p className="text-brand-text-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
);

const Features = () => {
    const features = [
      { icon: <Brain className="w-6 h-6" />, title: "Mood Tracking", desc: "Visualize your emotional journey with daily check-ins and insights.", color: "bg-blue-100" },
      { icon: <Wind className="w-6 h-6" />, title: "Guided Breathing", desc: "Instant calm with interactive breathwork sync guided by AI.", color: "bg-green-100" },
      { icon: <BookOpen className="w-6 h-6" />, title: "Journaling Assistant", desc: "Never face a blank page. Get thoughtful prompts for deep reflection.", color: "bg-purple-100" },
      { icon: <Shield className="w-6 h-6" />, title: "Anonymous Chat", desc: "Your identity stays private. Safe, secure, and encrypted conversations.", color: "bg-orange-100" },
      { icon: <Star className="w-6 h-6" />, title: "Daily Affirmations", desc: "Start your day with positive intent and personalized motivation.", color: "bg-yellow-100" },
      { icon: <Heart className="w-6 h-6" />, title: "Crisis Resources", desc: "Quick access to professional help when things get too heavy.", color: "bg-rose-100" }
    ];
    return (
      <section id="features" className="section-padding">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="heading-lg mb-6">Designed for Your Well-being</h2>
          <p className="body-text max-w-2xl mx-auto">Every feature is built with empathy and clinical research to provide the best possible support.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div key={idx} whileHover={{ y: -5 }} className="glass p-8 rounded-[2.5rem] hover:shadow-2xl transition-all border-none">
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>{feature.icon}</div>
              <h3 className="font-display font-bold text-2xl mb-4">{feature.title}</h3>
              <p className="text-brand-text-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    );
};

const HowItWorks = () => (
    <section id="how-it-works" className="section-padding bg-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 text-brand-text">
          <h2 className="heading-lg mb-6">Empathy in 3 Simple Steps</h2>
          <p className="body-text max-w-2xl mx-auto italic opacity-70">Beginning your journey towards mental clarity is easier than you think.</p>
        </div>
        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-brand-text/10 -translate-y-1/2 z-0"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
            {[
              { num: "01", title: "Sign Up", desc: "Create your secure, anonymous profile in seconds." },
              { num: "02", title: "Chat with AI", desc: "Start a conversation whenever you feel the need to talk." },
              { num: "03", title: "Track Progress", desc: "See your mood patterns and growth over time." }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-brand-text text-white flex items-center justify-center font-display font-black text-2xl mb-8 shadow-xl">
                  {step.num}
                </div>
                <h3 className="font-display font-bold text-2xl mb-4">{step.title}</h3>
                <p className="text-brand-text-light max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
);

const Testimonials = () => (
    <section className="section-padding overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="heading-lg text-center mb-16">Words from Our Community</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Sarah K.", role: "Student", text: "MindEase has been a lifesaver during finals week. It's like having a therapist in my pocket 24/7.", avatar: "11" },
            { name: "David M.", role: "Software Engineer", text: "The anonymous chat feature actually allowed me to open up about my burnout for the first time.", avatar: "12" },
            { name: "Maya R.", role: "Yoga Instructor", text: "The guided breathing exercises are so intuitive. I recommend this to all my students.", avatar: "13" }
          ].map((t, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[3rem] shadow-sm relative">
              <div className="absolute -top-6 left-10 w-12 h-12 bg-brand-lavender rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-brand-text" />
              </div>
              <p className="body-text mb-8 italic">"{t.text}"</p>
              <div className="flex items-center gap-4 border-t pt-8">
                <img src={`https://i.pravatar.cc/100?u=${t.avatar}`} className="w-12 h-12 rounded-full" alt={t.name} referrerPolicy="no-referrer" />
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-xs text-brand-text-light uppercase tracking-widest">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
);

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    { q: "Is my data truly private?", a: "Yes. All conversations are end-to-end encrypted and we do not store PII (Personally Identifiable Information) in a way that links back to you." },
    { q: "Can the AI replace a human therapist?", a: "While MindEase is incredibly supportive, it is not a medical professional. We recommend using it alongside professional help for severe conditions." },
    { q: "What happens in an emergency?", a: "The AI recognizes crisis signals and instantly provides verified hotlines and emergency resources for your region." },
    { q: "Is it free to use?", a: "We offer a generous free tier that includes 24/7 chat and basic exercises. Premium plans unlock deep advanced insights." }
  ];
  return (
    <section id="faq" className="section-padding bg-brand-lavender/20">
      <div className="max-w-3xl mx-auto">
        <h2 className="heading-lg text-center mb-16">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass rounded-3xl overflow-hidden">
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between font-bold text-xl cursor-pointer"
              >
                <span>{faq.q}</span>
                {openIdx === idx ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-6 pt-0 text-brand-text-light leading-loose text-base">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
    <footer className="bg-brand-text text-white/90 section-padding pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-brand-text fill-brand-lavender" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MindEase AI</span>
          </div>
          <p className="text-white/60 mb-6 max-w-xs text-sm">Democratizing mental wellness support with compassionate AI companions.</p>
          <div className="flex gap-4">
            <Twitter className="w-5 h-5 cursor-pointer hover:text-white transition-all" />
            <Instagram className="w-5 h-5 cursor-pointer hover:text-white transition-all" />
            <Linkedin className="w-5 h-5 cursor-pointer hover:text-white transition-all" />
          </div>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6">Product</h4>
          <ul className="space-y-4 text-white/60 text-sm">
            <li className="hover:text-white cursor-pointer transition-all">Daily Mood Track</li>
            <li className="hover:text-white cursor-pointer transition-all">Guided Exercises</li>
            <li className="hover:text-white cursor-pointer transition-all">AI Chatbot</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6">Company</h4>
          <ul className="space-y-4 text-white/60 text-sm">
            <li className="hover:text-white cursor-pointer transition-all">About Us</li>
            <li className="hover:text-white cursor-pointer transition-all">Privacy Policy</li>
            <li className="hover:text-white cursor-pointer transition-all">Security</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6">Support</h4>
          <p className="text-white/60 mb-4 text-sm">Need immediate help?</p>
          <button className="bg-white/10 border border-white/20 rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
            Get Crisis Resources
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
        <p>© 2024 MindEase AI. All rights reserved.</p>
        <p>Made for emotional well-being.</p>
      </div>
    </footer>
);

const ChatWidget = ({ 
  user,
  isOpen, 
  setIsOpen 
}: { 
  user: FirebaseUser | null;
  isOpen: boolean; 
  setIsOpen: (val: boolean) => void 
}) => {
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      // Load history
      getChatHistory(user.uid).then(history => {
        if (history && history.length > 0) {
          setMessages(history.map(m => ({ role: m.role, text: m.text })));
        } else {
          setMessages([{ role: 'ai', text: `Hi ${user.displayName || 'there'}! I’m MindEase. How are you feeling today?` }]);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue || !user) return;
    
    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    await saveMessage(user.uid, 'user', userMsg);
    
    setIsTyping(true);
    
    // Convert current messages to Gemini history format
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }]
    }));

    const aiResponse = await chatWithAI(userMsg, history);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    await saveMessage(user.uid, 'ai', aiResponse);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] md:w-[400px] h-[550px] rounded-[2rem] glass p-6 flex flex-col shadow-2xl overflow-hidden border-2 border-white/50"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-text rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">MindEase Assistant</h4>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Compassionate AI</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-black/5 p-2 rounded-full cursor-pointer">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-hide scroll-smooth">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.role === 'ai' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'ai' ? 'bg-white rounded-tl-none shadow-sm text-brand-text' : 'bg-brand-text text-white rounded-tr-none shadow-lg'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/50 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-brand-text rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-brand-text rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-brand-text rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-inner border border-brand-text/5">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={user ? "How are you feeling?" : "Please sign in to chat"} 
                disabled={!user || isTyping}
                className="w-full bg-transparent px-4 py-2 text-sm focus:outline-none disabled:opacity-50"
              />
              <button 
                onClick={handleSend}
                disabled={!user || isTyping}
                className="bg-brand-text text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:scale-100"
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronDown className="w-5 h-5 -rotate-90" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-20 h-20 bg-brand-text text-white rounded-full flex items-center justify-center shadow-2xl relative z-20 group cursor-pointer"
      >
        <MessageCircle className={`w-10 h-10 transition-all duration-500 ${isOpen ? 'rotate-90 opacity-0 scale-0' : 'rotate-0 opacity-100 scale-100'}`} />
        <Plus className={`w-10 h-10 absolute transition-all duration-500 ${isOpen ? 'rotate-45 opacity-100 scale-100' : 'rotate-0 opacity-0 scale-0'}`} />
        {!user && <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-lavender rounded-full border-4 border-white animate-pulse"></div>}
      </motion.button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('loading');
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (currentPage === 'loading') {
        setCurrentPage('home');
      }
    });
    return () => unsubscribe();
  }, [currentPage]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const renderPage = () => {
    if (currentPage === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-text/20" />
        </div>
      );
    }

    // Force login/signup if not authenticated
    if (!user) {
      return (
        <AnimatePresence mode="wait">
          {currentPage === 'signup' ? (
            <motion.div key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SignUpForm onNavigate={setCurrentPage} />
            </motion.div>
          ) : (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoginForm onNavigate={setCurrentPage} />
            </motion.div>
          )}
        </AnimatePresence>
      );
    }

    // Authenticated user view
    return (
      <motion.div
        key="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Hero user={user} onOpenChat={() => setIsChatOpen(true)} onNavigate={setCurrentPage} />
        <About />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen relative text-brand-text">
      <Navbar user={user} onOpenChat={() => user ? setIsChatOpen(true) : setCurrentPage('login')} onNavigate={setCurrentPage} />
      
      <main>
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </main>
      
      <Footer />
      <ChatWidget user={user} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      
      {/* Global Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-blue rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand-lavender rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute top-3/4 left-1/2 w-96 h-96 bg-brand-mint rounded-full blur-[120px] opacity-30 -translate-x-1/2"></div>
      </div>
    </div>
  );
}
