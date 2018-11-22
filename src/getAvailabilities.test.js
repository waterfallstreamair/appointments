import knex from 'knexClient'
import getAvailabilities, {
  fetchEvents,
} from './getAvailabilities'

describe('getAvailabilities', () => {
  beforeEach(() => knex('events').truncate())

  describe('simple case', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2014-08-04 09:30'),
          ends_at: new Date('2014-08-04 12:30'),
          weekly_recurring: true,
        },
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-11 10:30'),
          ends_at: new Date('2014-08-11 11:30'),
        },
      ])
    })

    it('should fetch availabilities correctly', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-10'))
      expect(availabilities.length).toBe(7)

      expect(String(availabilities[0].date)).toBe(
        String(new Date('2014-08-10')),
      )
      expect(availabilities[0].slots).toEqual([])

      expect(String(availabilities[1].date)).toBe(
        String(new Date('2014-08-11')),
      )
      expect(availabilities[1].slots).toEqual([
        '9:30',
        '10:00',
        '11:30',
        '12:00',
      ])

      expect(availabilities[2].slots).toEqual([])

      expect(String(availabilities[6].date)).toBe(
        String(new Date('2014-08-16')),
      )
    })
    
    it('should find events', async () => {
      const date = new Date('2014-08-10')
      const events = await fetchEvents(date)
      expect(events.length).toBe(2)
      expect(events[0].kind).toBe('opening')
      expect(events[1].kind).toBe('appointment')
    })
    
  })
  
  describe('edge cases', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2018-11-22 10:00'),
          ends_at: new Date('2018-11-22 12:30'),
        },
        {
          kind: 'appointment',
          starts_at: new Date('2018-11-29 10:30'),
          ends_at: new Date('2018-11-29 11:30'),
        },
      ])
    })
    
    it('should check fetching', async () => {
      const openings = await fetchEvents()
      expect(openings.length).toBe(0)
    })
    
    it('should check openings', async () => {
      const openings = await knex('events')
        .whereNull('starts_at')
        .andWhere({ kind: 'opening' })
      expect(openings.length).toBe(0)
    })

    it('should check appointments', async () => {
      const appointments = await knex('events')
        .whereNull('weekly_recurring')
        .andWhere({ kind: 'appointment' })
      expect(appointments.length).toBe(1)
    })
    
    it('should check events', async () => {
      const starts = await knex('events')
        .whereNull('starts_at')
      expect(starts).toEqual([])
      const ids = await knex('events')
        .whereNull('id')
      expect(ids).toEqual([])
    })
  })
  
})
