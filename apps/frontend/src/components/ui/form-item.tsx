import * as React from 'react'
import { useStore } from '@tanstack/react-form'

import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { useFieldContext } from './form'

type FormItemProps = {
  label: React.ReactNode
  labelExtra?: React.ReactNode
  description?: React.ReactNode
  orientation?: 'horizontal' | 'vertical' | 'responsive'
  required?: boolean
} & (
  | {
      children: (props: FormItemChildProps) => React.ReactNode
    }
  | {
      children: React.ReactElement
    }
)

type FormItemChildProps = {
  id: string
  name: string
  value: unknown
  onChange: (updater: unknown) => void
  onBlur: () => void
  hasErrors: boolean
  alertId: string
  required?: boolean
}

const FormItem: React.FC<FormItemProps> = (props) => {
  const { label, labelExtra, description, orientation, required, children } = props

  const alertId = React.useId()

  const field = useFieldContext()

  const errors = useStore(field.store, (state) => state.meta.errors)

  const hasErrors = errors && errors.length > 0

  const childProps: FormItemChildProps = {
    id: field.name,
    name: field.name,
    value: field.state.value,
    onChange: field.handleChange,
    onBlur: field.handleBlur,
    hasErrors,
    alertId,
    required,
  }

  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(childProps)
    } else {
      // React element - clone with injected props
      return React.cloneElement(children, {
        id: childProps.id as string,
        name: childProps.name,
        value: childProps.value,
        onChange: childProps.onChange,
        onBlur: childProps.onBlur,
        'aria-required': childProps.required,
        'aria-invalid': childProps.hasErrors ? childProps.hasErrors : undefined,
        'aria-errormessage': childProps.hasErrors ? childProps.alertId : undefined,
        ...(children.props as Record<string, unknown>),
      } as any)
    }
  }

  return (
    <Field orientation={orientation}>
      <div className="flex items-center mb-2">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {labelExtra && <div className="ml-auto">{labelExtra}</div>}
      </div>
      <div className="min-h-[32px] *:w-full">{renderChildren()}</div>
      <FieldDescription>{description}</FieldDescription>
      <FieldError id={alertId} errors={errors} />
    </Field>
  )
}

export { FormItem, type FormItemProps, type FormItemChildProps }
