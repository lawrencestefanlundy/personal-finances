#!/usr/bin/env python3
"""
Fetch Monzo transaction notifications from Gmail and output as JSON
for import into the finance dashboard.

Usage:
    python scripts/fetch-monzo-transactions.py [--max-results 500] [--output transactions.json]

Requires:
    pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client
"""

import sys
import json
import re
import argparse
from datetime import datetime

# Add gmail-tools to path
sys.path.insert(0, '/Users/lawrencelundy-bryan/Projects/gmail-tools')

from auth import authenticate
from gmail_search import search_emails


def parse_monzo_subject(subject: str) -> dict | None:
    """
    Parse Monzo notification email subjects into transaction data.

    Common patterns:
      💳 £12.50 at Tesco Express
      💳 £5.00 at Transport for London
      💰 £1,500.00 from LAWRENCE LUNDY-BRYAN
      💰 £50.00 from Monzo Interest
    """
    # Debit pattern: 💳 £XX.XX at Merchant
    debit = re.match(r'💳\s*£([\d,]+\.?\d*)\s+at\s+(.+)', subject)
    if debit:
        amount_str = debit.group(1).replace(',', '')
        merchant = debit.group(2).strip()
        return {
            'amount': -float(amount_str),  # negative = debit
            'description': merchant,
        }

    # Credit pattern: 💰 £XX.XX from Source
    credit = re.match(r'💰\s*£([\d,]+\.?\d*)\s+from\s+(.+)', subject)
    if credit:
        amount_str = credit.group(1).replace(',', '')
        source = credit.group(2).strip()
        return {
            'amount': float(amount_str),  # positive = credit
            'description': source,
        }

    # Declined pattern (skip)
    if '❌' in subject or 'declined' in subject.lower():
        return None

    # Generic fallback for other Monzo subjects
    amount_match = re.search(r'£([\d,]+\.?\d*)', subject)
    if amount_match:
        amount_str = amount_match.group(1).replace(',', '')
        return {
            'amount': -float(amount_str),
            'description': subject,
        }

    return None


def parse_date(date_str: str) -> str:
    """Parse email date string to ISO format."""
    try:
        # Gmail returns dates like 'Thu, 5 Dec 2024 12:34:56 +0000'
        for fmt in [
            '%a, %d %b %Y %H:%M:%S %z',
            '%d %b %Y %H:%M:%S %z',
            '%a, %d %b %Y %H:%M:%S %Z',
        ]:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        # Fallback: try dateutil
        from dateutil import parser as date_parser
        dt = date_parser.parse(date_str)
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return datetime.now().strftime('%Y-%m-%d')


def main():
    parser = argparse.ArgumentParser(description='Fetch Monzo transactions from Gmail')
    parser.add_argument('--max-results', type=int, default=500, help='Max emails to fetch')
    parser.add_argument('--output', type=str, default='transactions.json', help='Output file')
    parser.add_argument('--account', type=str, default='lawrencestefanlundy@gmail.com',
                        help='Gmail account to search')
    args = parser.parse_args()

    print(f'Authenticating as {args.account}...')
    gmail = authenticate(args.account)

    print(f'Searching for Monzo emails (max {args.max_results})...')
    emails = search_emails(gmail, 'from:monzo.com subject:💳 OR subject:💰', args.max_results)
    print(f'Found {len(emails)} Monzo notification emails')

    transactions = []
    skipped = 0

    for email in emails:
        subject = email.get('subject', '')
        parsed = parse_monzo_subject(subject)
        if not parsed:
            skipped += 1
            continue

        tx = {
            'id': f'monzo-{email["id"]}',
            'date': parse_date(email.get('date', '')),
            'description': parsed['description'],
            'amount': parsed['amount'],
            'source': 'monzo',
            'emailId': email['id'],
        }
        transactions.append(tx)

    # Sort by date descending
    transactions.sort(key=lambda t: t['date'], reverse=True)

    print(f'Parsed {len(transactions)} transactions ({skipped} skipped)')

    with open(args.output, 'w') as f:
        json.dump(transactions, f, indent=2)

    print(f'Written to {args.output}')


if __name__ == '__main__':
    main()
