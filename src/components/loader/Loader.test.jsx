import { render } from '@testing-library/react'
import { describe, it } from 'vitest'
import Loader from './Loader'
describe('Loader', () => {
  it('render', () => {
    render(<Loader />)
  })
})