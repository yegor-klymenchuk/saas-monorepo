import { createFormHook } from '@tanstack/react-form'
import { createFormHookContexts } from '@tanstack/react-form'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from './field'
import { Input } from './input'
import { Button, ButtonProps } from './button'
import { FormItem } from './form-item'

export const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts()

type TextFieldProps = Omit<React.ComponentProps<'input'>, 'onChange' | 'onBlur' | 'value'> & {
  label: React.ReactNode
  labelExtra?: React.ReactNode
  orientation?: 'horizontal' | 'vertical' | 'responsive'
  required?: boolean
  description?: React.ReactNode
}

const TextField: React.FC<TextFieldProps> = (props) => {
  const { label, labelExtra, orientation, required, description, ...inputProps } = props

  return (
    <FormItem
      label={label}
      labelExtra={labelExtra}
      orientation={orientation}
      required={required}
      description={description}
    >
      {({ id, name, value, onChange, onBlur, hasErrors, alertId, required }) => (
        <Input
          id={id}
          name={name}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-required={required}
          aria-invalid={hasErrors ? hasErrors : undefined}
          aria-errormessage={hasErrors ? alertId : undefined}
          {...inputProps}
        />
      )}
    </FormItem>
  )
}

type SubmitButtonProps = Omit<ButtonProps, 'type'> & {
  label: React.ReactNode
}

const SubmitButton: React.FC<SubmitButtonProps> = (props) => {
  const { label, ...rest } = props

  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting} {...rest}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}

const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})

export {
  useAppForm,
  withForm,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
}
