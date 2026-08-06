/**
 * Every cacheable read resource in the system. CachePolicy maps each of
 * these to its own TTL, so adding cache to a new use case never requires
 * touching that use case — only registering its resource here and
 * teaching the policy its TTL.
 */
export enum CacheResource {
  USER_PROFILE = 'USER_PROFILE',
  BARBER = 'BARBER',
  BARBERS_LIST = 'BARBERS_LIST',
  QUALIFICATIONS = 'QUALIFICATIONS',
  APPOINTMENT = 'APPOINTMENT',
  CUSTOMER_APPOINTMENTS = 'CUSTOMER_APPOINTMENTS',
  AVAILABLE_TIME_SLOTS = 'AVAILABLE_TIME_SLOTS',
  DASHBOARD_METRICS = 'DASHBOARD_METRICS',
  USER_METRICS = 'USER_METRICS',
  APPOINTMENT_METRICS = 'APPOINTMENT_METRICS',
  BARBER_METRICS = 'BARBER_METRICS',
  CUSTOMER_METRICS = 'CUSTOMER_METRICS',
  OCCUPATION_METRICS = 'OCCUPATION_METRICS',
}
