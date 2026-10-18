import { describe, expect, it } from 'vitest'
import { formatMoney, initials, remaining } from './format'

describe('remaining', () => {
  const now = Date.parse('2026-01-01T00:00:00Z')

  it('formatea horas, minutos y segundos', () => {
    expect(remaining('2026-01-01T01:02:03Z', 0, now).text).toBe('01:02:03')
  })

  it('incluye días cuando faltan más de 24 h', () => {
    expect(remaining('2026-01-03T00:00:05Z', 0, now).text).toBe('2d 00:00:05')
  })

  it('nunca es negativo', () => {
    expect(remaining('2025-12-31T00:00:00Z', 0, now)).toEqual({ ms: 0, text: '00:00:00' })
  })

  it('aplica el desfase del reloj del servidor', () => {
    // El servidor va 10 s adelantado: quedan 10 s menos de lo que cree el navegador.
    expect(remaining('2026-01-01T00:01:00Z', 10_000, now).text).toBe('00:00:50')
  })
})

describe('formato', () => {
  it('moneda en pesos', () => {
    expect(formatMoney(1500.5)).toBe('$1,500.50')
  })

  it('iniciales del nombre', () => {
    expect(initials('Eduardo Ramírez López')).toBe('ER')
    expect(initials('Ana')).toBe('A')
  })
})
