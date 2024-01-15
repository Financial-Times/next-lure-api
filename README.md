
# next-lure-api
<img src="https://user-images.githubusercontent.com/447559/31726275-658368f2-b41e-11e7-82e7-100554b68858.png" align="right" width="400">Suggests articles and other content for a user to engage with based on context, user behaviour and other signals e.g. editorial curation

> "The great charm of fly-fishing is that we are always learning." ~ Theodore Gordon

> "There’s always a hot new fly. Precious few of these patterns are genuine breakthroughs destined to last for a hundred years, but more often they’re idle comments on existing traditions, explorations of half-baked theories, attempts to use new and interesting materials, to impress other tiers, or excuses to rename old patterns." ~ John Gierach

## Architecture

- heroku in 2 regions
- served directly on www.ft.com/lure for personalised responses

## Contract

### Request
- /content/{uuid}

Query strings
- slots = rhr or onward, defaults to both


### Response
JSON response on which one or more of the following keys - `rhr`, `onward`, `interstitial`, `banner` - contain an object with the following properties. Those with * are required
- *title
- titleHref
- concept (possibly with additional data to enable features related to the concept)
- positionHint
- styling/emphasisHint
- *recommendations: array, Each item may be:
	- a json to generate a teaser
	- a json to generate an n-concept card
	- ...
	In addition, each item must contain a property, `recommendationType`, detailing what kind of thing it is the data for. Some kind of styling hint may also be useful. Each item may contain a `adviceText` property to explain to the user why it is being recommended. Each item must send data for use in tracking the reason[s] a recommendation has been shown


May (in v1, for backwards compatibility) return an array of objects like the above

### Flags

There is a permanent mutlivariate test (MVT) flag called `onwardJourneyTests` that's used for testing new iterations of the onward journey on articles. Ideally we shouldn't be running more than one A/B or MVT test at a time because this makes test results confusing. The idea is to reuse the same flags for all tests and it will feel wrong to have multiple flags in use within the codebase.

## Running locally

```
git clone git@github.com:Financial-Times/next-lure-api.git
cd next-lure-api
npm install
npm start
```

Visit `https://local.ft.com:5050/lure/v2/content/<CONTENT_UUID>`
