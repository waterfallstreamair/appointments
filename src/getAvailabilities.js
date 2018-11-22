import moment from 'moment'
import knex from 'knexClient'

export const getEvents = (date, kind, events) => {
  return events.filter(e => 
    e.kind === kind
    &&
    (
      (
        moment(date).isSame(e.starts_at, 'day') 
        || 
        moment(date).isSame(e.ends_at, 'day')
      )
      ||
      (
        e.weekly_recurring 
        &&
        (
          moment(date).day() == moment(e.starts_at).day()
          ||
          moment(date).day() == moment(e.ends_at).day()
        )
      )
    )
  )
}

export const getMinutes = (date) => {
  return moment(date).hours() * 60 + moment(date).minutes()
}

export const checkAppointments = (slot, appointments) => {
  return appointments.find(e => 
    getMinutes(slot) >= getMinutes(e.starts_at)
    &&
    getMinutes(slot) < getMinutes(e.ends_at)
  )
}

export const getSlots = (openings, appointments) => {
  const ranges = openings.map(e => {
    let slot = e.starts_at
    let slots = []
    while(slot < e.ends_at) {
      if (!checkAppointments(slot, appointments)) {
          slots = [...slots, moment(slot).format('h:mm')]
      }
      slot += 30 * 60 * 1000
    }
    return slots
  })
  return ranges.length ? ranges.reduce((t=[], e) => [...t, ...e]) : []
}

export const fetchEvents = async (date) => {
  if (!date) {
    return []
  }
  return knex('events')
    .where('starts_at', '>=', date)
    .andWhere('ends_at', '<=', moment(date).add(7, 'days').toDate())
    .orWhere({ weekly_recurring: true })
    .orderBy('starts_at')
}

export default async function getAvailabilities(date) {
  // Implement your algorithm here
  // https://doctolib.github.io/job-applications/
  const events = await fetchEvents(date)
  let days = []
  for(let i = 0; i < 7; i++) {
    const dayDate = moment(date).add(i, 'days')
    const openings = getEvents(dayDate, 'opening', events)
    const appointments = getEvents(dayDate, 'appointment', events)
    const slots = getSlots(openings, appointments)
    days = [
      ...days, 
      { 
        date: String(dayDate.toDate()), 
        slots
      }
    ]
  }
  return days
}
