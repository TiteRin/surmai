#!/usr/bin/env python3
"""Disable outbound integrations in a pulled Surmai preview database.

The snapshot carries the live instance's settings, so a local backend started on
it would run the 15-minute email import against the real mailbox and call the
real LLM endpoint. This flips those two off before the copy is ever served.
"""

import json
import sqlite3
import sys

SETTINGS_TO_DISABLE = ("email_sync_config", "openai_endpoint_config")


def disable(connection, record_id):
    row = connection.execute(
        "SELECT value FROM surmai_settings WHERE id = ?", (record_id,)
    ).fetchone()

    if row is None:
        return f"{record_id}: absent, nothing to disable"

    value = json.loads(row[0]) if row[0] else {}
    value["enabled"] = False
    connection.execute(
        "UPDATE surmai_settings SET value = ? WHERE id = ?",
        (json.dumps(value), record_id),
    )
    return f"{record_id}: enabled=false"


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: neutralize_preview_data.py <path to data.db>")

    with sqlite3.connect(sys.argv[1]) as connection:
        try:
            for record_id in SETTINGS_TO_DISABLE:
                print(f"    {disable(connection, record_id)}")
        except sqlite3.OperationalError as error:
            sys.exit(
                f"cannot disable integrations ({error}) - the snapshot does not "
                "look like a Surmai database, refusing to treat it as safe"
            )


if __name__ == "__main__":
    main()
