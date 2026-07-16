/**
 * AWS Location reverse geocode → city/country (+ tag forms).
 */

const {
  LocationClient,
  SearchPlaceIndexForPositionCommand,
} = require('@aws-sdk/client-location');
const { placeTag } = require('./geo');

const client = new LocationClient({});
const INDEX = process.env.PLACE_INDEX_NAME;

/**
 * @returns {{ city: string|null, country: string|null, cityTag: string|null, countryTag: string|null }}
 */
async function reverseGeocode(latitude, longitude) {
  const empty = { city: null, country: null, cityTag: null, countryTag: null };
  if (!INDEX || latitude == null || longitude == null) return empty;

  try {
    const res = await client.send(new SearchPlaceIndexForPositionCommand({
      IndexName: INDEX,
      Position: [Number(longitude), Number(latitude)], // Lon, Lat
      MaxResults: 1,
      Language: 'en',
    }));

    const place = res.Results?.[0]?.Place;
    if (!place) return empty;

    const country = place.Country || null;
    const city =
      place.Municipality ||
      place.Neighborhood ||
      place.Region ||
      place.SubRegion ||
      null;

    return {
      city: city || null,
      country: country || null,
      cityTag: placeTag(city),
      countryTag: placeTag(country),
    };
  } catch (err) {
    console.error('Location reverse geocode failed:', err.message);
    return empty;
  }
}

module.exports = { reverseGeocode };
