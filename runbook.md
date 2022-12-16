<!--
    Written in the format prescribed by https://github.com/Financial-Times/runbook.md.
    Any future edits should abide by this format.
-->
# lure-api

This api is used to power the onward journey components at the top and bottom of the article page

## Code

next-lure-api

## Primary URL

https://www.ft.com/lure

## Service Tier

Bronze

## Lifecycle Stage

Production

## Host Platform

heroku

## Architecture

This app is hit by next-article client side and provides related content from elastic search for onward journeys.

## Contains Personal Data

No

## Contains Sensitive Data

No

## Can Download Personal Data

No

## Can Contact Individuals

No

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

## Heroku Pipeline Name

https://dashboard.heroku.com/pipelines/601193e7-fe09-4234-96a7-c9816a6248ea

## Key Management Process Type

PartiallyAutomated

## Key Management Details

You can read about how to rotate an AWS key [over on the Customer Products Wiki](https://customer-products.in.ft.com/wiki/Rotating-AWS-Keys)
See the Customer Products [key management and troubleshooting wiki page](https://customer-products.in.ft.com/wiki/Key-Management-and-Troubleshooting)

<!-- Placeholder - remove HTML comment markers to activate
## Monitoring
Enter descriptive text satisfying the following:
Details of any monitoring this system has.

...or delete this placeholder if not applicable to this system
-->

## First Line Troubleshooting

*   check dyno health on heroku
*   check elastic search is working

## Second Line Troubleshooting

*   check splunk `index=heroku source="next-lure-api" sourcetype="heroku:app"`
