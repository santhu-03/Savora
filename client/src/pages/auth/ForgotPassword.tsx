import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { pageVariants, stagger, fadeUp } from '@/lib/motion';
import { api } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/auth/forgot-password', data).then(r => r.data),
  });

  const onSubmit = (data: FormData) => mutate(data);

  return (
    <motion.div {...pageVariants} className="min-h-screen grid lg:grid-cols-2 bg-cream">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full opacity-10 blur-[100px]" style={{ background: 'radial-gradient(circle, #BF8B5E, transparent)' }} />
        <Link to="/" className="font-heading text-3xl text-cream relative z-10">Savora</Link>
        <div className="relative z-10">
          <h2 className="font-heading text-4xl text-cream mb-4 leading-tight">
            We'll get you<br />
            <span className="italic text-gold">back in quickly</span>
          </h2>
          <p className="font-body text-cream/40 text-sm">
            Enter your email and we'll send you a secure link to reset your password.
          </p>
        </div>
        <div className="relative z-10 font-body text-cream/25 text-xs">
          Secure password reset · Expires in 1 hour
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
            <motion.h1 variants={fadeUp} className="font-heading text-3xl text-primary mb-1">Forgot password?</motion.h1>
            <motion.p variants={fadeUp} className="font-body text-sm text-charcoal/50 mb-8">
              No worries — we'll send reset instructions to your email.
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
                <h2 className="font-heading text-2xl text-primary mb-2">Check your inbox</h2>
                <p className="font-body text-sm text-charcoal/50 mb-2">
                  We've sent a reset link to
                </p>
                <p className="font-body font-semibold text-sm text-primary mb-6">{getValues('email')}</p>
                <p className="font-body text-xs text-charcoal/35">
                  Didn't receive it?{' '}
                  <button onClick={() => mutate({ email: getValues('email') })} className="text-gold hover:underline">
                    Resend email
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.form variants={fadeUp} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail size={15} className="text-charcoal/30" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                {isError && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-body">
                    {error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" loading={isPending}>
                  Send reset link
                </Button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
