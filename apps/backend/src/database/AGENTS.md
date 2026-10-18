# Database schemas

- Keep each table in a separate file under `schema/`, using kebab-case names such as `credit-entry.ts`. Keep the table's relations and inferred types beside its definition
- Tables may share a file when they are tightly coupled and form one cohesive unit that is clearer to maintain together. A foreign-key relationship alone is not a reason to combine tables
