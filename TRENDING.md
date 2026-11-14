# Trending Topics Integration (trending.py)

This document explains the lightweight trending topics integration added to the Kids Video Generator.

Overview

- trending.py provides a small, pluggable API to obtain trending keywords that can be fed into the generators.
- It intentionally avoids hard dependencies. `pytrends` is used only if installed; otherwise the module falls back to local files.

How to use

1. Local JSON source
- Create `trending_sample.json` with structure: `{ "trending": ["Slime", "Puppies", "Space Facts"] }`
- Example: `python -c "from trending import TrendingFetcher; print(TrendingFetcher().get_from_local_json('trending_sample.json'))"`

2. Local CSV source
- A simple CSV with one topic per row will work. Use `get_from_local_csv(path)`.

3. Optional: Google Trends via pytrends
- Install pytrends: `pip install pytrends`
- The method `get_from_pytrends()` will return related queries for default starter keywords or for an explicit keyword list.

Why this is useful

- Quickly seed the content generator with currently trending kid-friendly topics.
- Keeps the codebase flexible: teams can plug in their own data sources or extend the module to call other APIs.

Next steps

- Add scheduled job to refresh trending.json daily from a trusted API.
- Add safe-filtering rules to remove adult/unsafe topics before passing to generators.
- Integrate with advanced-video-generator to bias music/style based on trends.
