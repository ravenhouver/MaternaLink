# MaternaLink OpenAPI Notes

Swagger is served at `http://localhost:3000/api/docs`.

Documented tags:

- `master`: puskesmas, medicine, condition, symptom reference data
- `inputs`: monthly clinical, symptom, context, stock, and anamnesis inputs
- `forecast`: deterministic forecast run and result inspection
- `lplpo`: predictive LPLPO generation and filtering
- `distribution`: allocation planning, simulation, and alert inspection

## Design Boundary

`DATASET DIAGRAM.pdf`, `Master Data.pdf`, and `Rancangan.pdf` are treated as draft references, not a fixed database contract. The implementation is a normalized MVP aligned with `Problem Research .pdf`: remote maternal medicine stockouts, clinical demand signals, puskesmas context, cold-chain risk, and anticipatory logistics.

The API intentionally keeps the ML layer deterministic. Forecast output is generated from stock consumption and context buffer rules so database setup, ERD, Swagger, and workflow testing are reliable before a real forecasting model is added.

## Presentation Path

Use `docs/demo-flow.md` for the recommended API demo sequence.
