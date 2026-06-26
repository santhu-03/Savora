import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  const strengthScore = [
    passwordValue.length >= 8,
    /[A-Z]/.test(passwordValue),
    /[0-9]/.test(passwordValue),
    /[^a-zA-Z0-9]/.test(passwordValue),
  ].filter(Boolean).length;

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError('root', { message: msg });
    }
  };

  return (
    <motion.div {...pageVariants} className="min-h-screen grid lg:grid-cols-2 bg-cream">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, #BF8B5E, transparent)' }} />
        </div>
        <Link to="/" className="font-heading text-3xl text-cream relative z-10">Savora</Link>
        <div className="relative z-10">
          <h2 className="font-heading text-4xl text-cream mb-4 leading-tight">
            Join India's finest<br />
            <span className="italic text-gold">dining community</span>
          </h2>
          <p className="font-body text-cream/40 text-sm leading-relaxed max-w-xs">
            Create your free account and start earning loyalty points, booking tables, and ordering from premium restaurants.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {['Free to join — no subscription', 'Earn 1 point per ₹10 spent', 'Exclusive member offers'].map(benefit => (
            <div key={benefit} className="flex items-center gap-2.5 text-cream/50 font-body text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
              {benefit}
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Link to="/" className="font-heading text-2xl text-primary">Savora</Link>
          </div>

          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.h1 variants={fadeUp} className="font-heading text-3xl text-primary mb-1">Create account</motion.h1>
            <motion.p variants={fadeUp} className="font-body text-sm text-charcoal/50 mb-8">
              Already have one?{' '}
              <Link to="/login" className="text-gold hover:text-gold-dark font-medium transition-colors">Sign in</Link>
            </motion.p>

            <motion.form variants={fadeUp} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full name"
                placeholder="Priya Sharma"
                leftIcon={<User size={15} className="text-charcoal/30" />}
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={15} className="text-charcoal/30" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="+91 98765 43210"
                leftIcon={<Phone size={15} className="text-charcoal/30" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  leftIcon={<Lock size={15} className="text-charcoal/30" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="text-charcoal/30 hover:text-charcoal/60">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                />
                {/* Strength indicator */}
                {passwordValue && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map(n => (
                      <div
                        key={n}
                        className={`flex-1 h-1 rounded-full transition-colors ${
                          n <= strengthScore
                            ? strengthScore <= 1 ? 'bg-red-400' : strengthScore <= 2 ? 'bg-amber-400' : strengthScore <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                            : 'bg-charcoal/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                leftIcon={<Lock size={15} className="text-charcoal/30" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {errors.root && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-body">
                  {errors.root.message}
                </div>
              )}

              <p className="font-body text-xs text-charcoal/35 leading-relaxed">
                By creating an account you agree to our{' '}
                <a href="#" className="text-gold hover:underline">Terms</a> and{' '}
                <a href="#" className="text-gold hover:underline">Privacy Policy</a>.
              </p>

              <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
                Create free account
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
