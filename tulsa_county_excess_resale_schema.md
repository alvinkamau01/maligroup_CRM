# Tulsa County Excess Resale Schema

## Table: `tulsa_county_excess_resale`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key, auto-increment |
| sale_year | integer | Year of the tax sale |
| owner_name | text | Name of the property owner |
| amount_of_excess | numeric | Amount of excess proceeds from the sale |
| parcel_number | text | Parcel identification number |
| certificate_number | text | Tax sale certificate number |
| amt_of_refund_or_transfer | numeric | Amount of refund or transfer |
| created_at | timestamp with time zone | Record creation timestamp |
| updated_at | timestamp with time zone | Record last update timestamp |

## Notes
- This table tracks excess proceeds from Tulsa County tax sale resales
- The `amount_of_excess` represents the surplus funds after taxes/liens are paid
- `certificate_number` links to the original tax sale certificate
- `amt_of_refund_or_transfer` tracks any refunds or transfers made