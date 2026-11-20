# Validation and interview walkthrough

[Português](../pt-br/validation.md) · [English](../../README.en.md)

## Documented November 2026 state

| Layer | Historical record |
| --- | --- |
| Software | Automated tests and station integration are recorded in the project report. |
| Deployment | Engine code was deployed with activation disabled. The station API was exercised. |
| Physical acceptance | Store activation depended on equipment and paper tests. The reviewed report listed this step as pending. |

**Provenance.** I reviewed the engine architecture, release decision, and physical acceptance checklist on GitHub on November 20, 2026. The case describes the snapshot recorded in those documents.

## Package demo

Run `node --test example/receipt-job.test.mjs`. Scenarios cover transport acceptance, binding to an attempt, recovery after a claim expires before dispatch, expiration during dispatch, and rejection of automatic resends after uncertainty. The example uses synthetic events with zero external dependencies and no hardware access.

## In an interview

1. Show the point where a communications failure can leave a print outcome uncertain.
2. Explain the difference between losing a claim before sending and losing the response after dispatch starts.
3. Describe how you would verify physical output, receipt readability, and behavior during a network interruption.
