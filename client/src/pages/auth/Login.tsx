import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, #BF8B5E, transparent)' }} />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full opacity-10 blur-[60px]" style={{ background: 'radial-gradient(circle, #A6523F, transparent)' }} />

      <Link to="/" className="font-heading text-3xl text-cream relative z-10">Savora</Link>

      <div className="relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-4xl text-cream mb-4 leading-tight"
        >
          Where every meal<br />
          <span className="italic text-gold">becomes a memory</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="font-body text-cream/40 text-sm leading-relaxed max-w-xs"
        >
          Sign in to access your reservations, track orders, and unlock loyalty rewards across India's finest restaurants.
        </motion.p>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {[['500+', 'Restaurants'], ['50K+', 'Diners'], ['4.8', 'Rating']].map(([val, lbl]) => (
          <div key={lbl}>
            <p className="font-heading text-xl text-gold">{val}</p>
            <p className="font-body text-xs text-cream/30">{lbl}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setError('root', { message: msg });
    }
  };

  return (
    <motion.div {...pageVariants} className="min-h-screen grid lg:grid-cols-2 bg-cream">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16 lg:py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Link to="/" className="font-heading text-2xl text-primary">Savora</Link>
          </div>

          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.h1 variants={fadeUp} className="font-heading text-3xl text-primary mb-1">Welcome back</motion.h1>
            <motion.p variants={fadeUp} className="font-body text-sm text-charcoal/50 mb-8">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold hover:text-gold-dark font-medium transition-colors">Sign up free</Link>
            </motion.p>

            <motion.form variants={fadeUp} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={15} className="text-charcoal/30" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock size={15} className="text-charcoal/30" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="text-charcoal/30 hover:text-charcoal/60">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="font-body text-xs text-gold hover:text-gold-dark transition-colors">
                  Forgot password?
                </Link>
              </div>

              {errors.root && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-body">
                  {errors.root.message}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
                Sign in
              </Button>
            </motion.form>

            <motion.div variants={fadeUp} className="mt-6">
              <div className="relative flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gold/15" />
                <span className="font-body text-xs text-charcoal/30">or continue with</span>
                <div className="flex-1 h-px bg-gold/15" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Google', 'Apple'].map(provider => (
                  <button
                    key={provider}
                    type="button"
                    className="flex items-center justify-center gap-2 py-2.5 border border-gold/15 rounded-xl text-sm font-body text-charcoal/60 hover:border-gold/30 hover:text-primary transition-colors"
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
