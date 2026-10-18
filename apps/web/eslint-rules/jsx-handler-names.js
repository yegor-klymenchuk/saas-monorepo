const DEFAULT_HANDLER_PREFIX = 'handle'
const DEFAULT_PROP_PREFIX = 'on'

/**
 * Creates an ESLint rule that enforces naming conventions
 * for JSX event handler props and their corresponding handler functions.
 *
 * @param {{eventHandlerPrefix?: string, eventHandlerPropPrefix?: string}} options
 * @returns {import("eslint").Rule.RuleModule}
 */
function createHandlerNamesRule(options = {}) {
  const handlerPrefix = options.eventHandlerPrefix ?? DEFAULT_HANDLER_PREFIX
  const propPrefix = options.eventHandlerPropPrefix ?? DEFAULT_PROP_PREFIX
  const propPattern = new RegExp(`^${propPrefix}[A-Z]`)
  const handlerPattern = new RegExp(`^${handlerPrefix}[A-Z]`)

  return (context) => ({
    JSXAttribute(node) {
      if (node.name.type !== 'JSXIdentifier' || !propPattern.test(node.name.name)) {
        return
      }

      if (node.value?.type !== 'JSXExpressionContainer') {
        return
      }

      const expression = node.value.expression
      const identifier = getHandlerIdentifier(expression)

      if (!identifier || handlerPattern.test(identifier.name)) {
        return
      }

      /* forwarding a prop as-is (destructured parameter, e.g. `onClick={onClose}`) is not a local handler */
      const isForwardedProp =
        expression.type === 'Identifier'
          ? isDestructuredParameter(context, expression)
          : propPattern.test(identifier.name)

      if (isForwardedProp) {
        return
      }

      context.report({
        node: identifier,
        message: `Handler for the "${node.name.name}" prop should be named to match /${handlerPattern.source}/.`,
      })
    },
  })
}

/**
 * The identifier bound to a JSX attribute value, e.g. `x` in `onClick={x}` or `onClick={props.x}`.
 *
 * @param {import("estree").Expression} expression
 * @returns {import("estree").Identifier | null}
 */
function getHandlerIdentifier(expression) {
  if (expression.type === 'Identifier') {
    return expression
  }

  if (expression.type === 'MemberExpression' && expression.property.type === 'Identifier') {
    return expression.property
  }

  return null
}

/**
 * Whether `identifier` resolves to a function parameter (e.g. a destructured prop) or to a
 * variable re-destructured from one (e.g. `const { onClose } = props;`), as opposed to a
 * locally declared handler variable/function.
 *
 * @param {import("eslint").Rule.RuleContext} context
 * @param {import("estree").Identifier} identifier
 * @param {Set<unknown>} [seen] - guards against re-visiting the same variable
 * @returns {boolean}
 */
function isDestructuredParameter(context, identifier, seen = new Set()) {
  const variable = resolveVariable(context, identifier)

  if (!variable || variable.defs.length === 0 || seen.has(variable)) {
    return false
  }

  seen.add(variable)

  return variable.defs.every((def) => isForwardedDefinition(context, def, seen))
}

/**
 * Whether `def` is itself a parameter, or a variable initialized directly from one
 * (e.g. `const { onClose } = props;`).
 *
 * @param {import("eslint").Rule.RuleContext} context
 * @param {import("eslint").Scope.Definition} def
 * @param {Set<unknown>} seen
 * @returns {boolean}
 */
function isForwardedDefinition(context, def, seen) {
  if (def.type === 'Parameter') {
    return true
  }

  const initializer = def.type === 'Variable' && def.node.type === 'VariableDeclarator' ? def.node.init : null

  return initializer?.type === 'Identifier' && isDestructuredParameter(context, initializer, seen)
}

/**
 * @param {import("eslint").Rule.RuleContext} context
 * @param {import("estree").Identifier} identifier
 * @returns {import("eslint").Scope.Variable | null}
 */
function resolveVariable(context, identifier) {
  for (let scope = context.sourceCode.getScope(identifier); scope; scope = scope.upper) {
    const variable = scope.variables.find((candidate) => candidate.name === identifier.name)

    if (variable) {
      return variable
    }
  }

  return null
}

export const jsxHandlerNames = {
  meta: {
    type: 'suggestion',
    schema: [],
    docs: { description: 'Use handle-prefixed local handlers and allow forwarded callback props' },
  },
  create: createHandlerNamesRule(),
}
