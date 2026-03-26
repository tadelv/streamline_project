---
name: Rea Prime API — workflow endpoint shape
description: The workflow PUT body uses a top-level `context` field (not `doseData`) for dose/yield/grinder data
type: project
---

The Rea Prime API workflow PUT body shape is:

```json
{
  "profile": { ... },
  "context": {
    "targetDoseWeight": 18.0,
    "targetYield": 37.0,
    "grinderModel": "Niche Zero",
    "grinderSetting": "5.2"
  }
}
```

**Why:** The API was updated to use `context` instead of the old `doseData` wrapper. The field names also changed: `doseIn` → `targetDoseWeight`, `doseOut` → `targetYield`.

**How to apply:** Any code calling `updateWorkflow` with dose/yield data must use the `context` key with the new field names. The `context` block is only sent when `profile.target_weight` is present.
