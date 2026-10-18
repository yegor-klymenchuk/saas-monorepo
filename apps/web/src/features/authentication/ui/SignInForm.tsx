import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import z from 'zod'

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

import { signIn } from '../api/sign-in'
import { signInWithGoogle as handleSignInWithGoogle } from '../api/sign-in-with-google'

interface SignInFormProps extends React.ComponentProps<'div'> {}

export const SignInForm: React.FC<SignInFormProps> = ({ className, ...props }) => {
  const { t } = useTranslation('auth')

  const signInFormSchema = z.object({
    email: z.email({
      error: (issue) =>
        typeof issue.input === 'string' && issue.input.length === 0
          ? t('validation.email.required')
          : t('validation.email.invalid'),
    }),
    password: z.string().min(8, { error: t('validation.password.minimum', { count: 8 }) }),
  })

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void form.handleSubmit()
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t('signIn.title')}</CardTitle>
          <CardDescription>{t('signIn.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <form.AppField name="email">
                {(field) => (
                  <field.TextField
                    label={t('fields.email.label')}
                    type="email"
                    placeholder={t('fields.email.placeholder')}
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    label={t('fields.password.label')}
                    type="password"
                    required
                    labelExtra={
                      <a href="#" className="inline-block text-sm underline-offset-4 hover:underline">
                        {t('signIn.forgotPassword')}
                      </a>
                    }
                  />
                )}
              </form.AppField>

              <FieldGroup>
                <Field>
                  <form.AppForm>
                    <form.SubmitButton label={t('signIn.submit')} />
                  </form.AppForm>
                  <Button variant="outline" type="button" onClick={handleSignInWithGoogle}>
                    {t('providers.google.action')}
                  </Button>
                  <FieldDescription className="text-center">
                    <Trans t={t} i18nKey="signIn.noAccount" components={{ signUp: <Link to="/sign-up" /> }} />
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
