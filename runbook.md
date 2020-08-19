# lure-api
This api is used to power the onward journey components at the top and bottom of the article page

## Primary URL
https://www.ft.com/lure

## Delivered By
customer-products-content-discovery

## Supported By
customer-products-ops-cops

## Service Tier
Bronze

## Lifecycle Stage
Production

## Known About By
- thurston.tye

## Host Platform
heroku

## Architecture
This app is hit by next-article client side and provides related content from elastic search for onward journeys. 

## Contains Personal Data
No

## Contains Sensitive Data
No

## Dependencies
- next-esinterface


## Failover Architecture Type
ActiveActive

## Failover Process Type
Manual

## Failback Process Type
PartiallyAutomated

## Failover Details
Failover is for the whole of FT.com, rather than just for this app. Instructions for how to fail over FT.com are available [here in the Customer Products wiki](https://customer-products.in.ft.com/wiki/Failing-over-FT.com)

## Data Recovery Process Type
NotApplicable

## Data Recovery Details
NotApplicable

## Release Process Type
FullyAutomated

## Rollback Process Type
Manual

## Release Details
This app is hosted on Heroku and released using Circle CI.
Rollback is done manually on Heroku or Github. See [the guide on the wiki](https://customer-products.in.ft.com/wiki/How-does-deploying-our-Heroku-apps-work%3F) for instructions on how to deploy or roll back changes on Heroku.

## Key Management Process Type
PartiallyAutomated

## Key Management Details
You can read about how to rotate an AWS key [over on the Customer Products Wiki](https://customer-products.in.ft.com/wiki/Rotating-AWS-Keys)
See the Customer Products [key management and troubleshooting wiki page](https://customer-products.in.ft.com/wiki/Key-Management-and-Troubleshooting)

## Healthchecks
- ft-next-lure-api-eu.herokuapp.com-https
- ft-next-lure-api-us.herokuapp.com-https

## First Line Troubleshooting
- check dyno health on heroku
- check elastic search is working

## Second Line Troubleshooting
- check splunk `index=heroku search="*lure-api*"`
