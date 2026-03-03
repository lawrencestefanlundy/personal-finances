"""
Search personal Gmail for angel investment confirmation emails.
Checks investment amounts and currencies (GBP vs EUR) for each company.
"""

import sys

sys.path.insert(0, "/Users/lawrencelundy-bryan/projects/gmail-tools")

from auth import authenticate  # noqa: E402
from gmail_search import search_emails  # noqa: E402

gmail = authenticate("lawrencestefanlundy@gmail.com")

companies = [
    ("Nevermined", "Nevermined"),
    ("Catapult", "Catapult"),
    ("Peek / Bluejay", "Peek OR Bluejay"),
    ("Uhubs", "Uhubs"),
    ("Charm", "Charm"),
    ("Rain Neuromorphics", "Rain"),
    ("Telesqobe", "Telesqobe"),
    ("Upside Money", "Upside"),
    ("Callosum", "Callosum"),
]

for label, query_term in companies:
    print(f"\n{'=' * 60}")
    print(f"  {label}")
    print(f"{'=' * 60}")
    query = (
        f"{query_term} "
        f"(investment OR SAFE OR subscription OR signed OR DocuSign "
        f"OR transfer OR wire OR EUR OR GBP OR amount OR receipt)"
    )
    results = search_emails(gmail, query, max_results=5)
    if not results:
        print("  No results found.")
    for msg in results:
        print(f"  Date: {msg['date']}")
        print(f"  From: {msg['from']}")
        print(f"  Subject: {msg['subject']}")
        print(f"  Snippet: {msg['snippet'][:250]}")
        print()
