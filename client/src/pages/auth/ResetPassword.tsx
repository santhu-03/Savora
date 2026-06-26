import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { api } from '@/lib/api';

const schema = z.object({
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/auth/reset-password', { token, password: data.password }).then(r => r.data),
    onSuccess: () => {
      setTimeout(() => navigate('/login'), 2000);
    },
  });

  const onSubmit = (data: FormData) => {
    if (!token) return;
    mutate(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={36} className="text-copper mx-auto mb-4" />
          <h2 className="font-heading text-2xl text-primary mb-2">Invalid link</h2>
          <p className="font-body text-sm text-charcoal/50 mb-6">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password">
            <Button>Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div {...pageVariants} className="min-h-screen grid lg:grid-cols-2 bg-cream">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-10 blur-[100px]" style={{ background: 'radial-gradient(circle, #BF8B5E, transparent)' }} />
        <Link to="/" className="font-heading text-3xl text-cream relative z-10">Savora</Link>
        <div className="relative z-10">
          <h2 className="font-heading text-4xl text-cream mb-4 leading-tight">
            Create a new<br />
            <span className="italic text-gold">secure password</span>
          </h2>
          <p className="font-body text-cream/40 text-sm">
            Choose a strong password that you haven't used before.
          </p>
        </div>
        <div className="relative z-10 font-body text-cream/25 text-xs">
          Use a mix of letters, numbers, and symbols for best security
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-body text-sm text-charcoal/40 hover:text-primary transition-colors mb-8">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>

          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.h1 variants={fadeUp} className="font-heading text-3xl text-primary mb-1">Reset password</motion.h1>
            <motion.p variants={fadeUp} className="font-body text-sm text-charcoal/50 mb-8">
              Enter your new password below.
            </motion.p>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-600" />
                </div>
                <h2 className="font-heading text-2xl text-primary mb-2">Password updated!</h2>
                <p className="font-body text-sm text-charcoal/50 mb-2">Redirecting you to sign in…</p>
              </motion.div>
            ) : (
              <motion.form variants={fadeUp} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  leftIcon={<Lock size={15} className="text-charcoal/30" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="text-charcoal/30 hover:text-charcoal/60">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                  error={errors.password?.message}
                  hint="At least 8 characters, one uppercase, one number"
                  {...register('password')}
                />
                <Input
                  label="Confirm new password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your new password"
                  leftIcon={<Lock size={15} className="text-charcoal/30" />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                {isError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-body">
                    <AlertCircle size={14} />
                    {error instanceof Error ? error.message : 'This link has expired. Please request a new one.'}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" loading={isPending}>
                  Reset password
                </Button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
