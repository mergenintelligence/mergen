Place official source exports for the social stability import here.

Expected files:
- `vdem_country_year_core.csv`
  Source: V-Dem Country-Year Core CSV download.
  Required column: `v2x_libdem`
- `world_happiness.csv`
  Source: World Happiness Report figure/statistical appendix data. CSV is supported and `.xlsx` content is also accepted even if the filename stays `.csv`.
  Supported score columns: `life_ladder`, `ladder_score`, `happiness_score`, `life_evaluation`
- `wid_gini.csv`
  Source: WID.world manual export for the selected country.
  Current supported format is the wealth-share export that includes:
  - `p90p100` for `WID_TOP10_SHARE`
  - `p0p50` for `WID_BOTTOM50_SHARE`
- `cornell_strikes.csv`
  Source: Cornell ILR Labor Action Tracker annual export or manually prepared yearly totals.
  Expected columns are flexible, but should include:
  - `year`
  - one of `strike_count`, `stoppages`, `work_stoppages`, `count`, `value`
  - optional `country` / `location`
- `mainstream_vote_loss.csv`
  Source: manually prepared election-cycle series.
  Expected columns:
  - `year`
  - one of `vote_loss`, `mainstream_vote_loss`, `value`, `loss`
  Example:
  `year,vote_loss`
  `2012,0`
  `2016,1.8`
  `2020,0.9`
  `2024,2.4`

Country filter:
- Default country matching is `United States of America|United States|USA`
- Override with `MERGEN_COUNTRY_NAMES` in `.env.local`
