'use strict';

module.exports = {
  MINIMUM_PLACE_RADIUS: 150,
  MAXIMUM_PLACE_RADIUS: 3000,
  PASSWORD_MIN_LENGTH: 4,
  circlePermissions: {
    OWNER: 'owner',
    ADMIN: 'admin',
    USER: 'user',
    NONE: 'none'
  },
  invitationAnswers: {
  	ACCEPT: 'accept',
  	REFUSE: 'refuse'
  },
  locationModes: {
    ANYTIME: 'anytime',
    PLACES_ONLY: 'places_only',
  },
  placeTypes: {
    PLACE: 'place',
    EVENT: 'event'
  }
}