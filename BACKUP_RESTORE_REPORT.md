# BACKUP REPORT

- Date: 2026-08-03T15:06:34.082Z
- Run ID: 20260803-160634
- Scope: restore
- Result: **PASS**
- Duration: 9 ms
- Engine: backup-engine-v1 1.0.0

## Database
- Check: PASS
- Method: supabase_cli
- Artifact: backup-20260802-232248.sql.gz
- Size: 36132
- SHA256: 7625c0fd8460e287676f72c47327b257d4be3ebcc4bc5799f5355e8a22d24a33
- Message: Offline restore verification PASS

## Storage
- Check: SKIP
- Buckets: —
- Files: 0
- Size: —
- SHA256: —
- Message: Skipped

## Environment
- Check: SKIP
- Keys count: 0
- Artifact: —
- Message: Skipped

## Verification
- Check: PASS
- Dump exists: true
- Archive integrity: true
- Storage copied: true
- Checksum OK: true
- Message: Restore verification PASS (offline artifact drill)

## Retention
- Kept: 6
- Deleted: 0
- Max: 30

## Notes
- Secrets and connection strings are never written to logs.
- RESTORE VERIFY — offline artifact drill (no production DB write).
- Isolated live DB restore remains Owner-operated per BACKUP_RESTORE_GUIDE.md.
- Restore verify PASS: gunzip=true sha=true markers=true
