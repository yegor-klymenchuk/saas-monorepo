import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup } from '@/components/ui/field'
import { Link } from '@tanstack/react-router'
import { useAppForm } from '@/components/ui/form'
import z from 'zod'
import { signUp } from '../actions/sign-up'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { signInWithGoogle } from '../actions/sign-in-with-google'

const signUpFormSchema = z.object({
  name: z.string().min(1, { error: 'Name is required' }),
  email: z.email({
    error: (issue) =>
      typeof issue.input === 'string' && issue.input.length === 0 ? 'Email is required' : 'Invalid email address',
  }),
  password: z.string().min(8, { error: 'Password must be at least 8 characters long' }),
  confirmPassword: z.string().min(8, { error: 'Password must be at least 8 characters long' }),
})

interface SignUpFormProps extends React.ComponentProps<'div'> {}

export const SignUpForm: React.FC<SignUpFormProps> = ({ className, ...props }) => {
  const signUpMutation = useMutation({
    mutationFn: signUp,
  })

  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: signUpFormSchema,
    },
    onSubmit: async ({ value }) => {
      signUpMutation.mutate(value, {
        onSuccess: () => {
          window.location.href = '/dashboard'
        },
        onError: (error) => {
          toast.info(error.message, { position: 'top-center' })
        },
      })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your information below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.TextField label="Full Name" name="name" type="text" placeholder="John Doe" required />
                )}
              </form.AppField>
              <form.AppField name="email">
                {(field) => (
                  <field.TextField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    description="We'll use this to contact you. We will not share your email with anyone else."
                  />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="********"
                    required
                    description="Must be at least 8 characters long."
                  />
                )}
              </form.AppField>
              <form.AppField name="confirmPassword">
                {(field) => (
                  <field.TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="********"
                    required
                    description="Please confirm your password."
                  />
                )}
              </form.AppField>

              <FieldGroup>
                <Field>
                  <form.AppForm>
                    <form.SubmitButton label="Create Account" />
                  </form.AppForm>
                  <Button variant="outline" type="button" onClick={signInWithGoogle}>
                    Continue with Google
                  </Button>
                  <FieldDescription className="px-6 text-center">
                    Already have an account? <Link to="/sign-in">Sign in</Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
