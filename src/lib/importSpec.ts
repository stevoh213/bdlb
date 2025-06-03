/**
 * @file Defines the CSV import format specification for climb records.
 */

/**
 * Enum for allowed climb types.
 */
export enum ClimbTypeSpec {
  SPORT = 'sport',
  TRAD = 'trad',
  BOULDER = 'boulder',
  TOP_ROPE = 'top rope',
  ALPINE = 'alpine',
}

/**
 * Enum for allowed send types.
 */
export enum SendTypeSpec {
  SEND = 'send',
  ATTEMPT = 'attempt',
  FLASH = 'flash',
  ONSIGHT = 'onsight',
  PROJECT = 'project',
}

/**
 * Interface defining the structure of a climb record in the CSV.
 */
export interface CsvClimb {
  /**
   * The name of the climb.
   * @remarks Required.
   * @example " Biographie"
   */
  name: string;

  /**
   * The grade of the climb.
   * @remarks Required.
   * @example "5.15a"
   */
  grade: string;

  /**
   * The type of climb.
   * @remarks Required. Must be one of the values from {@link ClimbTypeSpec}.
   * @example "sport"
   */
  type: ClimbTypeSpec;

  /**
   * The send type of the climb.
   * @remarks Required. Must be one of the values from {@link SendTypeSpec}.
   * @example "send"
   */
  send_type: SendTypeSpec;

  /**
   * The date of the climb.
   * @remarks Required. Expected format: YYYY-MM-DD.
   * @example "2023-10-27"
   */
  date: string;

  /**
   * The location of the climb.
   * @remarks Required.
   * @example "Ceuse, France"
   */
  location: string;

  /**
   * The number of attempts made on the climb.
   * @remarks Optional.
   * @example 3
   */
  attempts?: number;

  /**
   * The rating of the climb.
   * @remarks Optional. Expected format: 1-5 stars.
   * @example 4
   */
  rating?: number;

  /**
   * Any notes about the climb.
   * @remarks Optional.
   * @example "Felt harder than the grade suggests."
   */
  notes?: string;

  /**
   * The duration of the climb.
   * @remarks Optional. Expected format: HH:MM:SS.
   * @example "00:45:00"
   */
  duration?: string;

  /**
   * The elevation gain of the climb in meters.
   * @remarks Optional.
   * @example 300
   */
  elevation_gain?: number;

  /**
   * The color of the route in a gym.
   * @remarks Optional.
   * @example "Red"
   */
  color?: string;

  /**
   * The gym where the climb was done.
   * @remarks Optional.
   * @example "Movement RiNo"
   */
  gym?: string;

  /**
   * The country where the climb is located.
   * @remarks Optional.
   * @example "France"
   */
  country?: string;

  /**
   * Skills involved in the climb.
   * @remarks Optional. Comma-separated string.
   * @example "crimpy, dynamic, technical"
   */
  skills?: string;

  /**
   * Subjective stiffness of the climb.
   * @remarks Optional.
   * @example "Hard for the grade"
   */
  stiffness?: string;

  /**
   * Physical skills required for the climb.
   * @remarks Optional. Comma-separated string.
   * @example "power, endurance"
   */
  physical_skills?: string;

  /**
   * Technical skills required for the climb.
   * @remarks Optional. Comma-separated string.
   * @example "footwork, balance"
   */
  technical_skills?: string;
}
