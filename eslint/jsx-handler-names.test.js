import { RuleTester } from 'eslint'

import { jsxHandlerNames } from '../apps/frontend/eslint-rules/jsx-handler-names.js'

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } })

tester.run('jsx-handler-names', jsxHandlerNames, {
  valid: [
    'const handleClick = () => {}; const element = <button onClick={handleClick} />',
    'const element = <button onClick={() => save()} />',
    'function Button({ onClick }) { return <button onClick={onClick} /> }',
    'function Button({ onClose: close }) { return <button onClick={close} /> }',
    'function Button(props) { const { onClose } = props; return <button onClick={onClose} /> }',
    'function Button(props) { return <button onClick={props.onClose} /> }',
    'const element = <button onClick={form.handleSubmit} />',
    'const element = <Component render={renderContent} />',
  ],
  invalid: [
    {
      code: 'const save = () => {}; const element = <button onClick={save} />',
      errors: [{ message: /should be named to match/ }],
    },
    {
      code: 'const onClick = () => {}; const element = <button onClick={onClick} />',
      errors: [{ message: /should be named to match/ }],
    },
    {
      code: 'const element = <button onClick={actions.save} />',
      errors: [{ message: /should be named to match/ }],
    },
    {
      code: 'function Button(props) { const { onClick } = actions; return <button onClick={onClick} /> }',
      errors: [{ message: /should be named to match/ }],
    },
    {
      code: 'const first = second; const second = first; const element = <button onClick={first} />',
      errors: [{ message: /should be named to match/ }],
    },
  ],
})
