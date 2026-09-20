import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventForm } from './EventForm'

// El mapa y la búsqueda de direcciones no son parte de lo que se prueba aquí: el LocationPicker se
// reemplaza por un botón que entrega una ubicación válida.
vi.mock('./map/LocationPicker.tsx', () => ({
  LocationPicker: ({
    onLocationChange,
  }: {
    onLocationChange: (data: { latitude: number; longitude: number; location: string }) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onLocationChange({
          latitude: -36.8261,
          longitude: -73.0493,
          location: 'Plaza Independencia, Concepción, Chile',
        })
      }
    >
      Elegir ubicación
    </button>
  ),
}))

// userEvent.type escribe tecla por tecla, como un usuario; fireEvent.change o fill() pondrían el
// valor completo de una vez y no reproducirían lo que pasa en cada pulsación.
function renderForm() {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(<EventForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />)
  return {
    user,
    onSubmit,
    title: screen.getByLabelText(/^Título/),
    description: screen.getByLabelText(/^Descripción/),
    date: screen.getByLabelText(/^Fecha/),
  }
}

describe('EventForm — escribir con el teclado conserva lo tecleado', () => {
  it('conserva los espacios entre palabras en el título', async () => {
    const { user, title } = renderForm()

    await user.type(title, 'Noche de jazz')

    expect(title).toHaveValue('Noche de jazz')
  })

  it('conserva los espacios entre palabras en la descripción', async () => {
    const { user, description } = renderForm()

    await user.type(description, 'Noche de jazz con invitados especiales')

    expect(description).toHaveValue('Noche de jazz con invitados especiales')
  })

  it('conserva el apóstrofe y la barra en el título', async () => {
    const { user, title } = renderForm()

    await user.type(title, "Rock's AC/DC")

    expect(title).toHaveValue("Rock's AC/DC")
  })

  it('conserva comillas y los signos < y > en la descripción', async () => {
    const { user, description } = renderForm()

    await user.type(description, 'Dijeron "hola" y <b>chao</b> / ok')

    expect(description).toHaveValue('Dijeron "hola" y <b>chao</b> / ok')
  })

  it('conserva los espacios al inicio y al final mientras se escribe (el recorte es al enviar)', async () => {
    const { user, title } = renderForm()

    await user.type(title, '  hola mundo  ')

    expect(title).toHaveValue('  hola mundo  ')
  })

  it('el contador de caracteres cuenta lo tecleado', async () => {
    const { user, title, description } = renderForm()

    await user.type(title, "Rock's AC/DC") // 12 caracteres
    await user.type(description, 'Noche de jazz') // 13 caracteres

    expect(screen.getByText('12/100 caracteres')).toBeInTheDocument()
    expect(screen.getByText('13/500 caracteres')).toBeInTheDocument()
  })
})

describe('EventForm — lo que llega a onSubmit', () => {
  async function fillAndSubmit(
    form: ReturnType<typeof renderForm>,
    values: { title: string; description: string }
  ) {
    await form.user.type(form.title, values.title)
    await form.user.type(form.description, values.description)
    await form.user.click(screen.getByRole('button', { name: 'Elegir ubicación' }))
    await form.user.type(form.date, '2031-05-05')
    await form.user.click(screen.getByRole('button', { name: 'Crear Evento' }))
  }

  it('recibe el título y la descripción idénticos a lo tecleado', async () => {
    const form = renderForm()
    const title = "Noche de jazz - Rock's AC/DC"
    const description = 'Con "invitados" y <b>negrita</b> en AC/DC, Rock\'s & más'

    await fillAndSubmit(form, { title, description })

    expect(form.onSubmit).toHaveBeenCalledTimes(1)
    expect(form.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title,
        description,
        location: 'Plaza Independencia, Concepción, Chile',
        date: '2031-05-05',
      })
    )
  })

  it('recorta los espacios al inicio y al final solo al enviar', async () => {
    const form = renderForm()

    await fillAndSubmit(form, {
      title: '  Noche de jazz  ',
      description: '  Una descripción suficientemente larga  ',
    })

    expect(form.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Noche de jazz',
        description: 'Una descripción suficientemente larga',
      })
    )
  })

  it('un título de 100 símbolos es válido: el largo cuenta lo tecleado, no su codificación', async () => {
    const form = renderForm()

    await fillAndSubmit(form, { title: '/'.repeat(100), description: 'Una descripción suficientemente larga' })

    expect(form.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '/'.repeat(100) }))
  })

  it('no envía si al recortar el título quedan menos de 3 caracteres', async () => {
    const form = renderForm()

    await fillAndSubmit(form, { title: '  ab  ', description: 'Una descripción suficientemente larga' })

    expect(screen.getByText('El título debe tener al menos 3 caracteres')).toBeInTheDocument()
    expect(form.onSubmit).not.toHaveBeenCalled()
  })
})
