import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ComunaCombobox } from './ComunaCombobox'
import { COMUNAS } from '../data/comunas'

function renderCombobox(initial = '') {
  const onChange = vi.fn()

  function Harness() {
    const [value, setValue] = useState(initial)
    return (
      <ComunaCombobox
        label="Ciudad o comuna"
        value={value}
        onChange={(v) => {
          onChange(v)
          setValue(v)
        }}
        placeholder="Ej: Concepción"
      />
    )
  }

  render(<Harness />)
  return { onChange }
}

const input = () => screen.getByRole('combobox', { name: 'Ciudad o comuna' })
const optionNames = () =>
  screen.queryAllByRole('option').map((o) => o.textContent?.replace(/Región.*$/, '').trim())

describe('ComunaCombobox — apertura', () => {
  it('starts closed', () => {
    renderCombobox()
    expect(input()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens with every comuna when focused', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.click(input())

    expect(input()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(COMUNAS.length)
  })

  it('shows the region next to each comuna', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'Ñuñoa')

    expect(screen.getByRole('option', { name: /Ñuñoa.*Región Metropolitana/ })).toBeInTheDocument()
  })

  it('closes on Escape and on blur', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.click(input())
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.click(input())
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.tab()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

describe('ComunaCombobox — filtrado al escribir', () => {
  it('filters the list as the user types', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCombobox()

    await user.type(input(), 'conce')

    expect(onChange).toHaveBeenLastCalledWith('conce')
    expect(optionNames()).toContain('Concepción')
    expect(optionNames()).not.toContain('Santiago')
    expect(screen.getAllByRole('option').length).toBeLessThan(10)
  })

  it('ignores accents and case', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'NUNOA')

    expect(optionNames()).toEqual(['Ñuñoa'])
  })

  it('puts comunas that start with the text before the ones that only contain it', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'san')

    const names = optionNames()
    const firstNonPrefix = names.findIndex((n) => !n!.toLowerCase().startsWith('san'))
    const lastPrefix = names.map((n) => n!.toLowerCase().startsWith('san')).lastIndexOf(true)
    expect(names[0]).toMatch(/^San/)
    expect(firstNonPrefix === -1 || firstNonPrefix > lastPrefix).toBe(true)
  })

  it('keeps filtering when the typed text is itself a comuna that prefixes others', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'Chillán')

    expect(optionNames()).toEqual(['Chillán', 'Chillán Viejo'])
  })

  it('offers every comuna again when reopening after picking one', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'conce')
    await user.click(screen.getByRole('option', { name: /^Concepción/ }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.click(input())

    expect(screen.getAllByRole('option')).toHaveLength(COMUNAS.length)
  })

  it('offers every comuna when the value was filled from outside (e.g. "Cerca de mí")', async () => {
    const user = userEvent.setup()
    renderCombobox('Concepción')

    await user.click(input())

    expect(screen.getAllByRole('option')).toHaveLength(COMUNAS.length)
  })
})

describe('ComunaCombobox — texto libre', () => {
  it('accepts text that is not a comuna and explains it', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCombobox()

    await user.type(input(), 'Av. Providencia 123')

    expect(input()).toHaveValue('Av. Providencia 123')
    expect(onChange).toHaveBeenLastCalledWith('Av. Providencia 123')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByRole('listbox')).toHaveTextContent(/sin comunas coincidentes/i)
  })

  it('keeps the typed text when the user leaves the field without picking', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'conce')
    await user.tab()

    expect(input()).toHaveValue('conce')
  })

  it('does not replace the text when pressing Enter with nothing highlighted', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'conce{Enter}')

    expect(input()).toHaveValue('conce')
  })
})

describe('ComunaCombobox — selección', () => {
  it('selects a comuna with the mouse and closes the list', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCombobox()

    await user.type(input(), 'conce')
    await user.click(screen.getByRole('option', { name: /^Concepción/ }))

    expect(onChange).toHaveBeenLastCalledWith('Concepción')
    expect(input()).toHaveValue('Concepción')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navigates with the arrow keys and selects with Enter', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCombobox()

    await user.type(input(), 'san')
    const [first, second] = screen.getAllByRole('option')

    await user.keyboard('{ArrowDown}')
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(input()).toHaveAttribute('aria-activedescendant', first.id)

    await user.keyboard('{ArrowDown}')
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(first).toHaveAttribute('aria-selected', 'false')
    expect(input()).toHaveAttribute('aria-activedescendant', second.id)

    await user.keyboard('{ArrowUp}')
    expect(first).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(second.textContent!.replace(/Región.*$/, '').trim())
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ArrowDown opens a closed list and highlights the first option', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.click(input())
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('does not move past the first or last option', async () => {
    const user = userEvent.setup()
    renderCombobox()

    await user.type(input(), 'nunoa') // una sola opción
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true')
  })
})
