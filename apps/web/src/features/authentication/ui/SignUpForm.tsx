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

import { signInWithGoogle as handleSignInWithGoogle } from '../api/sign-in-with-google'
import { signUp } from '../api/sign-up'

interface SignUpFormProps extends React.ComponentProps<'div'> {}

export const SignUpForm: React.FC<SignUpFormProps> = ({ className, ...props }) => {
  const { t } = useTranslation('auth')

  const signUpFormSchema = z.object({
    name: z.string().min(1, { error: t('validation.name.required') }),
    email: z.email({
      error: (issue) =>
        typeof issue.input === 'string' && issue.input.length === 0
          ? t('validation.email.required')
          : t('validation.email.invalid'),
    }),
    password: z.string().min(8, { error: t('validation.password.minimum', { count: 8 }) }),
    confirmPassword: z.string().min(8, { error: t('validation.password.minimum', { count: 8 }) }),
  })

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
    onSubmit: ({ value }) => {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void form.handleSubmit()
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t('signUp.title')}</CardTitle>
          <CardDescription>{t('signUp.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <form.AppField name="name">
                {(field) => (
                  <field.TextField
                    label={t('fields.name.label')}
                    name="name"
                    type="text"
                    placeholder={t('fields.name.placeholder')}
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="email">
                {(field) => (
                  <field.TextField
                    label={t('fields.email.label')}
                    name="email"
                    type="email"
                    placeholder={t('fields.email.placeholder')}
                    required
                    description={t('fields.email.description')}
                  />
                )}
              </form.AppField>
              <form.AppField name="password">
                {(field) => (
                  <field.TextField
                    label={t('fields.password.label')}
                    name="password"
                    type="password"
                    placeholder="********"
                    required
                    description={t('fields.password.description', { count: 8 })}
                  />
                )}
              </form.AppField>
              <form.AppField name="confirmPassword">
                {(field) => (
                  <field.TextField
                    label={t('fields.confirmPassword.label')}
                    name="confirmPassword"
                    type="password"
                    placeholder="********"
                    required
                    description={t('fields.confirmPassword.description')}
                  />
                )}
              </form.AppField>

              <FieldGroup>
                <Field>
                  <form.AppForm>
                    <form.SubmitButton label={t('signUp.submit')} />
                  </form.AppForm>
                  <Button variant="outline" type="button" onClick={handleSignInWithGoogle}>
                    {t('providers.google.action')}
                  </Button>
                  <FieldDescription className="px-6 text-center">
                    <Trans t={t} i18nKey="signUp.hasAccount" components={{ signIn: <Link to="/sign-in" /> }} />
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
