import { Link } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { signIn } from '../api/sign-in'
import { signInWithGoogle } from '../api/sign-in-with-google'
import { cn } from '@/shared/lib'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  useAppForm,
} from '@/shared/ui'

const signInFormSchema = z.object({
  email: z.email({
    error: (issue) =>
      typeof issue.input === 'string' && issue.input.length === 0 ? 'Email is required' : 'Invalid email address',
  }),
  password: z.string().min(8, { error: 'Password must be at least 8 characters long' }),
})

interface SignInFormProps extends React.ComponentProps<'div'> {}

export const SignInForm: React.FC<SignInFormProps> = ({ className, ...props }) => {
  const signInMutation = useMutation({
    mutationFn: signIn,
  })

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: signInFormSchema,
    },
    onSubmit: ({ value }) => {
      signInMutation.mutate(value, {
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
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <form.AppField name="email">
                {(field) => <field.TextField label="Email" type="email" placeholder="m@example.com" required />}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    label="Password"
                    type="password"
                    required
                    labelExtra={
                      <a href="#" className="inline-block text-sm underline-offset-4 hover:underline">
                        Forgot your password?
                      </a>
                    }
                  />
                )}
              </form.AppField>

              <FieldGroup>
                <Field>
                  <form.AppForm>
                    <form.SubmitButton label="Login" />
                  </form.AppForm>
                  <Button variant="outline" type="button" onClick={signInWithGoogle}>
                    Continue with Google
                  </Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account? <Link to="/sign-up">Sign up</Link>
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
