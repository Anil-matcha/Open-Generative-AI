"""
trending.py
Simple, pluggable trending topics fetcher for the Kids Video Generator.
Supports local-file sources and optional pytrends integration when available.
"""
from typing import List, Dict, Optional
import json
import csv
import os


class TrendingFetcher:
    """Fetch trending topics from multiple sources.

    Methods are best-effort and fail gracefully so the repo has no hard runtime
    dependency on external APIs.
    """

    def get_from_local_json(self, path: str, key: str = "trending") -> List[str]:
        """Read trending topics from a local JSON file.

        JSON format example:
        { "trending": ["Slime", "Puppies", "Space Facts"] }
        """
        if not os.path.exists(path):
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get(key, []) if isinstance(data, dict) else []
        except Exception:
            return []

    def get_from_local_csv(self, path: str, column: int = 0, limit: Optional[int] = 20) -> List[str]:
        """Read trending topics from a simple CSV (one topic per row or a column).
        Returns up to `limit` rows.
        """
        if not os.path.exists(path):
            return []
        topics = []
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.reader(f)
                for i, row in enumerate(reader):
                    if i >= (limit or 1000):
                        break
                    if len(row) > column:
                        val = row[column].strip()
                        if val:
                            topics.append(val)
        except Exception:
            return []
        return topics

    def get_from_pytrends(self, kw_list: Optional[List[str]] = None, geo: str = "US") -> List[str]:
        """Try to fetch related trending queries using pytrends if installed.

        Returns a list of related queries or an empty list if pytrends is not available.
        """
        try:
            from pytrends.request import TrendReq
        except Exception:
            # pytrends not installed or import error
            return []

        try:
            pytrends = TrendReq(hl='en-US', tz=360)
            if not kw_list:
                # default starter keywords for kids content
                kw_list = ["kids crafts", "cute animals", "science experiments"]
            pytrends.build_payload(kw_list, cat=0, timeframe='now 7-d', geo=geo, gprop='')
            related = pytrends.related_queries()
            results = []
            for k, v in related.items():
                if isinstance(v, dict) and v.get('top') is not None:
                    results.extend([str(x[0]) for x in v['top'].values if len(x) > 0])
            # dedupe while preserving order
            seen = set()
            deduped = []
            for r in results:
                if r not in seen:
                    seen.add(r)
                    deduped.append(r)
            return deduped
        except Exception:
            return []


def example_usage():
    t = TrendingFetcher()
    print("Local JSON example:", t.get_from_local_json("trending_sample.json"))
    print("Local CSV example:", t.get_from_local_csv("trending_sample.csv"))
    print("Pytrends example (optional):", t.get_from_pytrends())


if __name__ == "__main__":
    example_usage()
