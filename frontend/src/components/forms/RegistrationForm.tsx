import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, ShieldCheck } from 'lucide-react'
import { FormField } from '@/components/forms/FormField'
import { CountrySelect } from '@/components/forms/CountrySelect'
import { Button } from '@/components/common/Button'
import { registrationSchema, type RegistrationSchema } from '@/lib/validators'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { registrationFee } from '@/lib/stripeClient'
import { formatCurrency } from '@/lib/utils'
import { savePendingAuth, clearPendingAuth } from '@/lib/pendingAuth'
import { startRegistrationCheckout } from '@/lib/startCheckout'
import { useCreateDemoRegistration } from '@/hooks/useRegistrations'
import { useRegistrantStore } from '@/store/registrantStore'

function getRegistrationErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

function hasStripePublishableKey() {
  const key = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim()
  return key.startsWith('pk_') && !/xxx|your_/i.test(key)
}

export function RegistrationForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const createDemoRegistration = useCreateDemoRegistration()
  const setRegistrantId = useRegistrantStore((s) => s.setRegistrantId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationSchema>({ resolver: zodResolver(registrationSchema) })

  const onSubmit = async (values: RegistrationSchema) => {
    setSubmitting(true)
    try {
      // Original Stripe Checkout — same path locally and on Vercel.
      if (hasStripePublishableKey()) {
        clearPendingAuth()
        savePendingAuth(values.email, values.password)

        const { password: _password, confirmPassword: _confirm, ...checkoutFields } = values
        const checkout = await startRegistrationCheckout(checkoutFields)

        if ('clientSecret' in checkout && checkout.clientSecret) {
          const { saveCheckoutClientSecret } = await import('@/pages/public/RegisterCheckout')
          saveCheckoutClientSecret(checkout.clientSecret)
          navigate('/register/checkout')
          return
        }

        if ('url' in checkout && checkout.url) {
          window.location.assign(checkout.url)
          return
        }

        clearPendingAuth()
        throw new Error('Could not start checkout. Please try again.')
      }

      // Local/dev only — never fake a paid registration on the live site.
      if (!import.meta.env.PROD && !isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 900))
        const registration = await createDemoRegistration.mutateAsync({
          first_name: values.firstName,
          last_name: values.lastName,
          date_of_birth: values.dateOfBirth,
          city: values.city,
          country: values.country,
          phone: values.phone,
          email: values.email,
        })
        setRegistrantId(registration.id)
        savePendingAuth(values.email, values.password)
        toast.success('Demo mode: paid registration saved locally.')
        navigate('/register/success?demo=true')
        return
      }

      throw new Error(
        'Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY in your env (Vercel project settings for deploy).',
      )
    } catch (err) {
      clearPendingAuth()
      toast.error(getRegistrationErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs text-muted">
        Your player account opens <span className="font-semibold text-ink">only after payment succeeds</span>.
        If the card is declined, cancelled, or has no balance — no account is created and nothing is saved.
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="First Name" placeholder="Amara" error={errors.firstName?.message} {...register('firstName')} />
        <FormField label="Last Name" placeholder="Okafor" error={errors.lastName?.message} {...register('lastName')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
        <FormField label="City" placeholder="Lagos" error={errors.city?.message} {...register('city')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <CountrySelect label="Country" error={errors.country?.message} {...register('country')} />
        <FormField label="Phone Number" type="tel" placeholder="+234 801 234 5678" error={errors.phone?.message} {...register('phone')} />
      </div>

      <FormField label="Email Address" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 6 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <FormField
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      <p className="text-xs text-muted">
        After payment succeeds, this password unlocks <span className="font-semibold text-ink">Sign In</span> for your
        player profile.
      </p>

      <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-surface-light px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Registration Fee</p>
          <p className="text-xs text-muted">Charged only when payment completes</p>
        </div>
        <p className="text-h3 text-primary">{formatCurrency(registrationFee.amount, registrationFee.currency)}</p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full whitespace-normal"
        icon={submitting ? <Loader2 className="animate-spin" size={18} /> : undefined}
      >
        {submitting ? 'Redirecting…' : 'Register Now'}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck size={14} className="text-success" />
        Payments are securely processed by Stripe. Failed payments create no registration.
      </p>
    </form>
  )
}
